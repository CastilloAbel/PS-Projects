# PS (Pirate Ship) 🏴‍☠️ - Project Manager

> **Self-hosted project management tool** inspired by Trello, Jira, and Linear. Built with React, Node.js, PostgreSQL, and modern web technologies.

![Status](https://img.shields.io/badge/status-MVP-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen) ![React](https://img.shields.io/badge/react-19.2-blue) ![TypeScript](https://img.shields.io/badge/typescript-5.x-blue)

## 🌟 Features

### ✅ Core Functionality
- **Interactive Kanban Board** - Drag & drop cards and columns
- **Task Management** - Create, edit, delete tasks with descriptions
- **User Assignment** - Assign team members to tasks
- **Team Collaboration** - Comments, activity history, real-time updates
- **Workspaces** - Organize projects into workspaces
- **Tags & Labels** - Custom categories with colors
- **Dark Mode** - Built-in theme support
- **Multi-language** - Spanish/English support

### 🔐 Security
- **JWT Authentication** - Secure token-based auth
- **Google OAuth 2.0** - Social login integration
- **Rate Limiting** - Brute force protection
- **Input Validation** - Zod schema validation
- **CORS Protection** - Cross-origin restrictions
- **Security Headers** - Helmet.js integration
- **Password Hashing** - bcrypt with salt rounds

### 📊 Technical Highlights
- **TypeScript** - Type-safe codebase
- **PostgreSQL** - Reliable relational database
- **Prisma ORM** - Type-safe database access
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool
- **Winston Logger** - Structured logging
- **Passport** - Authentication strategies

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Docker](https://www.docker.com/) & Docker Compose
- [Git](https://git-scm.com/)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/PS-Projects.git
cd PS-Projects
```

**2. Setup environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=pirate_password
POSTGRES_DB=pirate_ship_db

# JWT & Backend
JWT_SECRET=your_secret_key_here
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback
```

**3. Start the database**
```bash
docker-compose up -d
```

**4. Setup Backend**
```bash
cd Backend
npm install
npx prisma db push
npx prisma db seed  # Optional: populate test data
npm run dev
```

**5. Setup Frontend** (new terminal)
```bash
cd Frontend
npm install
npm run dev
```

**6. Open in browser**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

---

## 🔑 Test Credentials

**Email:** `admin@ps-project.local`  
**Password:** `ps-project-admin`

Or use **Google OAuth** to sign in.

---

## 📁 Project Structure

```
PS-Projects/
├── Backend/              # Node.js/Express API
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   ├── middleware.ts
│   │   ├── logger.ts
│   │   └── passport.ts  # OAuth strategy
│   └── prisma/
│
├── Frontend/             # React/Vite SPA
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── context/     # State management
│   │   └── api/         # HTTP client
│
├── docs/                 # Documentation
├── docker-compose.yml
└── .env.example
```

See [REPOSITORY_STRUCTURE.md](./REPOSITORY_STRUCTURE.md) for detailed structure.

---

## 📚 Documentation

- [SETUP.md](./docs/SETUP.md) - Detailed setup guide
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - Architecture & design patterns
- [API.md](./docs/API.md) - API endpoint documentation
- [DEVELOPMENT.md](./docs/DEVELOPMENT.md) - Development guide
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Production deployment

---

## 🛠️ Tech Stack

### Frontend
- React 19.2 + Vite
- TypeScript
- Tailwind CSS
- Lucide Icons
- Axios
- Context API (state management)

### Backend
- Node.js + Express 5
- TypeScript
- PostgreSQL 15
- Prisma ORM 6
- Passport (OAuth)
- Winston (logging)
- Zod (validation)
- Helmet (security)

### DevOps
- Docker & Docker Compose
- Git/GitHub

---

## 🔄 Development Workflow

### Running Development Servers

**Terminal 1 - Database:**
```bash
docker-compose up
```

**Terminal 2 - Backend:**
```bash
cd Backend && npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd Frontend && npm run dev
```

### Building for Production

**Backend:**
```bash
cd Backend && npm run build
```

**Frontend:**
```bash
cd Frontend && npm run build
```

---

## 📝 API Endpoints

### Authentication
- `POST /auth/login` - Login with credentials
- `POST /auth/logout` - Logout
- `POST /auth/change-password` - Change password
- `GET /auth/google` - Google OAuth login
- `GET /auth/google/callback` - OAuth callback

### Boards
- `GET /boards` - List all boards
- `POST /boards` - Create board
- `PATCH /boards/:id` - Update board

### Cards
- `GET /cards/:id` - Get card details
- `POST /cards` - Create card
- `PATCH /cards/:id` - Update card
- `DELETE /cards/:id` - Delete card

See [API.md](./docs/API.md) for complete endpoint list.

---

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## 📋 Roadmap

### Phase 2 (In Progress)
- [ ] LDAP/AD Integration
- [ ] 2FA (Two-Factor Authentication)
- [ ] Socket.IO real-time collaboration
- [ ] File attachments

### Phase 3 (Planned)
- [ ] Notifications (email, desktop)
- [ ] Analytics dashboard
- [ ] Custom workflows
- [ ] Import/Export (Trello, Jira)
- [ ] Mobile app (React Native)

---

## 🔒 Security

This project implements modern security best practices:
- JWT tokens in httpOnly cookies
- Password hashing with bcrypt
- Rate limiting
- Input validation with Zod
- CORS protection
- Security headers (Helmet)
- HTTPS ready

For security concerns, please email security@ps-projects.local (or create a private security advisory).

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙋 Support

- 📖 Check the [documentation](./docs/)
- 🐛 Report issues on [GitHub Issues](https://github.com/yourusername/PS-Projects/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/yourusername/PS-Projects/discussions)

---

**Made with ⚓ by the PS Team**

Happy sailing! 🏴‍☠️