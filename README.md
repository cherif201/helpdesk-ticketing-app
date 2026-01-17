# Helpdesk Ticketing System

A full-stack microservices-based helpdesk/ticketing application with complete authentication workflows, email service, and OpenShift deployment support.

## Features

### Core Features
- **Authentication Workflows**
  - User signup with welcome email
  - Login with JWT tokens
  - Forgot password (email-based reset)
  - Reset password with secure tokens
  - Change password for authenticated users

- **Ticketing System**
  - Create support tickets
  - View user's tickets
  - Update ticket status (OPEN → IN_PROGRESS → DONE)

### 🆕 Production Features (NEW)
- **Role-Based Access Control (RBAC)**
  - 3 roles: USER, AGENT, ADMIN
  - Role-based permissions for all endpoints
  - Admin user management interface
  - Secure role assignment

- **Ticket Assignment System**
  - Assign tickets to agents
  - Agent inbox view for assigned tickets
  - Unassign functionality
  - Role-based ticket visibility

- **Comments & Internal Notes**
  - Public comments visible to ticket creator
  - Internal notes (staff-only, not visible to users)
  - Complete comment history per ticket

- **Audit Trail System**
  - Comprehensive event logging
  - Tracks all ticket changes (status, assignment)
  - Records comment additions
  - Timestamped audit timeline

- **Email Notifications**
  - Ticket creation notifications
  - Status change alerts
  - Assignment notifications to agents
  - Staff notifications for new tickets
  - Gmail SMTP integration

- **Health & Metrics**
  - Health check endpoint (`/health`)
  - Readiness probe (`/ready`)
  - Prometheus-compatible metrics (`/metrics`)
  - Database connectivity monitoring

- **Email Service**
  - Decoupled architecture with email queue
  - Separate mailer worker service
  - SMTP integration with MailHog for testing

- **API Documentation**
  - **Swagger/OpenAPI** interactive documentation
  - Available at `/api/docs` when backend is running
  - Test endpoints directly from browser
  - JWT authentication support

- **Microservices Architecture**
  - Frontend: React + Vite + React Router
  - Backend API: NestJS + Prisma ORM + Swagger
  - Mailer Service: NestJS worker
  - Database: PostgreSQL with persistent storage
  - Email Testing: MailHog (SMTP sink + UI)

## Technology Stack

### Backend
- **Framework**: NestJS
- **ORM**: Prisma
- **Authentication**: JWT with passport-jwt
- **Password Hashing**: Argon2
- **Validation**: class-validator

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **HTTP Client**: Fetch API

### Database
- **PostgreSQL** 16 with alpine image
- **Migrations**: Prisma Migrate

### Email
- **SMTP Client**: Nodemailer
- **Testing**: MailHog

## Architecture

```
┌─────────────┐
│   Frontend  │ (React + Vite, Port 8080)
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│  Backend API│ (NestJS, Port 3000)
└──┬──────┬───┘
   │      │
   │      └────────────┐
   ▼                   ▼
┌─────────────┐   ┌──────────────┐
│  PostgreSQL │◄──┤ Mailer Worker│
│  (Port 5432)│   │   (NestJS)   │
└─────────────┘   └──────┬───────┘
                         │
                         ▼
                  ┌─────────────┐
                  │   MailHog   │
                  │ (SMTP:1025) │
                  │  (UI:8025)  │
                  └─────────────┘
```

## Local Development

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm or yarn

### Quick Start with Docker Compose

1. Clone the repository:
```bash
git clone <repository-url>
cd helpdesk-ticketing-app
```

2. Start all services:
```bash
docker-compose up -d
```

3. Wait for services to start (check logs):
```bash
docker-compose logs -f
```

4. Access the application:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **Swagger API Docs**: http://localhost:3000/api/docs
- **MailHog UI**: http://localhost:8025
- **PostgreSQL**: localhost:5432

5. Stop services:
```bash
docker-compose down
```

### Swagger API Documentation

Once the backend is running, access interactive API documentation at:

```
http://localhost:3000/api/docs
```

Features:
- Try all endpoints directly from browser
- JWT authentication support (click "Authorize" button)
- Request/response examples
- Schema documentation

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed Swagger usage.

### Manual Setup (Without Docker)

#### 1. Setup PostgreSQL
```bash
# Install and start PostgreSQL
# Create database
createdb helpdesk
```

#### 2. Setup Backend API
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

#### 3. Setup Mailer Service
```bash
cd mailer
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database and SMTP settings

# Start mailer worker
npm run start:dev
```

#### 4. Setup Frontend
```bash
cd frontend
npm install

# Start development server
npm run dev
```

## OpenShift Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed OpenShift deployment instructions.

### Quick Deployment Steps

1. **Login to OpenShift**:
```bash
oc login <your-openshift-cluster>
```

2. **Create namespace and apply configurations**:
```bash
oc apply -f openshift/01-namespace.yaml
oc apply -f openshift/00-imagestreams.yaml
oc apply -f openshift/02-secrets.yaml
oc apply -f openshift/03-configmaps.yaml
```

3. **Deploy database and supporting services**:
```bash
oc apply -f openshift/04-postgres-pvc.yaml
oc apply -f openshift/05-postgres-deployment.yaml
oc apply -f openshift/06-postgres-service.yaml
oc apply -f openshift/07-mailhog-deployment.yaml
oc apply -f openshift/08-mailhog-service.yaml
oc apply -f openshift/09-mailhog-route.yaml
```

4. **Build and push images**:
```bash
# Build and tag images
docker build -t api:latest ./backend
docker build -t mailer:latest ./mailer
docker build -t frontend:latest ./frontend

# Tag for OpenShift registry
docker tag api:latest image-registry.openshift-image-registry.svc:5000/helpdesk/api:latest
docker tag mailer:latest image-registry.openshift-image-registry.svc:5000/helpdesk/mailer:latest
docker tag frontend:latest image-registry.openshift-image-registry.svc:5000/helpdesk/frontend:latest

# Push to OpenShift
docker push image-registry.openshift-image-registry.svc:5000/helpdesk/api:latest
docker push image-registry.openshift-image-registry.svc:5000/helpdesk/mailer:latest
docker push image-registry.openshift-image-registry.svc:5000/helpdesk/frontend:latest
```

5. **Deploy application services**:
```bash
oc apply -f openshift/10-api-deployment.yaml
oc apply -f openshift/11-api-service.yaml
oc apply -f openshift/12-api-route.yaml
oc apply -f openshift/13-mailer-deployment.yaml
oc apply -f openshift/14-frontend-deployment.yaml
oc apply -f openshift/15-frontend-service.yaml
oc apply -f openshift/16-frontend-route.yaml
```

6. **Update ConfigMap with actual route**:
```bash
# Get frontend route
FRONTEND_URL=$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')

# Update API ConfigMap
oc patch configmap api-config -n helpdesk -p "{\"data\":{\"FRONTEND_BASE_URL\":\"https://${FRONTEND_URL}\"}}"

# Rollout API to pick up new config
oc rollout latest dc/api -n helpdesk
```

## Demo & Testing

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for a complete demo walkthrough.

### Email Testing with MailHog

1. Access MailHog UI at http://localhost:8025 (local) or via OpenShift route
2. Perform any action that triggers an email (signup, forgot password)
3. Check MailHog UI to see the email

### Scaling Demo

Scale the API to 3 replicas:
```bash
oc scale dc/api --replicas=3 -n helpdesk
```

Verify scaling:
```bash
oc get pods -n helpdesk -l app=api
```

Test the application still works correctly with multiple replicas.

## API Endpoints

### Authentication
- `POST /auth/signup` - Create new account
- `POST /auth/login` - Login
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)

### Tickets
- `POST /tickets` - Create ticket (authenticated)
- `GET /tickets` - Get user's tickets (authenticated)
- `PATCH /tickets/:id` - Update ticket status (authenticated)

## Environment Variables

### Backend API
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `FRONTEND_BASE_URL` - Frontend URL for email links
- `PORT` - Server port (default: 3000)

### Mailer Service
- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP server port
- `SMTP_USER` - SMTP username (optional)
- `SMTP_PASS` - SMTP password (optional)
- `SMTP_FROM` - From email address
- `POLL_INTERVAL_MS` - Email polling interval (default: 5000)

### Frontend
- `VITE_API_URL` - Backend API URL

## Database Schema

### Users
- Email/password authentication
- Profile information (firstName, lastName)

### Tickets
- Title, description, status
- Linked to user
- Status: OPEN, IN_PROGRESS, DONE

### PasswordResetTokens
- Hashed tokens with expiry
- One-time use
- 1-hour validity

### EmailOutbox
- Email queue for async sending
- Retry mechanism (max 5 attempts)
- Error tracking

## Security Features

- Password hashing with Argon2
- JWT-based authentication
- Secure password reset tokens (hashed)
- CORS configuration
- Input validation
- SQL injection prevention (Prisma ORM)

## Project Structure

```
helpdesk-ticketing-app/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/        # Authentication module
│   │   ├── tickets/     # Tickets module
│   │   ├── email/       # Email service
│   │   └── prisma/      # Prisma service
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
├── mailer/              # Email worker service
│   ├── src/
│   │   └── mailer.service.ts
│   └── Dockerfile
├── frontend/            # React application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── Dockerfile
├── openshift/           # OpenShift YAML configs
└── docker-compose.yml
```

## Documentation

This project includes comprehensive documentation:

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup guide with Nginx, database, and service configuration
- **[ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md)** - Detailed environment variables guide for all services
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - OpenShift deployment guide with troubleshooting
- **[DEMO_SCRIPT.md](./DEMO_SCRIPT.md)** - Step-by-step demo walkthrough (30-40 minutes)
- **[QUICK_START.md](./QUICK_START.md)** - Quick reference with exact oc commands
- **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete technical summary
- **[INDEX.md](./INDEX.md)** - Navigation guide for all documentation

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify credentials in secrets
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration

### Emails not sending
- Check MailHog is running
- Verify mailer service logs
- Check email_outbox table for errors
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md#mailer-service-configuration) for debugging steps

### Frontend can't reach API
- Check VITE_API_URL environment variable
- Verify CORS configuration
- Check network connectivity
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md#frontend-environment-variables) for details

### Swagger not loading
- Ensure `@nestjs/swagger` is installed
- Restart backend service
- Access at http://localhost:3000/api/docs
- See [SETUP_GUIDE.md](./SETUP_GUIDE.md#swagger-api-documentation) for usage

For more troubleshooting, see [SETUP_GUIDE.md](./SETUP_GUIDE.md#troubleshooting)

## License

MIT

## Contributing

Pull requests welcome! Please ensure tests pass and follow the existing code style.
