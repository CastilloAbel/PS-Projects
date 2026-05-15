# API Documentation - PS (Pirate Ship)

Complete reference for all REST API endpoints in PS.

## 📍 Base URL

```
http://localhost:4000/api  (Development)
https://api.ps-projects.com (Production)
```

## 🔐 Authentication

All endpoints (except `/auth/login` and `/auth/google*`) require JWT authentication via cookie:

```
Cookie: authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token is automatically sent by the browser in subsequent requests.

### Error Responses

**401 Unauthorized** - Missing or invalid token:
```json
{
  "error": "Acceso no autorizado",
  "code": "UNAUTHORIZED"
}
```

**403 Forbidden** - Insufficient permissions:
```json
{
  "error": "No tienes permisos para esta acción",
  "code": "FORBIDDEN"
}
```

---

## 🔑 Authentication Endpoints

### Login with Email/Password

```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@ps-project.local",
  "password": "ps-project-admin"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "admin@ps-project.local",
    "name": "Administrator",
    "avatarUrl": null
  }
}
```

**Errors:**
- `400 Bad Request` - Validation error (email/password missing)
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limited (5 attempts/15 min)

---

### Change Password

```http
POST /auth/change-password
Content-Type: application/json
Authorization: Bearer <token>

{
  "currentPassword": "ps-project-admin",
  "newPassword": "NewSecure@Password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Errors:**
- `400 Bad Request` - Password too weak or validation error
- `401 Unauthorized` - Current password incorrect
- `401 Unauthorized` - Not authenticated

---

### Logout

```http
POST /auth/logout
```

**Response:** `200 OK`
```json
{
  "message": "Sesión cerrada correctamente"
}
```

Clears authentication cookie on client and server side.

---

## 🔐 Google OAuth Endpoints

### Initiate Google Login

```http
GET /auth/google
```

Redirects user to Google consent screen. Browser will be redirected back to:
```
http://localhost:4000/auth/google/callback?code=<auth_code>
```

---

### Google OAuth Callback

```http
GET /auth/google/callback?code=<auth_code>&state=<state>
```

Automatically called by Google after user authorization.

**Response:** Redirects to frontend with token:
```
http://localhost:5173/auth/callback?token=<jwt_token>
```

**Error scenarios:**
- Invalid authorization code
- User denies permission
- Misconfigured OAuth app

---

### Get OAuth Success Status

```http
GET /auth/google/success
```

**Response:** `200 OK`
```json
{
  "authenticated": true,
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "user@gmail.com",
    "name": "John Doe",
    "avatarUrl": "https://lh3.googleusercontent.com/..."
  }
}
```

---

## 📊 Workspace Endpoints

### Get All Workspaces

```http
GET /workspaces
```

**Response:** `200 OK`
```json
{
  "workspaces": [
    {
      "id": "ws-123",
      "name": "Personal",
      "description": "My personal workspace",
      "ownerId": "user-123",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z"
    }
  ]
}
```

---

### Create Workspace

```http
POST /workspaces
Content-Type: application/json

{
  "name": "Team Project",
  "description": "Collaborative workspace"
}
```

**Response:** `201 Created`
```json
{
  "id": "ws-456",
  "name": "Team Project",
  "description": "Collaborative workspace",
  "ownerId": "user-123",
  "createdAt": "2026-05-15T10:00:00Z",
  "updatedAt": "2026-05-15T10:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Name missing or invalid
- `401 Unauthorized` - Not authenticated

---

### Update Workspace

```http
PATCH /workspaces/:id
Content-Type: application/json

{
  "name": "Renamed Project",
  "description": "Updated description"
}
```

**Response:** `200 OK` - Updated workspace object

**Errors:**
- `404 Not Found` - Workspace doesn't exist
- `403 Forbidden` - Not workspace owner

---

### Delete Workspace

```http
DELETE /workspaces/:id
```

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Workspace doesn't exist
- `403 Forbidden` - Not workspace owner

---

## 📋 Board Endpoints

### Get All Boards

```http
GET /boards
```

**Response:** `200 OK`
```json
{
  "boards": [
    {
      "id": "board-123",
      "workspaceId": "ws-123",
      "name": "Q1 Roadmap",
      "description": "Q1 2026 planning",
      "color": "#FF5733",
      "createdAt": "2026-05-15T10:00:00Z",
      "updatedAt": "2026-05-15T10:00:00Z"
    }
  ]
}
```

---

### Get Board Details

```http
GET /boards/:id
```

**Response:** `200 OK`
```json
{
  "board": {
    "id": "board-123",
    "workspaceId": "ws-123",
    "name": "Q1 Roadmap",
    "description": "Q1 2026 planning",
    "color": "#FF5733",
    "lists": [
      {
        "id": "list-1",
        "name": "Todo",
        "position": 0,
        "cards": [
          {
            "id": "card-1",
            "title": "Implement authentication",
            "description": "Add JWT auth",
            "position": 0,
            "color": "#3498DB",
            "assignedToId": "user-123",
            "tags": ["backend", "security"],
            "createdAt": "2026-05-15T10:00:00Z"
          }
        ]
      }
    ]
  }
}
```

---

### Create Board

```http
POST /boards
Content-Type: application/json

{
  "workspaceId": "ws-123",
  "name": "Q1 Roadmap",
  "description": "Q1 2026 planning",
  "color": "#FF5733"
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Validation error (name required)
- `404 Not Found` - Workspace doesn't exist

---

### Update Board

```http
PATCH /boards/:id
Content-Type: application/json

{
  "name": "Q1 2026 Roadmap",
  "color": "#27AE60"
}
```

**Response:** `200 OK` - Updated board object

---

### Delete Board

```http
DELETE /boards/:id
```

**Response:** `204 No Content`

---

## 📑 List Endpoints

### Create List (Column)

```http
POST /lists
Content-Type: application/json

{
  "boardId": "board-123",
  "name": "In Progress"
}
```

**Response:** `201 Created`
```json
{
  "id": "list-2",
  "boardId": "board-123",
  "name": "In Progress",
  "position": 1,
  "createdAt": "2026-05-15T10:00:00Z"
}
```

---

### Update List

```http
PATCH /lists/:id
Content-Type: application/json

{
  "name": "Currently Working",
  "position": 0
}
```

**Response:** `200 OK`

---

### Delete List

```http
DELETE /lists/:id
```

**Response:** `204 No Content`

---

## 🃏 Card Endpoints

### Get Card Details

```http
GET /cards/:id
```

**Response:** `200 OK`
```json
{
  "card": {
    "id": "card-1",
    "listId": "list-1",
    "title": "Implement authentication",
    "description": "Add JWT auth with Passport",
    "color": "#3498DB",
    "position": 0,
    "assignedToId": "user-123",
    "tags": ["backend", "security"],
    "comments": [
      {
        "id": "comment-1",
        "userId": "user-123",
        "content": "Started implementation",
        "createdAt": "2026-05-15T14:00:00Z"
      }
    ],
    "createdAt": "2026-05-15T10:00:00Z",
    "updatedAt": "2026-05-15T15:00:00Z"
  }
}
```

---

### Create Card

```http
POST /cards
Content-Type: application/json

{
  "listId": "list-1",
  "title": "Setup database",
  "description": "Configure PostgreSQL connection",
  "color": "#3498DB",
  "assignedToId": "user-123"
}
```

**Response:** `201 Created`

**Errors:**
- `400 Bad Request` - Missing required fields (title, listId)
- `404 Not Found` - List doesn't exist

---

### Update Card

```http
PATCH /cards/:id
Content-Type: application/json

{
  "title": "Setup PostgreSQL database",
  "description": "Configure connection pool",
  "color": "#27AE60",
  "assignedToId": "user-456",
  "position": 1
}
```

**Response:** `200 OK`

---

### Move Card Between Lists

```http
PATCH /cards/:id
Content-Type: application/json

{
  "listId": "list-2",
  "position": 0
}
```

**Response:** `200 OK`

---

### Delete Card

```http
DELETE /cards/:id
```

**Response:** `204 No Content`

---

## 💬 Comment Endpoints

### Add Comment to Card

```http
POST /comments
Content-Type: application/json

{
  "cardId": "card-1",
  "content": "Implementation complete, ready for review"
}
```

**Response:** `201 Created`
```json
{
  "id": "comment-2",
  "cardId": "card-1",
  "userId": "user-123",
  "content": "Implementation complete, ready for review",
  "createdAt": "2026-05-15T16:00:00Z",
  "updatedAt": "2026-05-15T16:00:00Z"
}
```

---

### Update Comment

```http
PATCH /comments/:id
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

**Response:** `200 OK`

---

### Delete Comment

```http
DELETE /comments/:id
```

**Response:** `204 No Content`

---

## 🏷️ Tag Endpoints

### Get All Tags

```http
GET /tags
```

**Response:** `200 OK`
```json
{
  "tags": [
    {
      "id": "tag-1",
      "name": "backend",
      "color": "#FF5733",
      "workspaceId": "ws-123"
    }
  ]
}
```

---

### Create Tag

```http
POST /tags
Content-Type: application/json

{
  "name": "frontend",
  "color": "#3498DB",
  "workspaceId": "ws-123"
}
```

**Response:** `201 Created`

---

### Add Tag to Card

```http
POST /cards/:cardId/tags/:tagId
```

**Response:** `200 OK`

---

### Remove Tag from Card

```http
DELETE /cards/:cardId/tags/:tagId
```

**Response:** `204 No Content`

---

## 👥 User Endpoints

### Get Current User

```http
GET /users/me
```

**Response:** `200 OK`
```json
{
  "id": "user-123",
  "email": "admin@ps-project.local",
  "name": "Administrator",
  "avatarUrl": null,
  "provider": "local",
  "role": "admin",
  "createdAt": "2026-05-15T10:00:00Z"
}
```

---

### Get User Profile

```http
GET /users/:id
```

**Response:** `200 OK` - User object

---

### Update User Profile

```http
PATCH /users/:id
Content-Type: application/json

{
  "name": "New Name",
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

**Response:** `200 OK`

---

## 📊 Activity Endpoints

### Get Card Activity

```http
GET /cards/:cardId/activity
```

**Response:** `200 OK`
```json
{
  "activities": [
    {
      "id": "activity-1",
      "cardId": "card-1",
      "userId": "user-123",
      "action": "created",
      "description": "Creó la tarjeta",
      "timestamp": "2026-05-15T10:00:00Z"
    },
    {
      "id": "activity-2",
      "cardId": "card-1",
      "userId": "user-123",
      "action": "moved",
      "description": "Movió a 'In Progress'",
      "timestamp": "2026-05-15T14:00:00Z"
    }
  ]
}
```

---

## 🔄 Response Format

### Success Response (200/201)

```json
{
  "data": { /* resource data */ }
}
```

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { /* additional error info */ }
}
```

---

## ⚙️ Query Parameters

### Pagination

```http
GET /boards?page=1&limit=10
```

### Filtering

```http
GET /cards?status=todo&assigned=user-123
```

### Sorting

```http
GET /cards?sort=createdAt&order=desc
```

---

## 📝 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK - Request succeeded |
| `201` | Created - Resource created |
| `204` | No Content - Successful deletion |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Not authenticated |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limited |
| `500` | Internal Server Error - Server error |

---

## 🧪 Testing API

### Using cURL

```bash
# Login
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ps-project.local","password":"ps-project-admin"}' \
  -c cookies.txt

# Get boards
curl http://localhost:4000/boards \
  -b cookies.txt
```

### Using Postman

1. Import collection from `docs/postman-collection.json` (if provided)
2. Set environment variables
3. Run requests with authentication

### Using Swagger/OpenAPI

Interactive API documentation available at:
```
http://localhost:4000/api-docs
```

---

## 📚 Related Documentation

- [SETUP.md](./SETUP.md) - Installation guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines

---

**Last Updated:** 2026-05-15
