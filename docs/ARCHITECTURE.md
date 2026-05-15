# Architecture - PS (Pirate Ship)

High-level overview of the PS application architecture, design patterns, and key components.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              React/Vite SPA Frontend                 │   │
│  │  - Components (Board, Card, Modal, Auth)            │   │
│  │  - Context API (Auth, User, Theme, Error)           │   │
│  │  - Axios HTTP Client (withCredentials: true)        │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS/HTTP
                         │ JWT Cookie + CORS
                         │
┌────────────────────────▼─────────────────────────────────────┐
│               NODE.JS/EXPRESS API SERVER                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Routes Layer (REST API Endpoints)                   │   │
│  │  - /auth (login, logout, change-password)            │   │
│  │  - /boards, /lists, /cards (CRUD operations)         │   │
│  │  - /users, /tags, /comments (resource endpoints)     │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Middleware Stack                                    │   │
│  │  - requestLogger (Winston logging)                   │   │
│  │  - verifyJWT (authentication)                        │   │
│  │  - validateRequest (Zod validation)                  │   │
│  │  - errorHandler (centralized errors)                 │   │
│  │  - helmet (security headers)                         │   │
│  │  - cors (cross-origin)                               │   │
│  │  - rateLimit (brute force protection)                │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Service/Business Logic Layer                        │   │
│  │  - Authentication (JWT, OAuth, Passport)             │   │
│  │  - Authorization checks                              │   │
│  │  - Business logic for each resource                  │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                       │
│  ┌────────────────────▼─────────────────────────────────┐   │
│  │  Data Access Layer (Prisma ORM)                      │   │
│  │  - Query builders for all models                     │   │
│  │  - Transactions & relationships                      │   │
│  │  - Schema validation                                 │   │
│  └────────────────────┬─────────────────────────────────┘   │
└────────────────────────┬─────────────────────────────────────┘
                         │ TCP/3306
                         │
┌────────────────────────▼─────────────────────────────────────┐
│              POSTGRESQL DATABASE                             │
│  - Users & Authentication                                    │
│  - Workspaces & Boards                                       │
│  - Lists, Cards, Comments                                    │
│  - Tags, Activity History                                    │
│  - Relationships & Constraints                               │
└──────────────────────────────────────────────────────────────┘
```

## 🔐 Authentication Flow

### JWT Cookie-Based Authentication

```
LOGIN REQUEST
    │
    ├─ Validate credentials (email + password)
    ├─ Hash password check with bcrypt
    ├─ Generate JWT token (7-day expiry)
    ├─ Set httpOnly cookie (secure, sameSite=strict)
    └─ Return user info (no token in body)
         │
         └─ SUBSEQUENT REQUESTS
              │
              ├─ Browser automatically sends cookie
              ├─ Middleware verifies JWT
              ├─ Extract userId from token
              └─ Continue with authenticated request
```

### Google OAuth 2.0 Flow

```
LOGIN WITH GOOGLE
    │
    ├─ Frontend redirects to /auth/google
    ├─ Backend redirects to Google consent screen
    ├─ User authorizes PS application
    ├─ Google redirects to /auth/google/callback with code
    ├─ Backend exchanges code for Google tokens
    ├─ Backend fetches Google user profile
    ├─ Check if user exists in database
    │  ├─ If exists: retrieve user
    │  └─ If not: create new user auto-populated from Google
    ├─ Generate JWT token
    ├─ Set httpOnly cookie
    └─ Return authentication token
```

## 📁 Code Organization

### Backend Structure

```
src/
├── index.ts               # Express app initialization
├── prisma.ts              # Prisma singleton instance
├── logger.ts              # Winston logging setup
├── middleware.ts          # Centralized middleware
├── validation.ts          # Zod validation middleware
├── schemas.ts             # Validation schemas
├── passport.ts            # Google OAuth strategy
│
└── routes/
    ├── auth.routes.ts     # Authentication endpoints
    ├── oauth.routes.ts    # OAuth endpoints
    ├── board.routes.ts    # Board CRUD
    ├── list.routes.ts     # List CRUD
    ├── card.routes.ts     # Card CRUD
    ├── user.routes.ts     # User profile
    ├── tag.routes.ts      # Tags management
    ├── comment.routes.ts  # Comments
    └── activity.routes.ts # Activity log

prisma/
├── schema.prisma          # Database schema definition
└── seed.ts                # Seed script
```

### Frontend Structure

```
src/
├── api/
│   └── index.ts           # Axios instance + API functions
│
├── components/
│   ├── App.tsx            # Root component
│   ├── Board.tsx          # Kanban board
│   ├── Card.tsx           # Card component
│   ├── LoginPage.tsx      # Authentication UI
│   ├── AuthCallbackPage.tsx # OAuth callback handler
│   └── ...                # Other components
│
├── context/
│   ├── AuthContext.tsx    # Authentication state
│   ├── UserContext.tsx    # User profile state
│   ├── ThemeContext.tsx   # Dark/light mode
│   └── ErrorContext.tsx   # Error handling
│
├── types/
│   └── index.ts           # TypeScript types
│
├── main.tsx               # App entry point
└── index.css              # Global Tailwind styles
```

## 🔄 Request/Response Cycle

### Typical API Request Flow

```
1. CLIENT REQUEST
   ├─ User action triggers API call
   └─ Axios sends request with cookies

2. BACKEND RECEIVES REQUEST
   ├─ requestLogger middleware logs request
   ├─ verifyJWT middleware validates token
   ├─ validateRequest middleware validates data (Zod)
   ├─ Route handler processes request
   ├─ Prisma queries database
   └─ Response prepared

3. MIDDLEWARE PROCESSING
   ├─ successResponse or errorHandler
   ├─ Logger logs response + duration
   └─ Send to client

4. CLIENT RECEIVES RESPONSE
   ├─ Axios interceptor handles errors
   ├─ AuthContext updates state if needed
   ├─ Component re-renders with new data
   └─ UI updates
```

## 🛡️ Security Layers

### 1. Transport Security
- **HTTPS in production** - All traffic encrypted
- **Secure cookies** - httpOnly, sameSite=strict
- **CORS restrictions** - Specific origin only, not wildcard

### 2. Authentication
- **JWT tokens** - Industry standard tokens
- **Token storage** - httpOnly cookies (XSS protection)
- **Token expiration** - 7-day expiry, refresh tokens optional
- **Password hashing** - bcrypt with salt rounds

### 3. Authorization
- **Middleware verification** - Every request checked
- **Route protection** - Authenticated routes only
- **Resource ownership** - Users can only access their resources
- **Role-based access** - Admin vs regular user checks

### 4. Input Validation
- **Zod schemas** - Type-safe runtime validation
- **Input sanitization** - Prevent injection attacks
- **File uploads** - Whitelist validation (when implemented)

### 5. Rate Limiting
- **Login brute force** - 5 attempts per 15 minutes
- **API rate limits** - Per-endpoint configurable
- **IP-based tracking** - Distributed attack detection

### 6. Application Security
- **Helmet.js** - Security HTTP headers
- **No sensitive logs** - Passwords never logged
- **Error messages** - Generic messages to clients
- **SQL injection** - Prisma parameterized queries

## 💾 Database Schema

### Core Models

```
User
├─ id (UUID)
├─ email (unique)
├─ password (hashed)
├─ name
├─ avatarUrl
├─ provider (local, google)
├─ providerId (for OAuth)
├─ role (admin, user)
├─ createdAt
├─ updatedAt
└─ relationships: workspaces, boards, cards, comments

Workspace
├─ id (UUID)
├─ name
├─ description
├─ ownerId (User)
├─ createdAt
├─ updatedAt
└─ relationships: boards, members

Board
├─ id (UUID)
├─ workspaceId (Workspace)
├─ name
├─ description
├─ color
├─ createdAt
├─ updatedAt
└─ relationships: lists, cards

List
├─ id (UUID)
├─ boardId (Board)
├─ name
├─ position (order)
├─ createdAt
└─ relationships: cards

Card
├─ id (UUID)
├─ listId (List)
├─ title
├─ description
├─ color
├─ position (order)
├─ assignedToId (User, optional)
├─ tags (relation)
├─ createdAt
├─ updatedAt
└─ relationships: comments, activities

Comment
├─ id (UUID)
├─ cardId (Card)
├─ userId (User)
├─ content
├─ createdAt
└─ updatedAt

Tag
├─ id (UUID)
├─ name
├─ color
├─ workspaceId (Workspace)
└─ relationships: cards
```

## 🔌 Integration Points

### External Services

1. **Google OAuth**
   - Google Cloud Console credentials
   - Passport.js strategy
   - Token exchange for user data

2. **Email (Optional)**
   - Notification service
   - Password reset
   - Invite links

3. **Webhooks (Future)**
   - External integrations
   - IFTTT compatibility
   - Automation triggers

## 📊 State Management

### Frontend Context Hierarchy

```
App
├── AuthProvider
│   ├── User authentication state
│   ├── Login/logout handlers
│   └── Protected route wrapper
│
├── UserProvider
│   ├── Current user profile
│   └── User preferences
│
├── ThemeProvider
│   ├── Dark/light mode
│   └── Theme colors
│
└── ErrorProvider
    ├── Global error handling
    ├── Error notifications
    └── Error clearing
```

## 🔍 Error Handling

### Error Flow

```
Client Request
    │
    ├─ Validation Error (Zod)
    │  └─ 400 Bad Request (invalid input details)
    │
    ├─ Authentication Error
    │  └─ 401 Unauthorized (no/invalid token)
    │
    ├─ Authorization Error
    │  └─ 403 Forbidden (insufficient permissions)
    │
    ├─ Resource Not Found
    │  └─ 404 Not Found
    │
    ├─ Business Logic Error
    │  └─ 400/409 Conflict (business rule violation)
    │
    └─ Server Error
       └─ 500 Internal Server Error (logged with context)

Response → errorHandler Middleware
         → Logger (error level)
         → Client receives structured error
         → Frontend ErrorContext updates UI
```

## 📈 Performance Considerations

### Optimization Strategies

1. **Database**
   - Query optimization with Prisma
   - Relationship loading (eager vs lazy)
   - Index strategy on frequently queried columns

2. **Frontend**
   - Component code splitting
   - Lazy loading for images
   - Memoization for expensive renders
   - Optimistic UI updates

3. **Backend**
   - Response compression
   - Caching strategy (Redis optional)
   - Rate limiting
   - Connection pooling (Prisma)

4. **Deployment**
   - CDN for static assets
   - Database replication for scale
   - Load balancer for multiple instances
   - Container orchestration (Kubernetes optional)

## 🔄 Data Flow Example: Creating a Card

```
1. USER ACTION
   └─ Click "Add Card" in UI

2. FRONTEND
   ├─ Optimistic UI update (instant feedback)
   ├─ Prepare API request with Zod schema
   └─ POST /cards with { title, listId, ... }

3. BACKEND MIDDLEWARE
   ├─ requestLogger: log incoming request
   ├─ verifyJWT: check authentication
   ├─ validateRequest: validate with Zod schema
   └─ Continue to route handler

4. ROUTE HANDLER
   ├─ Extract userId from JWT token
   ├─ Verify user can access this list/board
   ├─ Check board ownership/permissions
   └─ Call Prisma create

5. DATABASE
   ├─ Insert card record
   ├─ Return created card with all fields
   └─ Maintain relationships

6. BACKEND RESPONSE
   ├─ Logger: record response (200 OK, 145ms)
   ├─ Return card data as JSON
   └─ Send to client

7. FRONTEND RECEIVES
   ├─ Update Context with actual data
   ├─ Merge with optimistic update
   ├─ Re-render Board with new card
   └─ Show success notification
```

## 🚀 Scalability Notes

### Current Setup (Development)

- Single Node.js process
- Single PostgreSQL instance
- In-memory session store
- File system logging

### Production Scaling Path

1. **Phase 1: Basic Production**
   - Multi-process Node.js
   - Connection pooling
   - Persistent session store
   - Centralized logging

2. **Phase 2: High Availability**
   - Load balancer (Nginx)
   - Multiple API servers
   - Database replication
   - Redis for caching/sessions

3. **Phase 3: Enterprise Scale**
   - Kubernetes orchestration
   - Auto-scaling policies
   - Message queue (Bull/RabbitMQ)
   - Advanced monitoring

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Installation & configuration
- [API.md](./API.md) - API endpoint reference
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflows
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Production deployment

---

**Last Updated:** 2026-05-15
