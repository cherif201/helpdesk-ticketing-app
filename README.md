# Helpdesk Ticketing System

A full-stack microservices-based helpdesk/ticketing application with complete authentication workflows, role-based access control, audit trail, admin dashboard, and OpenShift deployment support.

## Features

### Core Features
- **Authentication Workflows**
  - User signup with welcome email
  - Login with JWT tokens
  - Role-based login redirect (admin→dashboard, others→tickets)
  - Forgot password (email-based reset)
  - Reset password with secure tokens
  - Change password for authenticated users

- **Ticketing System**
  - Create support tickets
  - View user's tickets
  - Update ticket status (OPEN → IN_PROGRESS → DONE)
  - Delete tickets

### Production Features
- **Role-Based Access Control (RBAC)**
  - 2 roles: AGENT, ADMIN
  - Role-based permissions for all endpoints
  - Admin user management interface
  - Secure role assignment

- **Ticket Assignment System**
  - Assign tickets to agents (admin only)
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
  - Expandable "View History" section in ticket detail
  - Table format with date, user, action, details

- **Admin Dashboard**
  - First page shown to admin on login
  - 4 statistics cards:
    - Total tickets (all tickets in system)
    - Open tickets (awaiting action)
    - In Progress tickets (being worked on)
    - Completed tickets (resolved)

- **Modern UI with shadcn/ui**
  - Card-based layouts
  - Status badges with color coding
  - Select dropdowns (assignment shows names only)
  - Table components for audit trail
  - Alert components for errors
  - Checkbox for internal notes
  - Dark mode support

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
  - Gmail SMTP integration for production email delivery

- **API Documentation**
  - **Swagger/OpenAPI** interactive documentation
  - Available at `/api/docs` when backend is running
  - Test endpoints directly from browser
  - JWT authentication support

- **Microservices Architecture**
  - Frontend: React + Vite + shadcn/ui + Tailwind CSS
  - Backend API: NestJS + Prisma ORM + Swagger
  - Mailer Service: NestJS worker
  - Database: PostgreSQL with persistent storage
  - Email: Gmail SMTP for real email delivery

## Technology Stack

### Backend
- **Framework**: NestJS 10.3.0
- **ORM**: Prisma 5.8.0
- **Authentication**: JWT with passport-jwt
- **Password Hashing**: Argon2
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.11
- **Routing**: React Router v6
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 3.x
- **Icons**: lucide-react
- **HTTP Client**: Fetch API

### Database
- **PostgreSQL** 16 with alpine image
- **Migrations**: Prisma Migrate
- **Models**: 7 tables (users, tickets, comments, audit_events, password_reset_tokens, email_outbox, email_verification_tokens)

### Email
- **SMTP Client**: Nodemailer
- **Provider**: Gmail SMTP (Google)

## Architecture

```
┌─────────────┐
│   Frontend  │ (React + Vite + shadcn/ui, Port 8080)
└──────┬──────┘
       │ HTTP/REST
       ▼
┌─────────────┐
│  Backend API│ (NestJS + Swagger, Port 3000)
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
                  │ Gmail SMTP  │
                  │ (smtp.gmail │
                  │  .com:587)  │
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

3. **Deploy database**:
```bash
oc apply -f openshift/04-postgres-pvc.yaml
oc apply -f openshift/05-postgres-deployment.yaml
oc apply -f openshift/06-postgres-service.yaml
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

### Email Testing

Emails are sent via Gmail SMTP to real email addresses:
1. Perform any action that triggers an email (signup, forgot password, ticket creation)
2. Check the recipient's inbox for the email
3. Verify email_outbox table in database for delivery status

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
- `POST /auth/login` - Login (returns JWT + user with role)
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with token
- `POST /auth/change-password` - Change password (authenticated)

### Tickets
- `POST /tickets` - Create ticket (authenticated)
- `GET /tickets` - Get user's tickets (authenticated)
- `GET /tickets/inbox` - Get assigned tickets (authenticated)
- `GET /tickets/:id` - Get ticket details (authenticated)
- `PATCH /tickets/:id` - Update ticket status (authenticated)
- `PATCH /tickets/:id/assign` - Assign ticket (admin only)
- `DELETE /tickets/:id` - Delete ticket (authenticated)
- `GET /tickets/:id/audit` - Get audit trail (admin/agent only)

### Comments
- `POST /tickets/:id/comments` - Add comment (authenticated)
- `GET /tickets/:id/comments` - Get comments (authenticated)

### Admin
- `GET /admin/users` - List all users (admin only)
- `GET /admin/agents` - List agents (admin only)
- `PATCH /admin/users/:id/role` - Update user role (admin only)
- `DELETE /admin/users/:id` - Delete user (admin only)
- `GET /admin/dashboard/statistics` - Get dashboard stats (admin only)

### Health
- `GET /health` - Health check
- `GET /ready` - Readiness probe
- `GET /metrics` - Prometheus metrics

## Environment Variables

### Backend API
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `FRONTEND_BASE_URL` - Frontend URL for email links
- `PORT` - Server port (default: 3000)

### Mailer Service
- `DATABASE_URL` - PostgreSQL connection string
- `SMTP_HOST` - SMTP server hostname (smtp.gmail.com for Gmail)
- `SMTP_PORT` - SMTP server port (587 for Gmail TLS)
- `SMTP_USER` - Gmail email address
- `SMTP_PASS` - Gmail App Password (not regular password)
- `SMTP_FROM` - From email address (same as SMTP_USER)
- `POLL_INTERVAL_MS` - Email polling interval (default: 5000)

**Gmail Setup**: Create an App Password at https://myaccount.google.com/apppasswords (requires 2FA enabled)

### Frontend
- `VITE_API_URL` - Backend API URL

## Database Schema

### Users
- Email/password authentication
- Profile information (firstName, lastName)
- Role (AGENT, ADMIN)
- Email verification status

### Tickets
- Title, description, status
- Linked to creator user
- Optional assignment to agent
- Status: OPEN, IN_PROGRESS, DONE

### Comments
- Body text
- Linked to ticket and author
- Internal flag for staff-only notes

### AuditEvents
- Actor, action, entity type/id
- JSON metadata
- Timestamp

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
- Role-based access control (RBAC)
- Secure password reset tokens (hashed)
- CORS configuration
- Input validation
- SQL injection prevention (Prisma ORM)

## Routing Behavior

### Root Path (/)
- **Not logged in** → Redirects to `/login`
- **Admin logged in** → Redirects to `/dashboard`
- **Agent/User logged in** → Redirects to `/tickets`

### After Login
- **Admin** → Redirects to `/dashboard`
- **Agent/User** → Redirects to `/tickets`

### Navigation Menu
**Admin sees:**
Dashboard | My Tickets | My Inbox | Manage Users | Change Password | Logout

**Agent/User sees:**
My Tickets | My Inbox | Change Password | Logout

## Project Structure

```
helpdesk-ticketing-app/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── admin/       # Admin module (user management, dashboard)
│   │   ├── audit/       # Audit trail module
│   │   ├── auth/        # Authentication module
│   │   ├── common/      # Shared utilities (guards, decorators)
│   │   ├── email/       # Email service
│   │   ├── health/      # Health check module
│   │   ├── prisma/      # Prisma service
│   │   └── tickets/     # Tickets module
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
│   │   │   ├── ui/     # shadcn/ui components
│   │   │   └── ...     # Layout, routing components
│   │   ├── context/    # Auth context
│   │   ├── pages/      # Page components
│   │   └── services/   # API client
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
- **[COMPLETE_PROJECT_TREE.txt](./COMPLETE_PROJECT_TREE.txt)** - Full file tree with statistics

## Troubleshooting

### Database connection issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify credentials in secrets
- See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for detailed configuration

### Emails not sending
- Verify Gmail App Password is correct (not regular password)
- Ensure 2FA is enabled on Gmail account
- Check mailer service logs for SMTP errors
- Check email_outbox table for errors and retry attempts
- Verify SMTP_HOST=smtp.gmail.com and SMTP_PORT=587
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

## Version History

### v2.0.0 (2026-01-18) - Current
- Role-Based Access Control (RBAC)
- Ticket assignment system
- Comments & internal notes
- Audit trail system
- Admin dashboard with statistics
- Modern UI with shadcn/ui
- Role-based routing
- Health & metrics endpoints
- Swagger API documentation

### v1.0.0 (2026-01-13)
- Initial release
- Authentication workflows
- Basic ticketing system
- Email service with Gmail SMTP
- OpenShift deployment

## License

MIT

## Contributing

Pull requests welcome! Please ensure tests pass and follow the existing code style.
