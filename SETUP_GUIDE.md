# Complete Setup and Configuration Guide

Comprehensive guide for setting up and configuring the Helpdesk Ticketing System from scratch, including Nginx, database, and all services.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Nginx Configuration](#nginx-configuration)
4. [Database Setup](#database-setup)
5. [Service Configuration](#service-configuration)
6. [Swagger API Documentation](#swagger-api-documentation)
7. [Production Deployment](#production-deployment)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Software Requirements

| Software | Minimum Version | Purpose | Installation |
|----------|----------------|---------|--------------|
| Node.js | 20.x | Runtime for backend/frontend | https://nodejs.org/ |
| npm | 10.x | Package manager | Comes with Node.js |
| PostgreSQL | 14.x | Database | https://www.postgresql.org/ |
| Docker | 24.x | Containerization (optional) | https://www.docker.com/ |
| Docker Compose | 2.x | Multi-container orchestration | Comes with Docker Desktop |
| Git | 2.x | Version control | https://git-scm.com/ |

**Optional**:
- OpenShift CLI (`oc`) for Kubernetes deployment
- Postman or similar for API testing

### System Requirements

- **CPU**: 2+ cores (4+ recommended for containers)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Disk**: 10GB free space
- **OS**: Windows 10/11, macOS 10.15+, Linux (Ubuntu 20.04+)

---

## Local Development Setup

### Method 1: Docker Compose (Recommended)

This is the **easiest** method - all services run in containers.

#### Step 1: Clone Repository

```bash
git clone <repository-url>
cd helpdesk-ticketing-app
```

#### Step 2: Start All Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- MailHog on ports 1025 (SMTP) and 8025 (UI)
- Backend API on port 3000
- Mailer worker service
- Frontend on port 8080

#### Step 3: Access Services

```bash
# Frontend
open http://localhost:8080

# Backend API
open http://localhost:3000

# Swagger API Documentation
open http://localhost:3000/api/docs

# MailHog UI (email testing)
open http://localhost:8025
```

#### Step 4: View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f mailer
docker-compose logs -f frontend
```

#### Step 5: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data!)
docker-compose down -v
```

---

### Method 2: Manual Setup

For development without Docker, run each service separately.

#### Step 1: Setup PostgreSQL

**Option A: Install PostgreSQL**

```bash
# macOS (Homebrew)
brew install postgresql@16
brew services start postgresql@16

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Windows
# Download installer from https://www.postgresql.org/download/windows/
# Run installer and follow prompts
```

**Option B: Use Docker for PostgreSQL only**

```bash
docker run -d \
  --name helpdesk-postgres \
  -e POSTGRES_USER=helpdesk \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=helpdesk \
  -p 5432:5432 \
  postgres:16-alpine
```

#### Step 2: Create Database

```bash
# If using local PostgreSQL
createdb helpdesk

# Create user
psql -c "CREATE USER helpdesk WITH PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;"

# Verify connection
psql -U helpdesk -d helpdesk -c "SELECT version();"
```

#### Step 3: Setup Backend API

```bash
cd backend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your values (see ENVIRONMENT_SETUP.md)

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate:dev

# Start development server
npm run start:dev
```

Backend will be available at http://localhost:3000

#### Step 4: Setup Mailer Service

```bash
cd mailer

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env (use same DATABASE_URL as backend)

# Generate Prisma client
npm run prisma:generate

# Start mailer worker
npm run start:dev
```

#### Step 5: Setup MailHog (Email Testing)

```bash
# Using Docker (easiest)
docker run -d \
  --name mailhog \
  -p 1025:1025 \
  -p 8025:8025 \
  mailhog/mailhog

# Or download binary
# macOS
brew install mailhog
mailhog

# Windows
# Download from https://github.com/mailhog/MailHog/releases
# Run MailHog.exe
```

Access MailHog UI at http://localhost:8025

#### Step 6: Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_API_URL=http://localhost:3000" > .env

# Start development server
npm run dev
```

Frontend will be available at http://localhost:5173 (Vite default)

---

## Nginx Configuration

### Why Nginx?

In **production**, the React frontend is served by Nginx:
- Serves static files efficiently
- Handles client-side routing
- Provides health check endpoint
- Can add SSL/TLS termination
- Better performance than Node.js for static content

### Nginx Configuration File

The frontend includes an `nginx.conf` file:

**Location**: `frontend/nginx.conf`

```nginx
server {
    listen 8080;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /health {
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

### Configuration Breakdown

#### `listen 8080`
- Nginx listens on port 8080 (not 80 because OpenShift doesn't allow privileged ports)
- Can be changed if needed

#### `root /usr/share/nginx/html`
- Document root where built files are served from
- Docker image copies build output here

#### `try_files $uri $uri/ /index.html`
- **Critical for React Router**: All routes fall back to index.html
- Enables client-side routing
- Without this, direct navigation to /tickets would return 404

#### `/health` endpoint
- Returns 200 OK for health checks
- Used by Kubernetes/OpenShift readiness/liveness probes

### Testing Nginx Locally

```bash
cd frontend

# Build production files
npm run build

# Serve with local nginx (macOS/Linux)
nginx -c $(pwd)/nginx.conf -p $(pwd)/dist

# Or use Docker
docker build -t helpdesk-frontend .
docker run -p 8080:8080 helpdesk-frontend

# Access
open http://localhost:8080
```

### Customizing Nginx Configuration

**Add GZIP compression**:

```nginx
server {
    listen 8080;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    # ... rest of config
}
```

**Add security headers**:

```nginx
server {
    listen 8080;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    # ... rest of config
}
```

**Enable caching for static assets**:

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Nginx in Docker

The `frontend/Dockerfile` uses Nginx:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**Multi-stage build**:
1. Build stage: Compile React app
2. Runtime stage: Serve with Nginx

**Benefits**:
- Small final image (~25MB vs ~1GB with Node)
- No Node.js runtime needed in production
- Better performance

### No Nginx Setup Required from Browser

**Important**: You do **NOT** need to configure Nginx from a browser or web interface.

- Nginx configuration is **file-based**
- The `nginx.conf` file is included in the repository
- Docker/OpenShift automatically use this configuration
- No manual setup or GUI configuration needed

The only time you'd interact with Nginx:
- Customizing the `nginx.conf` file
- Debugging issues with logs

---

## Database Setup

### PostgreSQL Configuration

#### Connection Parameters

```
Host: localhost (or postgres in Docker/OpenShift)
Port: 5432
Database: helpdesk
User: helpdesk
Password: password (change in production!)
```

#### Prisma Schema

The database schema is defined in `backend/prisma/schema.prisma`:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  firstName String?
  lastName  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tickets             Ticket[]
  passwordResetTokens PasswordResetToken[]
}

model Ticket {
  id          String       @id @default(uuid())
  userId      String
  title       String
  description String       @db.Text
  status      TicketStatus @default(OPEN)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  DONE
}

model PasswordResetToken {
  id         String   @id @default(uuid())
  userId     String
  tokenHash  String   @unique
  expiresAt  DateTime
  used       Boolean  @default(false)
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model EmailOutbox {
  id        String   @id @default(uuid())
  to        String
  subject   String
  body      String   @db.Text
  sent      Boolean  @default(false)
  sentAt    DateTime?
  error     String?  @db.Text
  attempts  Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

#### Database Migrations

**Create migration** (after schema changes):

```bash
cd backend
npm run prisma:migrate:dev
# Enter migration name when prompted
```

**Apply migrations** (production):

```bash
npm run prisma:migrate
```

**Reset database** (development only!):

```bash
npx prisma migrate reset
```

#### Database Management

**Prisma Studio** (GUI for database):

```bash
cd backend
npx prisma studio
```

Opens at http://localhost:5555 - browse tables, edit data.

**psql** (command line):

```bash
# Connect
psql -U helpdesk -d helpdesk

# Useful commands
\dt                    # List tables
\d users               # Describe users table
SELECT * FROM users;   # Query data
\q                     # Quit
```

#### Backup and Restore

**Backup**:

```bash
pg_dump -U helpdesk helpdesk > backup.sql
```

**Restore**:

```bash
psql -U helpdesk helpdesk < backup.sql
```

**Docker/OpenShift backup**:

```bash
# Docker
docker exec helpdesk-postgres pg_dump -U helpdesk helpdesk > backup.sql

# OpenShift
oc exec deployment/postgres -- pg_dump -U helpdesk helpdesk > backup.sql
```

---

## Service Configuration

### Backend API Configuration

#### Environment Variables

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete details.

**Minimum required**:
```bash
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk
JWT_SECRET=change-this-to-random-string
FRONTEND_BASE_URL=http://localhost:5173
PORT=3000
```

#### Development Mode

```bash
cd backend
npm run start:dev
```

Features:
- Hot reload on code changes
- Detailed error messages
- No optimization (faster builds)

#### Production Mode

```bash
cd backend
npm run build
npm run start:prod
```

Features:
- Optimized bundle
- No source maps
- Faster runtime

### Mailer Service Configuration

#### Environment Variables

```bash
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_FROM=noreply@helpdesk.local
POLL_INTERVAL_MS=5000
```

#### How It Works

1. Backend API writes emails to `email_outbox` table
2. Mailer service polls this table every 5 seconds
3. Sends unsent emails via SMTP
4. Marks as sent or logs error
5. Retries up to 5 times on failure

#### Monitoring Mailer

```bash
# View logs
docker-compose logs -f mailer

# Check email queue
psql -U helpdesk -d helpdesk -c "SELECT * FROM email_outbox WHERE sent = false;"
```

### Frontend Configuration

#### Build Configuration

**Development**:
```bash
npm run dev
```
- Fast refresh
- Source maps
- Development server (Vite)

**Production Build**:
```bash
npm run build
```
- Output: `dist/` folder
- Minified assets
- Optimized for production

#### Preview Production Build

```bash
npm run build
npm run preview
```

Opens production build at http://localhost:4173

---

## Swagger API Documentation

### Accessing Swagger Docs

Once the backend is running, access Swagger at:

```
http://localhost:3000/api/docs
```

### Features

- **Interactive API testing**: Try endpoints directly from browser
- **Request/Response examples**: See expected input/output
- **Authentication**: Test protected endpoints with JWT
- **Schema documentation**: View all DTOs and models
- **Organized by tags**: Auth and Tickets sections

### Using Swagger

#### 1. Test Public Endpoints

**Signup**:
1. Expand `/auth/signup` endpoint
2. Click "Try it out"
3. Edit request body:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "firstName": "Test",
     "lastName": "User"
   }
   ```
4. Click "Execute"
5. See response with JWT token

#### 2. Authenticate

**Copy JWT token from signup/login response**:

1. Click "Authorize" button (top right)
2. Enter token in format: `Bearer <your-token>`
3. Click "Authorize"
4. Close dialog

#### 3. Test Protected Endpoints

Now you can test authenticated endpoints:
- Create tickets
- Get tickets
- Update ticket status
- Change password

### Swagger Configuration

**Location**: `backend/src/main.ts`

```typescript
const config = new DocumentBuilder()
  .setTitle('Helpdesk Ticketing API')
  .setDescription('Complete REST API for Helpdesk Ticketing System')
  .setVersion('1.0')
  .addTag('auth', 'Authentication endpoints')
  .addTag('tickets', 'Ticket management endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
    'JWT-auth',
  )
  .build();
```

### Customizing Swagger

**Change base path**:
```typescript
SwaggerModule.setup('api/docs', app, document);
// Access at /api/docs
```

**Add examples to endpoints**:
```typescript
@ApiResponse({
  status: 200,
  description: 'User successfully created',
  schema: {
    example: {
      user: {
        id: 'uuid',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User'
      },
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    }
  }
})
```

---

## Production Deployment

### Docker Deployment

#### Build Images

```bash
# Backend
cd backend
docker build -t helpdesk-api:latest .

# Mailer
cd mailer
docker build -t helpdesk-mailer:latest .

# Frontend
cd frontend
docker build -t helpdesk-frontend:latest .
```

#### Run with Docker Compose

```bash
# Production mode
docker-compose -f docker-compose.yml up -d
```

### OpenShift Deployment

See [QUICK_START.md](./QUICK_START.md) for exact commands.

**Quick deploy**:
```bash
./deploy-openshift.sh
```

**Manual deploy**: Follow steps in [DEPLOYMENT.md](./DEPLOYMENT.md)

### Production Checklist

- [ ] Change all default passwords
- [ ] Generate strong JWT_SECRET
- [ ] Configure real SMTP (not MailHog)
- [ ] Enable HTTPS/TLS
- [ ] Set up database backups
- [ ] Configure monitoring
- [ ] Set resource limits
- [ ] Enable logging
- [ ] Test disaster recovery
- [ ] Document runbooks

---

## Troubleshooting

### Backend Won't Start

**Check logs**:
```bash
docker-compose logs api
# or
npm run start:dev
```

**Common issues**:
1. Database not running
   - Start PostgreSQL
   - Check DATABASE_URL

2. Port already in use
   - Change PORT environment variable
   - Or stop conflicting service

3. Prisma client not generated
   ```bash
   npm run prisma:generate
   ```

### Frontend Build Fails

**Check Node version**:
```bash
node --version  # Should be 20.x+
```

**Clear cache and rebuild**:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### Database Connection Issues

**Test connection**:
```bash
psql -U helpdesk -h localhost -p 5432 -d helpdesk
```

**Check if PostgreSQL is running**:
```bash
# macOS
brew services list

# Linux
systemctl status postgresql

# Docker
docker ps | grep postgres
```

### Emails Not Sending

**Check MailHog is running**:
```bash
curl http://localhost:8025
```

**Check mailer logs**:
```bash
docker-compose logs -f mailer
```

**Check email queue**:
```sql
SELECT * FROM email_outbox WHERE sent = false;
```

### Swagger Not Loading

**Verify Swagger installed**:
```bash
cd backend
npm list @nestjs/swagger
```

**Restart backend**:
```bash
npm run start:dev
```

**Clear browser cache** and retry

---

## Quick Command Reference

### Development

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart service
docker-compose restart api

# Rebuild and start
docker-compose up -d --build
```

### Database

```bash
# Connect to database
psql -U helpdesk -d helpdesk

# Run migrations
npm run prisma:migrate:dev

# Open Prisma Studio
npx prisma studio

# Backup database
pg_dump -U helpdesk helpdesk > backup.sql
```

### API Testing

```bash
# Health check
curl http://localhost:3000

# Swagger docs
open http://localhost:3000/api/docs

# Test signup
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Frontend

```bash
# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

---

## Additional Resources

- **Main Documentation**: [README.md](./README.md)
- **Environment Variables**: [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)
- **Deployment Guide**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Demo Script**: [DEMO_SCRIPT.md](./DEMO_SCRIPT.md)
- **Quick Reference**: [QUICK_START.md](./QUICK_START.md)

---

**Last Updated**: 2026-01-13
**Version**: 1.0.0
