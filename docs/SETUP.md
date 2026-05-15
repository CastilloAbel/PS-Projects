# Setup Guide - PS (Pirate Ship)

Complete guide to set up PS locally for development or deployment.

## 📋 Prerequisites

Before you begin, make sure you have installed:

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/))
- **Git** ([Download](https://git-scm.com/))

Verify installations:
```bash
node --version    # Should be v18 or higher
npm --version     # Should be v9 or higher
docker --version
git --version
```

## 🔑 Environment Variables Setup

### 1. Create Root `.env` File

In the project root directory, create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=pirate_ship_db
DATABASE_URL="postgresql://postgres:your_secure_password@localhost:5432/pirate_ship_db?schema=public"

# Backend Configuration
JWT_SECRET=generate_a_random_secret_key
PORT=4000
NODE_ENV=development

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:4000

# Google OAuth (Optional - skip if not using OAuth)
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# Session
SESSION_SECRET=generate_another_random_secret

# Logging
LOG_LEVEL=debug
```

### 2. Generate Secure Secrets

Generate random secrets for JWT and SESSION:

```bash
# On Unix/Mac:
openssl rand -base64 32

# On Windows (PowerShell):
[System.Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
```

Use the generated values for `JWT_SECRET` and `SESSION_SECRET`.

### 3. Google OAuth Setup (Optional)

To enable Google OAuth login:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Add `http://localhost:4000/auth/google/callback` to authorized redirect URIs
6. Copy Client ID and Client Secret to `.env`

## 🗄️ Database Setup

### Step 1: Start PostgreSQL with Docker

From the project root:

```bash
docker-compose up -d
```

Verify the container is running:
```bash
docker-compose ps
```

You should see `pirate_ship_db` container running on port 5432.

### Step 2: Initialize Database Schema

Navigate to Backend folder and run Prisma migrations:

```bash
cd Backend
npm install
npx prisma db push
```

This will:
- Create all database tables
- Set up relationships and constraints
- Initialize the schema

### Step 3: (Optional) Seed Test Data

Populate with test users and sample data:

```bash
npx prisma db seed
```

This creates:
- Admin user: `admin@ps-project.local` / `ps-project-admin`
- Test users for task assignment
- Sample workspaces and boards

## 🚀 Backend Setup

### Installation

```bash
cd Backend
npm install
```

### Environment Configuration

Backend automatically uses the root `.env` file. Verify:

```bash
cat .env | grep JWT_SECRET  # Should show your secret
```

### Start Development Server

```bash
npm run dev
```

Expected output:
```
Server running on port 4000
Database connected
```

The API will be available at `http://localhost:4000`

### Available Backend Commands

```bash
npm run dev        # Development with auto-reload
npm run build      # Compile TypeScript
npm start          # Run compiled code
npm test           # Run tests
```

## 💻 Frontend Setup

### Installation

```bash
cd Frontend
npm install
```

### Environment Configuration (Optional)

Frontend looks for `VITE_API_URL` in `.env`. It defaults to `http://localhost:4000`.

If needed, create `Frontend/.env`:
```env
VITE_API_URL=http://localhost:4000
```

### Start Development Server

```bash
npm run dev
```

Expected output will show:
```
VITE v5.0.0 ready in XXX ms

➜  local:   http://localhost:5173/
```

Visit `http://localhost:5173` in your browser.

### Available Frontend Commands

```bash
npm run dev        # Development with hot reload
npm run build      # Build for production
npm run preview    # Preview production build
```

## 🔐 First Login

### Using Default Credentials

1. Open `http://localhost:5173`
2. Enter credentials:
   - **Email**: `admin@ps-project.local`
   - **Password**: `ps-project-admin`
3. Click "Iniciar sesión"

### Using Google OAuth

1. Click "Iniciar con Google"
2. Sign in with your Google account
3. New user account created automatically

## ✅ Verification Checklist

After setup, verify everything is working:

- [ ] Docker container running: `docker-compose ps`
- [ ] Backend server: `curl http://localhost:4000/health`
- [ ] Frontend loads: `http://localhost:5173`
- [ ] Login works with default credentials
- [ ] Can create a new board
- [ ] Can add cards to board
- [ ] Dark mode toggle works

## 🛠️ Development Workflow

Run all services in separate terminals:

**Terminal 1 - Database:**
```bash
docker-compose up
```

**Terminal 2 - Backend:**
```bash
cd Backend
npm run dev
```

**Terminal 3 - Frontend:**
```bash
cd Frontend
npm run dev
```

## 🐛 Troubleshooting

### Database Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check if container is running
docker-compose ps

# Restart containers
docker-compose restart

# View logs
docker-compose logs pirate_ship_db
```

### Port Already in Use

If port 4000 or 5173 is in use:

```bash
# Change backend port in .env
PORT=4001

# Change frontend port (Vite automatically finds available port)
npm run dev -- --port 5174
```

### Database Schema Out of Sync

```bash
cd Backend
npx prisma db push
```

### Clear Database

```bash
docker-compose down -v
docker-compose up -d
cd Backend
npx prisma db push
```

### Node Modules Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 🔄 Updating Dependencies

To update packages:

```bash
# Check for outdated packages
npm outdated

# Update all packages
npm update

# Update to latest version (breaking changes possible)
npm upgrade
```

## 📝 Environment Variables Reference

| Variable | Purpose | Default | Required |
|----------|---------|---------|----------|
| `POSTGRES_USER` | DB username | postgres | ✓ |
| `POSTGRES_PASSWORD` | DB password | - | ✓ |
| `POSTGRES_DB` | DB name | pirate_ship_db | ✓ |
| `DATABASE_URL` | Prisma connection | - | ✓ |
| `JWT_SECRET` | JWT signing key | - | ✓ |
| `PORT` | Backend port | 4000 | ✗ |
| `NODE_ENV` | Environment | development | ✗ |
| `FRONTEND_URL` | Frontend URL | http://localhost:5173 | ✗ |
| `VITE_API_URL` | API URL (frontend) | http://localhost:4000 | ✗ |
| `GOOGLE_CLIENT_ID` | Google OAuth | - | ✗ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth | - | ✗ |
| `GOOGLE_CALLBACK_URL` | OAuth redirect | http://localhost:4000/auth/google/callback | ✗ |
| `SESSION_SECRET` | Session signing | - | ✓ |
| `LOG_LEVEL` | Logging level | debug | ✗ |

## 🚀 Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup instructions.

## 📚 Next Steps

- [Architecture Overview](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Development Guide](./DEVELOPMENT.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## 💬 Need Help?

- Check [Troubleshooting](#-troubleshooting) section
- Review existing [GitHub Issues](https://github.com/yourusername/PS-Projects/issues)
- Open a [GitHub Discussion](https://github.com/yourusername/PS-Projects/discussions)

**Happy sailing!** ⚓
