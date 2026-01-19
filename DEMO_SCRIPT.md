# Demo Script - Helpdesk Ticketing System

Complete demonstration walkthrough for showcasing all features of the application.

## Pre-Demo Setup

### Local Environment
```bash
# Start all services
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose ps

# Verify all services are healthy
curl http://localhost:3000
curl http://localhost:8025
```

### OpenShift Environment
```bash
# Verify all pods are running
oc get pods -n helpdesk

# Get application URLs
FRONTEND_URL=$(oc get route frontend -n helpdesk -o jsonpath='{.spec.host}')
API_URL=$(oc get route api -n helpdesk -o jsonpath='{.spec.host}')
MAILHOG_URL=$(oc get route mailhog -n helpdesk -o jsonpath='{.spec.host}')

echo "Frontend: https://${FRONTEND_URL}"
echo "API: https://${API_URL}"
echo "MailHog: https://${MAILHOG_URL}"
```

## Demo Flow

### Part 1: User Registration & Welcome Email (5 minutes)

#### Step 1.1: Open MailHog UI
```
Local: http://localhost:8025
OpenShift: https://<mailhog-route>
```
- Show the MailHog interface (should be empty initially)
- Explain: This is our SMTP testing tool that captures all emails

#### Step 1.2: Access Frontend
```
Local: http://localhost:8080
OpenShift: https://<frontend-route>
```
- Navigate to the application
- Click "Sign Up"

#### Step 1.3: Create Account
Fill in the signup form:
- **Email**: `demo@example.com`
- **Password**: `Demo123456`
- **First Name**: `John`
- **Last Name**: `Doe`
- Click "Sign Up"

**Expected Results**:
- ✅ User redirected to tickets page
- ✅ JWT token stored in localStorage
- ✅ Welcome email queued

#### Step 1.4: Check MailHog for Welcome Email
- Switch to MailHog UI
- **Expected**: Welcome email appears within 5-10 seconds
- Show email content:
  ```
  Subject: Welcome to Helpdesk
  Body: Hello John, Welcome to Helpdesk!...
  ```

**Demo Points**:
- ✨ Email sent asynchronously (doesn't block signup)
- ✨ Separate mailer service polls database
- ✨ Emails queued in `email_outbox` table

#### Step 1.5: Verify Email Queue (Technical Detail)
```bash
# Show email_outbox table
docker-compose exec postgres psql -U helpdesk -d helpdesk -c "SELECT id, to, subject, sent, sent_at FROM email_outbox;"

# Or in OpenShift
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "SELECT id, to, subject, sent, sent_at FROM email_outbox;"
```

**Expected**:
- One record with `sent = true`
- `sent_at` timestamp populated

---

### Part 2: Logout & Login (2 minutes)

#### Step 2.1: Logout
- Click "Logout" in navigation
- **Expected**: Redirected to login page

#### Step 2.2: Login
- Enter credentials:
  - **Email**: `demo@example.com`
  - **Password**: `Demo123456`
- Click "Login"
- **Expected**: Redirected back to tickets page

**Demo Points**:
- ✨ JWT authentication
- ✨ Protected routes (can't access /tickets without login)
- ✨ Token persisted in localStorage

---

### Part 3: Password Reset Flow (5 minutes)

#### Step 3.1: Initiate Password Reset
- Logout if logged in
- Go to Login page
- Click "Forgot password?"
- Enter email: `demo@example.com`
- Click "Send Reset Link"
- **Expected**: Success message shown

**Demo Points**:
- ✨ Always returns success (prevents email enumeration)
- ✨ Secure token generated and hashed
- ✨ Email queued asynchronously

#### Step 3.2: Check Reset Email in MailHog
- Switch to MailHog UI
- **Expected**: New email appears
- Show email content with reset link:
  ```
  Subject: Password Reset Request
  Body: Click the link below to reset your password:
  http://localhost:8080/reset-password?token=<long-token>
  ```

#### Step 3.3: Copy Reset Link
- In MailHog, click the email
- Copy the reset link from email body

#### Step 3.4: Reset Password
- Open the reset link in browser
- Enter new password: `NewDemo123456`
- Confirm password: `NewDemo123456`
- Click "Reset Password"
- **Expected**: Success alert, redirected to login

#### Step 3.5: Verify New Password Works
- Login with:
  - **Email**: `demo@example.com`
  - **Password**: `NewDemo123456`
- **Expected**: Login successful

**Demo Points**:
- ✨ Token is hashed in database (security)
- ✨ Token expires in 1 hour
- ✨ Token is single-use (marked as used)
- ✨ Old password no longer works

---

### Part 4: Change Password (Authenticated) (3 minutes)

#### Step 4.1: Navigate to Change Password
- Click "Change Password" in navigation
- **Expected**: Change password form displayed

#### Step 4.2: Change Password
- **Current Password**: `NewDemo123456`
- **New Password**: `FinalDemo123`
- **Confirm Password**: `FinalDemo123`
- Click "Change Password"
- **Expected**: Success message

#### Step 4.3: Verify
- Logout
- Login with new password: `FinalDemo123`
- **Expected**: Login successful

**Demo Points**:
- ✨ Requires authentication (JWT guard)
- ✨ Validates old password before change
- ✨ Password hashed with Argon2

---

### Part 5: Ticket Management (5 minutes)

#### Step 5.1: Create First Ticket
- Navigate to "My Tickets"
- Click "Create New Ticket"
- Fill form:
  - **Title**: `Cannot access dashboard`
  - **Description**: `When I try to access the analytics dashboard, I get a 403 error. This started happening after yesterday's update.`
- Click "Create Ticket"
- **Expected**: Ticket created and appears in list with status "OPEN"

#### Step 5.2: Create More Tickets
Create 2 more tickets:

**Ticket 2**:
- **Title**: `Feature request: Dark mode`
- **Description**: `It would be great to have a dark mode option for the application.`

**Ticket 3**:
- **Title**: `Bug: Export CSV not working`
- **Description**: `When I click the Export button, nothing happens. Console shows a CORS error.`

#### Step 5.3: Update Ticket Status
- Find first ticket (`Cannot access dashboard`)
- Click "Mark as In Progress"
- **Expected**: Status changes to "IN_PROGRESS" (orange badge)

- Click "Mark as Done"
- **Expected**: Status changes to "DONE" (green badge)

#### Step 5.4: Demonstrate Status Management
Show all three status buttons for a ticket:
- "Mark as Open" (blue)
- "Mark as In Progress" (orange)
- "Mark as Done" (green)

**Demo Points**:
- ✨ Only user's own tickets visible
- ✨ Real-time status updates
- ✨ Clean, intuitive UI
- ✨ Sorted by creation date (newest first)

---

### Part 6: Architecture & Microservices (5 minutes)

#### Step 6.1: Show Running Services

**Docker Compose**:
```bash
docker-compose ps

# Expected output shows 5 services:
# - postgres
# - mailhog
# - api
# - mailer
# - frontend
```

**OpenShift**:
```bash
oc get pods -n helpdesk

# Expected: Multiple pods across 5 deployments
```

#### Step 6.2: Explain Architecture

Show diagram or explain:
```
Frontend (React/Vite) → API (NestJS) → PostgreSQL
                            ↓
                      Email Outbox Table
                            ↑
                    Mailer Worker ← MailHog (SMTP)
```

**Key Points**:
- ✨ Frontend is static SPA (nginx)
- ✨ API is stateless (can scale horizontally)
- ✨ Mailer polls database (decoupled from API)
- ✨ Database has persistent storage
- ✨ MailHog for testing (replace with real SMTP in production)

#### Step 6.3: Show Logs

**Mailer Service Logs**:
```bash
# Docker
docker-compose logs -f mailer

# OpenShift
oc logs -f dc/mailer -n helpdesk
```

**Expected**: See polling activity and email sending:
```
Mailer service started
Polling interval: 5000ms
SMTP: mailhog:1025
Found 1 emails to send
Sending email to demo@example.com: Welcome to Helpdesk
Email sent successfully to demo@example.com
```

**API Logs**:
```bash
# Docker
docker-compose logs -f api

# OpenShift
oc logs -f dc/api -n helpdesk
```

**Expected**: See API requests:
```
POST /auth/signup
POST /auth/login
POST /tickets
GET /tickets
```

---

### Part 7: Scalability Demo (5 minutes)

**Note**: This section is more relevant for OpenShift deployment.

#### Step 7.1: Check Current Replicas
```bash
oc get pods -l app=api -n helpdesk

# Expected: 2 API pods running
```

#### Step 7.2: Scale Up
```bash
oc scale dc/api --replicas=5 -n helpdesk

# Watch pods starting
oc get pods -l app=api -n helpdesk -w
```

**Expected**: 5 API pods running within 30-60 seconds

#### Step 7.3: Verify Application Still Works
- Create a new ticket in the UI
- Update ticket status
- **Expected**: Everything works normally

**Demo Points**:
- ✨ Stateless API design allows horizontal scaling
- ✨ Load balanced automatically by OpenShift Service
- ✨ No session state stored in API pods
- ✨ All state in database or JWT tokens

#### Step 7.4: Scale Down
```bash
oc scale dc/api --replicas=2 -n helpdesk
```

#### Step 7.5: Show Auto-Scaling (Optional)
```bash
# Create HPA (Horizontal Pod Autoscaler)
oc autoscale dc/api --min=2 --max=10 --cpu-percent=80 -n helpdesk

# Check HPA status
oc get hpa
```

---

### Part 8: Database Persistence Demo (3 minutes)

#### Step 8.1: Show Current Data
```bash
# Show users
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "SELECT email, first_name FROM users;"

# Show tickets
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "SELECT title, status FROM tickets;"
```

#### Step 8.2: Simulate Pod Restart
```bash
# Delete API pod (will be recreated automatically)
oc delete pod -l app=api -n helpdesk

# Wait for new pod
oc get pods -l app=api -w
```

#### Step 8.3: Verify Data Persists
- Refresh frontend
- Login with same credentials
- **Expected**: All tickets still visible

**Demo Points**:
- ✨ Data stored in PostgreSQL with PVC
- ✨ PVC ensures data survives pod restarts
- ✨ Database runs on persistent storage

---

### Part 9: Email System Deep Dive (5 minutes)

#### Step 9.1: Show Email Outbox Table
```bash
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "SELECT id, \"to\", subject, sent, attempts, created_at FROM email_outbox ORDER BY created_at DESC LIMIT 5;"
```

**Expected**: Show sent emails with metadata

#### Step 9.2: Create Email Manually (Testing)
```bash
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "
INSERT INTO email_outbox (id, \"to\", subject, body, sent)
VALUES (gen_random_uuid(), 'test@example.com', 'Manual Test', 'This is a manual test email', false);
"
```

#### Step 9.3: Watch Mailer Pick It Up
```bash
oc logs -f dc/mailer -n helpdesk
```

**Expected**: Within 5 seconds, see:
```
Found 1 emails to send
Sending email to test@example.com: Manual Test
Email sent successfully
```

#### Step 9.4: Check MailHog
- Refresh MailHog UI
- **Expected**: New test email appears

**Demo Points**:
- ✨ Queue-based email system
- ✨ Retry mechanism (up to 5 attempts)
- ✨ Error tracking in database
- ✨ Configurable polling interval

---

### Part 10: Security Features Demo (3 minutes)

#### Step 10.1: Password Hashing
```bash
oc exec deployment/postgres -n helpdesk -- psql -U helpdesk -d helpdesk -c "SELECT email, password FROM users LIMIT 1;"
```

**Show**:
- Password is hashed (Argon2)
- Cannot reverse-engineer password

#### Step 10.2: JWT Token
- Open browser DevTools → Application → Local Storage
- Show stored JWT token
- Copy token and decode at https://jwt.io
- **Show**: Token contains user ID and email, signed with secret

#### Step 10.3: Protected Routes
- Logout
- Try to access: `http://localhost:8080/tickets` directly
- **Expected**: Redirected to login page

**Demo Points**:
- ✨ Passwords hashed with Argon2 (industry standard)
- ✨ JWT tokens for stateless authentication
- ✨ Protected routes require valid token
- ✨ Input validation with class-validator
- ✨ Prisma ORM prevents SQL injection

---

## Demo Checklist

Before the demo:
- [ ] All services running
- [ ] MailHog UI accessible
- [ ] Frontend accessible
- [ ] Database has no test data
- [ ] Browser cache cleared
- [ ] URLs ready to share

During demo:
- [ ] User registration + welcome email
- [ ] Login/logout flow
- [ ] Password reset flow
- [ ] Change password
- [ ] Create 3+ tickets
- [ ] Update ticket statuses
- [ ] Show architecture
- [ ] Scale API pods
- [ ] Show email queue
- [ ] Demonstrate persistence

After demo:
- [ ] Answer questions
- [ ] Show code structure if requested
- [ ] Discuss production deployment
- [ ] Share repository

## Talking Points

### Why This Architecture?

1. **Microservices**: Each component has single responsibility
2. **Scalability**: Stateless API can scale horizontally
3. **Reliability**: Queue-based email ensures delivery
4. **Testability**: MailHog makes email testing easy
5. **Production-Ready**: OpenShift deployment with HA

### Technology Choices

1. **NestJS**: Enterprise-grade Node.js framework
2. **Prisma**: Type-safe ORM with migrations
3. **React**: Modern, widely-adopted frontend
4. **PostgreSQL**: Robust, reliable database
5. **Argon2**: Industry-standard password hashing
6. **JWT**: Stateless authentication

### Production Considerations

1. Replace MailHog with real SMTP (SendGrid, AWS SES)
2. Add monitoring (Prometheus, Grafana)
3. Implement rate limiting
4. Add caching (Redis)
5. Set up CI/CD pipeline
6. Configure backups
7. Add logging aggregation
8. Implement health checks

## Troubleshooting During Demo

### Email Not Appearing in MailHog
```bash
# Check mailer logs
docker-compose logs mailer
# or
oc logs dc/mailer -n helpdesk

# Check email queue
docker-compose exec postgres psql -U helpdesk -d helpdesk -c "SELECT * FROM email_outbox WHERE sent = false;"
```

### Frontend Can't Reach API
```bash
# Check CORS settings in API
docker-compose logs api | grep -i cors

# Verify API is accessible
curl http://localhost:3000
```

### Database Connection Issues
```bash
# Check database is running
docker-compose ps postgres
# or
oc get pods -l app=postgres

# Test connection
docker-compose exec api nc -zv postgres 5432
```

## Q&A Preparation

**Q: How does the email system prevent failures?**
A: Retry mechanism (5 attempts), error logging, and queue persistence.

**Q: What happens if the API crashes while processing a request?**
A: Since API is stateless, request fails but data in DB is consistent. User can retry.

**Q: How do you handle database migrations?**
A: Prisma Migrate handles versioned migrations, runs automatically on container start.

**Q: Can you show the test coverage?**
A: This is a demo project focused on architecture. In production, add unit/integration tests.

**Q: How do you handle file uploads?**
A: Not implemented here, but would use S3/Minio with presigned URLs.

**Q: What about real-time notifications?**
A: Could add WebSocket support or Server-Sent Events for live updates.

## Summary

This demo showcases:
- ✅ Full authentication workflows
- ✅ Microservices architecture
- ✅ Queue-based email system
- ✅ Horizontal scalability
- ✅ Data persistence
- ✅ Security best practices
- ✅ OpenShift deployment
- ✅ Production-ready patterns

**Total Demo Time**: ~30-40 minutes (adjust based on audience)
