# Environment Variables Setup Guide

Complete guide for configuring all environment variables needed to run the Helpdesk Ticketing System.

## Table of Contents
1. [Backend API Environment Variables](#backend-api-environment-variables)
2. [Mailer Service Environment Variables](#mailer-service-environment-variables)
3. [Frontend Environment Variables](#frontend-environment-variables)
4. [PostgreSQL Environment Variables](#postgresql-environment-variables)
5. [Local Development Setup](#local-development-setup)
6. [OpenShift/Production Setup](#openshiftproduction-setup)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Backend API Environment Variables

**Location**: `backend/.env`

### Required Variables

```bash
# Database Connection
DATABASE_URL="postgresql://username:password@host:port/database"
# Example (local): postgresql://helpdesk:password@localhost:5432/helpdesk
# Example (OpenShift): postgresql://helpdesk:helpdesk123@postgres:5432/helpdesk

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
# Must be a strong random string. Generate with: openssl rand -base64 32

# Frontend URL (for CORS and email links)
FRONTEND_BASE_URL="http://localhost:5173"
# Local development: http://localhost:5173
# Production: https://frontend-helpdesk.apps.example.com

# API Port
PORT=3000
# Default: 3000
```

### Example `.env` File

Create `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk

# Security
JWT_SECRET=super-secret-jwt-key-change-this

# Application
FRONTEND_BASE_URL=http://localhost:5173
PORT=3000
```

### Environment Variable Details

#### `DATABASE_URL`
- **Format**: `postgresql://[user]:[password]@[host]:[port]/[database]`
- **Required**: Yes
- **Purpose**: PostgreSQL connection string used by Prisma ORM
- **Notes**:
  - User must have CREATE, READ, UPDATE, DELETE permissions
  - Database must exist or Prisma migrations will fail
  - Use `localhost` for local development
  - Use service name (`postgres`) in Docker/OpenShift

#### `JWT_SECRET`
- **Required**: Yes
- **Purpose**: Secret key for signing JWT tokens
- **Security**:
  - **MUST** be changed in production
  - Should be at least 32 characters
  - Use random, cryptographically secure string
  - Never commit to version control
- **Generate**:
  ```bash
  # Linux/Mac
  openssl rand -base64 32

  # Node.js
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

  # Online
  https://randomkeygen.com/
  ```

#### `FRONTEND_BASE_URL`
- **Required**: Yes
- **Purpose**:
  - CORS configuration (allowed origin)
  - Email password reset links
- **Format**: Full URL including protocol, no trailing slash
- **Examples**:
  - Local: `http://localhost:5173`
  - Development: `https://dev-helpdesk.example.com`
  - Production: `https://helpdesk.example.com`

#### `PORT`
- **Required**: No (defaults to 3000)
- **Purpose**: HTTP server port
- **Common values**:
  - Local: `3000`
  - Production: `3000` or `8080`

---

## Mailer Service Environment Variables

**Location**: `mailer/.env`

### Required Variables

```bash
# Database Connection (same as backend)
DATABASE_URL="postgresql://helpdesk:password@localhost:5432/helpdesk"

# SMTP Configuration
SMTP_HOST="mailhog"              # SMTP server hostname
SMTP_PORT="1025"                 # SMTP server port
SMTP_USER=""                     # SMTP username (optional)
SMTP_PASS=""                     # SMTP password (optional)
SMTP_FROM="noreply@helpdesk.local"  # From email address

# Polling Configuration
POLL_INTERVAL_MS="5000"          # Email queue polling interval (milliseconds)
```

### Example `.env` File

Create `mailer/.env`:

```bash
# Database (must match backend)
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk

# SMTP (MailHog for testing)
SMTP_HOST=mailhog
SMTP_PORT=1025
SMTP_FROM=noreply@helpdesk.local

# Polling
POLL_INTERVAL_MS=5000
```

### Environment Variable Details

#### `SMTP_HOST`
- **Required**: Yes
- **Purpose**: SMTP server hostname/IP
- **Examples**:
  - MailHog (testing): `mailhog` or `localhost`
  - SendGrid: `smtp.sendgrid.net`
  - AWS SES: `email-smtp.us-east-1.amazonaws.com`
  - Gmail: `smtp.gmail.com`

#### `SMTP_PORT`
- **Required**: Yes
- **Purpose**: SMTP server port
- **Common ports**:
  - `25`: Standard SMTP (unencrypted)
  - `587`: SMTP with STARTTLS (recommended)
  - `465`: SMTP with SSL/TLS
  - `1025`: MailHog (testing)

#### `SMTP_USER` and `SMTP_PASS`
- **Required**: No (depends on SMTP provider)
- **Purpose**: SMTP authentication
- **Notes**:
  - MailHog doesn't require authentication
  - Most production SMTP servers require credentials
  - Store in secrets, not in code

#### `SMTP_FROM`
- **Required**: Yes
- **Purpose**: Default "From" email address
- **Format**: `email@domain.com` or `"Display Name" <email@domain.com>`
- **Examples**:
  - `noreply@helpdesk.local`
  - `"Helpdesk Support" <support@helpdesk.com>`

#### `POLL_INTERVAL_MS`
- **Required**: No (defaults to 5000)
- **Purpose**: How often to check for new emails in queue
- **Unit**: Milliseconds
- **Recommendations**:
  - Development: `5000` (5 seconds)
  - Production: `10000` (10 seconds) to `30000` (30 seconds)
  - Lower = faster emails, higher CPU usage

---

## Frontend Environment Variables

**Location**: `frontend/.env` (for local dev)

### Required Variables

```bash
VITE_API_URL="http://localhost:3000"
```

### Example `.env` File

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:3000
```

### Environment Variable Details

#### `VITE_API_URL`
- **Required**: Yes
- **Purpose**: Backend API base URL
- **Format**: Full URL including protocol, no trailing slash
- **Examples**:
  - Local: `http://localhost:3000`
  - Production: `https://api-helpdesk.apps.example.com`
- **Notes**:
  - Vite only includes variables prefixed with `VITE_`
  - Changes require rebuild (`npm run build`)
  - Accessed in code as `import.meta.env.VITE_API_URL`

### Build-Time vs Runtime

⚠️ **Important**: Frontend environment variables are **build-time**, not runtime.

- Variables are embedded during `npm run build`
- Changing `.env` after build has **no effect**
- Must rebuild to apply changes

For runtime configuration in containers, options:
1. Build separate images per environment
2. Use build args: `docker build --build-arg VITE_API_URL=...`
3. Inject via nginx config/templating

---

## PostgreSQL Environment Variables

**Location**: Used in `docker-compose.yml` or OpenShift secrets

### Required Variables

```bash
POSTGRES_USER="helpdesk"
POSTGRES_PASSWORD="password"
POSTGRES_DB="helpdesk"
PGDATA="/var/lib/postgresql/data/pgdata"
```

### Variable Details

#### `POSTGRES_USER`
- **Required**: Yes
- **Purpose**: PostgreSQL superuser username
- **Default**: `helpdesk`
- **Notes**: Created on first container start

#### `POSTGRES_PASSWORD`
- **Required**: Yes
- **Purpose**: PostgreSQL superuser password
- **Security**: Change default in production!

#### `POSTGRES_DB`
- **Required**: Yes
- **Purpose**: Initial database name to create
- **Default**: `helpdesk`

#### `PGDATA`
- **Required**: No (has default)
- **Purpose**: Data directory path inside container
- **Default**: `/var/lib/postgresql/data/pgdata`
- **Notes**: Used for volume mounts

---

## Local Development Setup

### Step-by-Step Configuration

#### 1. Backend Setup

```bash
cd backend

# Copy example file
cp .env.example .env

# Edit .env
nano .env  # or use your editor
```

**Edit `backend/.env`**:
```bash
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk
JWT_SECRET=local-dev-secret-key-change-in-production
FRONTEND_BASE_URL=http://localhost:5173
PORT=3000
```

#### 2. Mailer Setup

```bash
cd mailer

# Copy example file
cp .env.example .env

# Edit .env
nano .env
```

**Edit `mailer/.env`**:
```bash
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM=noreply@helpdesk.local
POLL_INTERVAL_MS=5000
```

#### 3. Frontend Setup

```bash
cd frontend

# Create .env file
echo "VITE_API_URL=http://localhost:3000" > .env
```

#### 4. PostgreSQL Setup

**Using Docker Compose** (recommended):
```bash
# postgres service in docker-compose.yml handles this
docker-compose up -d postgres
```

**Using local PostgreSQL**:
```bash
# Create database
createdb helpdesk

# Create user
psql -c "CREATE USER helpdesk WITH PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;"
```

#### 5. Initialize Database

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate:dev
```

#### 6. Start Services

**Option A: Docker Compose (all services)**
```bash
docker-compose up -d
```

**Option B: Manual (each terminal)**
```bash
# Terminal 1: Database
docker-compose up postgres mailhog

# Terminal 2: Backend
cd backend
npm run start:dev

# Terminal 3: Mailer
cd mailer
npm run start:dev

# Terminal 4: Frontend
cd frontend
npm run dev
```

### Verify Setup

```bash
# Check backend
curl http://localhost:3000

# Check frontend
curl http://localhost:5173

# Check MailHog UI
open http://localhost:8025

# Check Swagger docs
open http://localhost:3000/api/docs
```

---

## OpenShift/Production Setup

### Configuration Sources

Environment variables in OpenShift come from:
1. **Secrets** (sensitive data)
2. **ConfigMaps** (non-sensitive config)
3. **DeploymentConfig** (inline env vars)

### Secrets Configuration

**File**: `openshift/02-secrets.yaml`

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secret
  namespace: helpdesk
type: Opaque
stringData:
  JWT_SECRET: "production-secret-key-use-openssl-rand"
  DATABASE_URL: "postgresql://helpdesk:strong-password@postgres:5432/helpdesk"
```

**Update secrets**:
```bash
# Update JWT secret
oc patch secret app-secret -n helpdesk -p '{"stringData":{"JWT_SECRET":"<new-secret>"}}'

# Update DATABASE_URL
oc patch secret app-secret -n helpdesk -p '{"stringData":{"DATABASE_URL":"postgresql://helpdesk:<new-password>@postgres:5432/helpdesk"}}'
```

### ConfigMaps Configuration

**File**: `openshift/03-configmaps.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: helpdesk
data:
  FRONTEND_BASE_URL: "https://frontend-helpdesk.apps.example.com"
  PORT: "3000"
```

**Update ConfigMaps**:
```bash
# Get actual frontend URL
FRONTEND_URL=$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')

# Update ConfigMap
oc patch configmap api-config -n helpdesk -p "{\"data\":{\"FRONTEND_BASE_URL\":\"https://${FRONTEND_URL}\"}}"

# Rollout to apply changes
oc rollout latest dc/api -n helpdesk
```

### Deployment Configuration

**File**: `openshift/10-api-deployment.yaml`

```yaml
env:
  - name: DATABASE_URL
    valueFrom:
      secretKeyRef:
        name: app-secret
        key: DATABASE_URL
  - name: JWT_SECRET
    valueFrom:
      secretKeyRef:
        name: app-secret
        key: JWT_SECRET
  - name: FRONTEND_BASE_URL
    valueFrom:
      configMapKeyRef:
        name: api-config
        key: FRONTEND_BASE_URL
  - name: PORT
    valueFrom:
      configMapKeyRef:
        name: api-config
        key: PORT
```

### Production Checklist

- [ ] Change default PostgreSQL password
- [ ] Generate strong JWT_SECRET (32+ chars)
- [ ] Update FRONTEND_BASE_URL with actual route
- [ ] Configure real SMTP provider (not MailHog)
- [ ] Set SMTP credentials in secrets
- [ ] Verify DATABASE_URL uses strong password
- [ ] Test all environment variables are loaded
- [ ] Check application logs for errors

---

## Common Issues & Solutions

### Issue: "Connection refused" to database

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions**:
1. Check DATABASE_URL host:
   - Local: Use `localhost` or `127.0.0.1`
   - Docker: Use service name (`postgres`)
   - OpenShift: Use service name (`postgres`)

2. Verify PostgreSQL is running:
   ```bash
   # Docker Compose
   docker-compose ps postgres

   # OpenShift
   oc get pods -l app=postgres
   ```

3. Check port:
   - PostgreSQL default: `5432`
   - Ensure no firewall blocking

### Issue: JWT authentication fails

**Symptoms**:
```
401 Unauthorized
Invalid token
```

**Solutions**:
1. Verify JWT_SECRET matches between:
   - Backend `.env`
   - Any load balancer/proxy configuration

2. Check token expiry:
   - Default: 7 days
   - Token may have expired

3. Ensure JWT_SECRET is set:
   ```bash
   # Check if loaded
   echo $JWT_SECRET
   ```

### Issue: CORS errors in browser

**Symptoms**:
```
Access to fetch at 'http://localhost:3000' blocked by CORS policy
```

**Solutions**:
1. Verify FRONTEND_BASE_URL matches actual frontend URL:
   ```bash
   # Check backend config
   curl http://localhost:3000

   # Should allow origin: http://localhost:5173
   ```

2. Update FRONTEND_BASE_URL:
   ```bash
   # Backend .env
   FRONTEND_BASE_URL=http://localhost:5173
   ```

3. Restart backend after changing:
   ```bash
   npm run start:dev
   ```

### Issue: Emails not sending

**Symptoms**:
- No emails in MailHog
- Email queue (`email_outbox`) has `sent = false`

**Solutions**:
1. Check mailer service is running:
   ```bash
   # Docker
   docker-compose ps mailer

   # OpenShift
   oc get pods -l app=mailer
   ```

2. Check SMTP configuration:
   ```bash
   # Verify mailer can reach SMTP server
   nc -zv localhost 1025  # MailHog
   ```

3. Check mailer logs:
   ```bash
   # Docker
   docker-compose logs -f mailer

   # OpenShift
   oc logs -f dc/mailer
   ```

4. Verify DATABASE_URL in mailer matches backend

### Issue: Frontend can't reach API

**Symptoms**:
- Frontend loads but API calls fail
- Network errors in browser console

**Solutions**:
1. Check VITE_API_URL:
   ```bash
   # frontend/.env
   VITE_API_URL=http://localhost:3000
   ```

2. **Rebuild frontend** after changing:
   ```bash
   cd frontend
   npm run build
   # or
   npm run dev  # for development
   ```

3. Verify API is accessible:
   ```bash
   curl http://localhost:3000
   ```

### Issue: Swagger docs not loading

**Symptoms**:
- `/api/docs` returns 404

**Solutions**:
1. Ensure `@nestjs/swagger` is installed:
   ```bash
   cd backend
   npm install @nestjs/swagger
   ```

2. Restart backend:
   ```bash
   npm run start:dev
   ```

3. Access correct URL:
   ```
   http://localhost:3000/api/docs
   ```

### Issue: Prisma migration fails

**Symptoms**:
```
Can't reach database server
Migration engine error
```

**Solutions**:
1. Verify DATABASE_URL format:
   ```
   postgresql://[user]:[password]@[host]:[port]/[database]
   ```

2. Test connection:
   ```bash
   psql "postgresql://helpdesk:password@localhost:5432/helpdesk"
   ```

3. Ensure database exists:
   ```bash
   createdb helpdesk
   ```

4. Check user permissions:
   ```sql
   GRANT ALL PRIVILEGES ON DATABASE helpdesk TO helpdesk;
   ```

---

## Environment Variable Templates

### Complete `.env` Template for Backend

```bash
# ================================
# BACKEND ENVIRONMENT VARIABLES
# ================================

# Database Connection
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk

# JWT Authentication
# Generate with: openssl rand -base64 32
# MUST be changed in production!
JWT_SECRET=super-secret-jwt-key-change-this

# Frontend URL for CORS and email links
# No trailing slash
FRONTEND_BASE_URL=http://localhost:5173

# API Server Port
PORT=3000
```

### Complete `.env` Template for Mailer

```bash
# ================================
# MAILER ENVIRONMENT VARIABLES
# ================================

# Database Connection (must match backend)
DATABASE_URL=postgresql://helpdesk:password@localhost:5432/helpdesk

# SMTP Server Configuration
SMTP_HOST=mailhog                 # or smtp.gmail.com, etc.
SMTP_PORT=1025                    # or 587, 465, etc.
SMTP_USER=                        # optional, for authenticated SMTP
SMTP_PASS=                        # optional, for authenticated SMTP
SMTP_FROM=noreply@helpdesk.local  # sender email address

# Polling Interval (milliseconds)
# How often to check for new emails in queue
POLL_INTERVAL_MS=5000
```

### Complete `.env` Template for Frontend

```bash
# ================================
# FRONTEND ENVIRONMENT VARIABLES
# ================================

# Backend API Base URL
# No trailing slash
VITE_API_URL=http://localhost:3000
```

---

## Quick Reference Table

| Variable | Service | Required | Default | Purpose |
|----------|---------|----------|---------|---------|
| `DATABASE_URL` | Backend, Mailer | Yes | - | PostgreSQL connection |
| `JWT_SECRET` | Backend | Yes | - | JWT token signing |
| `FRONTEND_BASE_URL` | Backend | Yes | - | CORS + email links |
| `PORT` | Backend | No | `3000` | HTTP server port |
| `SMTP_HOST` | Mailer | Yes | - | SMTP server hostname |
| `SMTP_PORT` | Mailer | Yes | - | SMTP server port |
| `SMTP_FROM` | Mailer | Yes | - | From email address |
| `POLL_INTERVAL_MS` | Mailer | No | `5000` | Email polling interval |
| `VITE_API_URL` | Frontend | Yes | - | Backend API URL |
| `POSTGRES_USER` | PostgreSQL | Yes | - | Database user |
| `POSTGRES_PASSWORD` | PostgreSQL | Yes | - | Database password |
| `POSTGRES_DB` | PostgreSQL | Yes | - | Database name |

---

## Additional Resources

- **Prisma Connection Strings**: https://www.prisma.io/docs/reference/database-reference/connection-urls
- **NestJS Configuration**: https://docs.nestjs.com/techniques/configuration
- **Vite Environment Variables**: https://vitejs.dev/guide/env-and-mode.html
- **OpenShift ConfigMaps**: https://docs.openshift.com/container-platform/latest/nodes/pods/nodes-pods-configmaps.html
- **OpenShift Secrets**: https://docs.openshift.com/container-platform/latest/nodes/pods/nodes-pods-secrets.html

---

**Last Updated**: 2026-01-13
**Version**: 1.0.0
