# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Bookmark & Password Synchronization Application** (书签密码同步应用) that supports private deployment with end-to-end encryption. Users can securely synchronize bookmarks and passwords across multiple devices through a web client and browser extension.

### Core Components

- **Backend** (`/backend/`) - Node.js + Express API with PostgreSQL, JWT authentication, WebSocket for real-time sync
- **Web Client** (`/web-client/`) - React 18 + Vite with Ant Design UI
- **Browser Extension** (`/browser-extension/`) - Chrome/Edge/Firefox extension for one-click bookmark saving and password management
- **Database** - PostgreSQL with encrypted bookmark and password storage

## Development Commands

### Starting Services
```bash
# Start both backend and frontend (background mode with logging)
./start-all.sh              # Development mode (default)
./start-all.sh --dev        # Backend with nodemon
./start-all.sh --preview    # Frontend in preview mode (build + preview)

# Stop all services
./stop-all.sh

# Individual services
./start-backend.sh          # Backend only
./start-frontend.sh         # Frontend only
```

### Backend Development
```bash
cd backend
npm install                 # Install dependencies
npm run dev                 # Development with nodemon
npm start                   # Production mode
npm test                    # Run tests
npm run migrate             # Run database migrations
npm run seed                # Seed database
```

### Frontend Development
```bash
cd web-client
npm install                 # Install dependencies
npm run dev                 # Development server (Vite)
npm run build               # Production build
npm run preview             # Preview production build
npm run lint                # Run ESLint
```

### Service URLs
- Frontend: http://localhost:3002 (or Vite default 5173)
- Backend: http://localhost:3001

### Logs
Services log to `./logs/` directory when started via shell scripts:
- `logs/backend.log` - Backend output
- `logs/frontend.log` - Frontend output
- `logs/pids.txt` - Process IDs for running services

View logs in real-time: `tail -f logs/backend.log` or `tail -f logs/frontend.log`

## Architecture

### Data Flow
```
Browser Extension ──┐
                   ├──► Backend API ──► PostgreSQL Database
Web Client ────────┘                    (encrypted data)
                        │
                        ▼
                   WebSocket Server
                   (real-time sync)
```

### Backend Architecture ([backend/src/app.js](backend/src/app.js))
- **Express.js** REST API with JWT middleware
- **Routes**: `/auth`, `/bookmarks`, `/passwords`, `/import-export`
- **Middleware**: Authentication ([middleware/auth.js](backend/src/middleware/auth.js)), error handling, CORS, rate limiting
- **WebSocket**: Real-time synchronization for connected clients
- **Database**: Knex.js ORM with PostgreSQL

### Frontend Architecture ([web-client/src/App.jsx](web-client/src/App.jsx))
- **React 18** with Vite build system
- **Ant Design** component library for UI
- **React Router DOM** for navigation
- **Context Providers**: AuthContext, ThemeContext
- **Axios** for HTTP requests with interceptors for JWT token injection

### Browser Extension ([browser-extension/](browser-extension/))
- **Manifest V2** for Chrome/Edge, Gecko for Firefox
- **Scripts**: `background.js`, `content.js`, `popup.js`, `websocket-manager.js`
- **Features**: Right-click context menu, form detection, auto-fill credentials

## Database Schema

**Tables**: `users`, `bookmarks`, `passwords`

Key design:
- `bookmarks.encrypted_data` and `passwords.encrypted_data` store AES-256 encrypted JSON
- Foreign key relationships with `ON DELETE CASCADE`
- Automatic `updated_at` triggers on all tables
- Indexes on `user_id` and `users.email`

Initialization: See [docs/database-init.sql](docs/database-init.sql)

## Configuration

### Backend Environment ([backend/.env.example](backend/.env.example))
Required before running:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bookmark_sync
DB_USER=postgres
DB_PASSWORD=123456
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
ENCRYPTION_KEY=your-32-character-encryption-key
ALLOWED_ORIGINS=http://localhost:3002,http://localhost:19006
```

Copy `.env.example` to `.env` and configure values before starting backend.

### PostgreSQL Requirements
- Database: `bookmark_sync`
- Default credentials: `postgres` / `123456` on localhost:5432
- Ensure PostgreSQL is running before starting services

## Security Considerations

- **End-to-end encryption**: All bookmarks and passwords encrypted client-side before storage
- **JWT authentication**: Tokens stored in HTTP-only cookies or localStorage
- **Password hashing**: bcrypt for user passwords
- **Rate limiting**: Express rate limiter on API endpoints
- **CORS**: Configurable allowed origins in `ALLOWED_ORIGINS`

When modifying security-related code:
- Never log or expose sensitive data (passwords, tokens, encryption keys)
- Validate all inputs with Joi schemas ([backend/src/middleware/validator.js](backend/src/middleware/validator.js))
- Maintain encryption flow: client encrypt → server stores → client decrypts

## Key Files Reference

**Backend:**
- [backend/src/app.js](backend/src/app.js) - Main entry point, Express setup
- [backend/src/routes/](backend/src/routes/) - API route definitions
- [backend/src/middleware/auth.js](backend/src/middleware/auth.js) - JWT verification middleware
- [backend/knexfile.js](backend/knexfile.js) - Database migration configuration

**Frontend:**
- [web-client/src/App.jsx](web-client/src/App.jsx) - Root component with routes
- [web-client/src/contexts/AuthContext.jsx](web-client/src/contexts/AuthContext.jsx) - Authentication state
- [web-client/src/pages/](web-client/src/pages/) - Page components (Dashboard, Bookmarks, Passwords)
- [web-client/vite.config.js](web-client/vite.config.js) - Build configuration

**Browser Extension:**
- [browser-extension/manifest.json](browser-extension/manifest.json) - Extension manifest
- [browser-extension/popup.js](browser-extension/popup.js) - Popup UI logic
- [browser-extension/background.js](browser-extension/background.js) - Background service worker
