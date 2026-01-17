# 🚀 Deployment Checklist - Helpdesk App Feature Upgrade

## Overview
This checklist guides you through deploying the 5 new standout features to your OpenShift environment.

---

## Part 1: Local Testing & Migration

### ☐ 1. Install Dependencies
```bash
cd backend
npm install prom-client uuid
npm install -D @types/uuid
```

**Verification:**
- Check `package.json` includes new dependencies
- Run `npm list prom-client uuid` to confirm installation

---

### ☐ 2. Run Database Migration
```bash
cd backend
npx prisma migrate dev --name add_rbac_comments_audit
```

**What this does:**
- Creates `UserRole` enum in database (USER, AGENT, ADMIN)
- Adds `role` column to `User` table (defaults to USER)
- Adds `assignedToUserId` column to `Ticket` table
- Creates `TicketComment` table
- Creates `AuditEvent` table

**Verification:**
- Migration completes without errors
- Check `backend/prisma/migrations/` for new migration folder
- Run `npx prisma studio` to verify new tables/columns exist

---

### ☐ 3. Generate Prisma Client
```bash
cd backend
npx prisma generate
```

**Verification:**
- No errors during generation
- `node_modules/@prisma/client` updated

---

### ☐ 4. Update Environment Variables
Add to `backend/.env`:
```env
STAFF_NOTIFY_EMAIL=admin@helpdesk.local
```

**Replace** `admin@helpdesk.local` with your actual admin email address.

---

### ☐ 5. Start Backend Locally
```bash
cd backend
npm run start:dev
```

**Verification:**
- Server starts on port 3000
- No compilation errors
- Visit http://localhost:3000/api/docs
- Verify new endpoints appear in Swagger:
  - `/admin/users/:id/role` (PATCH)
  - `/admin/agents` (GET)
  - `/tickets/inbox` (GET)
  - `/tickets/:id/assign` (PATCH)
  - `/tickets/:id/comments` (GET, POST)
  - `/tickets/:id/audit` (GET)
  - `/health` (GET)
  - `/ready` (GET)
  - `/metrics` (GET)

---

### ☐ 6. Test Health Endpoints
```bash
curl http://localhost:3000/health
curl http://localhost:3000/ready
curl http://localhost:3000/metrics
```

**Expected Results:**
- `/health` returns `{"status":"ok","timestamp":"...","uptime":...}`
- `/ready` returns `{"status":"ready","database":"connected",...}`
- `/metrics` returns Prometheus-formatted metrics

---

### ☐ 7. Create Test Data

#### Create Regular User
```bash
# Via Swagger UI at http://localhost:3000/api/docs
POST /auth/signup
{
  "email": "user@test.com",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "User"
}
```

#### Promote User to AGENT
**Option A: Prisma Studio**
```bash
cd backend
npx prisma studio
# Navigate to User table
# Find your test user
# Change role from 'USER' to 'AGENT'
# Save
```

**Option B: PostgreSQL Query**
```sql
UPDATE "User" SET role = 'AGENT' WHERE email = 'user@test.com';
```

---

### ☐ 8. Test RBAC Features

#### Test as Regular USER
1. Login with regular user credentials
2. Create a ticket
3. Verify you can only see your own tickets
4. Try to access `/admin/agents` - should get 403 Forbidden

#### Test as AGENT
1. Login with AGENT user credentials
2. Access `/tickets/inbox` - should work
3. Assign a ticket to yourself
4. Add an internal comment to a ticket
5. View audit trail
6. Access `/admin/agents` - should work

---

## Part 2: OpenShift Deployment

### ☐ 9. Update OpenShift ConfigMap
```bash
oc patch configmap api-config -n chrif0709-dev -p '{
  "data": {
    "STAFF_NOTIFY_EMAIL": "mohamed.cherif.khcherif@gmail.com"
  }
}'
```

**Verification:**
```bash
oc get configmap api-config -n chrif0709-dev -o yaml
```

---

### ☐ 10. Build New Backend Image
```bash
cd C:\Users\wwwkh\OneDrive\Desktop\cloudproject\helpdesk-ticketing-app

oc start-build api -n chrif0709-dev --from-dir=./backend --follow
```

**Expected Output:**
- Build starts and completes successfully
- New image tagged (e.g., `api:9`)
- No compilation errors

**Verification:**
```bash
oc get builds -n chrif0709-dev | Select-Object -First 5
```

---

### ☐ 11. Run Database Migration in OpenShift

**Option A: Port-forward to PostgreSQL and run locally**
```bash
# Terminal 1: Port forward
oc port-forward deployment/postgres 5433:5432 -n chrif0709-dev

# Terminal 2: Run migration
cd backend
$env:DATABASE_URL = "postgresql://helpdesk:helpdesk123@localhost:5433/helpdesk"
npx prisma migrate deploy
```

**Option B: Create Migration Job**
Create `openshift/20-migration-job.yaml`:
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: api-migration
  namespace: chrif0709-dev
spec:
  template:
    spec:
      containers:
      - name: migration
        image: image-registry.openshift-image-registry.svc:5000/chrif0709-dev/api:latest
        command: 
          - /bin/sh
          - -c
          - node ./node_modules/prisma/build/index.js migrate deploy
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: DATABASE_URL
      restartPolicy: Never
  backoffLimit: 3
```

Run:
```bash
oc apply -f openshift/20-migration-job.yaml -n chrif0709-dev
oc logs job/api-migration -n chrif0709-dev -f
```

**Verification:**
- Migration completes successfully
- Job shows "Completed" status
- Check logs for "Migration completed" message

---

### ☐ 12. Restart API Deployment
```bash
oc rollout latest dc/api -n chrif0709-dev
```

**Verification:**
```bash
# Wait for rollout to complete
oc rollout status dc/api -n chrif0709-dev

# Check pod logs
oc logs -f dc/api -n chrif0709-dev
```

Look for:
- "Nest application successfully started"
- No errors about missing tables/columns
- No TypeScript compilation errors

---

### ☐ 13. Update Health Check Probes (Optional)
Update API deployment to use new health endpoints:

```bash
oc set probe dc/api -n chrif0709-dev `
  --liveness --readiness `
  --get-url=http://:3000/health `
  --initial-delay-seconds=30 `
  --timeout-seconds=5
```

**Verification:**
```bash
oc describe dc/api -n chrif0709-dev | Select-String -Pattern "Liveness|Readiness"
```

---

### ☐ 14. Test Production Endpoints
```bash
$API_URL = "https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com"

# Test health
curl "$API_URL/health"

# Test metrics
curl "$API_URL/metrics"

# Test Swagger docs
curl "$API_URL/api/docs"
```

**Expected Results:**
- Health endpoint returns OK status
- Metrics endpoint returns Prometheus metrics
- Swagger UI loads with all new endpoints visible

---

### ☐ 15. Promote Production User to AGENT

Since we can't directly access the OpenShift PostgreSQL pod, use port-forwarding:

```bash
# Terminal 1: Port forward to PostgreSQL
oc port-forward deployment/postgres 5433:5432 -n chrif0709-dev

# Terminal 2: Connect with psql or pgAdmin
# Connection: postgresql://helpdesk:helpdesk123@localhost:5433/helpdesk

# Run SQL:
UPDATE "User" SET role = 'AGENT' WHERE email = 'your-test-user@example.com';
```

**Or use Prisma Studio:**
```bash
cd backend
$env:DATABASE_URL = "postgresql://helpdesk:helpdesk123@localhost:5433/helpdesk"
npx prisma studio
```

---

### ☐ 16. Test Production Features

#### Test Admin Endpoints
```bash
# Login to get JWT token
$TOKEN = "your-jwt-token-here"

# List agents
curl -H "Authorization: Bearer $TOKEN" "$API_URL/admin/agents"

# Update user role
curl -X PATCH -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"role":"AGENT"}' `
  "$API_URL/admin/users/{userId}/role"
```

#### Test Ticket Features
```bash
# Get assigned tickets inbox
curl -H "Authorization: Bearer $TOKEN" "$API_URL/tickets/inbox"

# Assign ticket
curl -X PATCH -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"assignedToUserId":"agent-user-id"}' `
  "$API_URL/tickets/{ticketId}/assign"

# Add comment
curl -X POST -H "Authorization: Bearer $TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"body":"Test comment","isInternal":false}' `
  "$API_URL/tickets/{ticketId}/comments"

# View audit trail
curl -H "Authorization: Bearer $TOKEN" "$API_URL/tickets/{ticketId}/audit"
```

---

## Part 3: Frontend Deployment (Optional)

### ☐ 17. Install Frontend Dependencies
```bash
cd frontend
npm install jwt-decode
```

### ☐ 18. Implement Frontend Pages
Refer to [FEATURE_IMPLEMENTATION_GUIDE.md](FEATURE_IMPLEMENTATION_GUIDE.md) Part 5 for complete frontend code.

Key files to create:
- `src/context/AuthContext.tsx`
- `src/pages/AdminUsers.tsx`
- `src/pages/AgentInbox.tsx`
- `src/pages/TicketDetails.tsx` (update existing)
- `src/services/api.ts` (update existing)

### ☐ 19. Build and Deploy Frontend
```bash
cd C:\Users\wwwkh\OneDrive\Desktop\cloudproject\helpdesk-ticketing-app

oc start-build frontend -n chrif0709-dev --from-dir=./frontend --follow
```

### ☐ 20. Restart Frontend Deployment
```bash
oc rollout latest dc/frontend -n chrif0709-dev
```

---

## Part 4: Final Verification

### ☐ 21. Complete Feature Test

Visit: `https://frontend-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com`

**As Regular USER:**
- ✅ Signup/login works
- ✅ Can create tickets
- ✅ Can see only own tickets
- ✅ Can add comments to own tickets
- ✅ Cannot see internal notes
- ✅ Cannot access admin pages

**As AGENT:**
- ✅ Can access "My Inbox" page
- ✅ Can see assigned tickets
- ✅ Can assign tickets to self or other agents
- ✅ Can add public and internal comments
- ✅ Can change ticket status
- ✅ Can view audit timeline
- ✅ Receives email notifications

**As ADMIN:**
- ✅ Can access "Manage Users" page
- ✅ Can promote users to AGENT role
- ✅ Can see all tickets (unrestricted)
- ✅ All AGENT permissions

---

### ☐ 22. Email Notifications Test
1. Create a new ticket as USER
2. Check STAFF_NOTIFY_EMAIL inbox for notification
3. Have AGENT change ticket status
4. Check ticket owner's email for status update notification
5. Have AGENT assign ticket
6. Check ticket owner's email for assignment notification

---

### ☐ 23. Monitoring & Metrics
Configure Prometheus to scrape metrics endpoint (optional):

```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-metrics
  namespace: chrif0709-dev
  labels:
    app: api
spec:
  selector:
    app: api
  ports:
  - name: metrics
    port: 3000
    targetPort: 3000
```

Add Prometheus scrape annotation to API deployment:
```yaml
metadata:
  annotations:
    prometheus.io/scrape: "true"
    prometheus.io/port: "3000"
    prometheus.io/path: "/metrics"
```

---

## Troubleshooting

### Migration Fails
**Problem:** `relation "..." does not exist`
**Solution:** Ensure migration ran successfully. Check `_prisma_migrations` table.

### 403 Forbidden on Admin Endpoints
**Problem:** User doesn't have AGENT/ADMIN role
**Solution:** Update user role in database:
```sql
UPDATE "User" SET role = 'AGENT' WHERE email = 'your-email@example.com';
```

### Build Fails in OpenShift
**Problem:** Missing dependencies or compilation errors
**Solution:**
1. Check build logs: `oc logs -f bc/api -n chrif0709-dev`
2. Verify `package.json` includes all dependencies
3. Test build locally: `cd backend && npm run build`

### Email Notifications Not Sent
**Problem:** STAFF_NOTIFY_EMAIL not configured or Gmail credentials invalid
**Solution:**
1. Verify ConfigMap: `oc get configmap api-config -n chrif0709-dev -o yaml`
2. Check Gmail App Password in Secrets
3. View mailer logs: `oc logs -f dc/mailer -n chrif0709-dev`

---

## Rollback Plan

If you need to rollback:

### 1. Rollback API Deployment
```bash
oc rollout undo dc/api -n chrif0709-dev
```

### 2. Rollback Database Migration
```bash
# Port forward to PostgreSQL
oc port-forward deployment/postgres 5433:5432 -n chrif0709-dev

# In another terminal
cd backend
$env:DATABASE_URL = "postgresql://helpdesk:helpdesk123@localhost:5433/helpdesk"
npx prisma migrate resolve --rolled-back add_rbac_comments_audit
```

---

## Success Criteria

✅ All tests pass
✅ No errors in pod logs
✅ Health endpoints return 200 OK
✅ RBAC works correctly (users see appropriate tickets)
✅ Comments can be added (public and internal)
✅ Audit trail visible for agents
✅ Email notifications sent successfully
✅ Metrics endpoint accessible

---

## Post-Deployment Tasks

1. Document AGENT user credentials securely
2. Configure monitoring/alerts for `/ready` endpoint
3. Set up log aggregation for audit events
4. Create user documentation for new features
5. Train staff on internal notes feature
6. Review and adjust STAFF_NOTIFY_EMAIL if needed

---

## Support

For issues:
1. Check pod logs: `oc logs -f dc/api -n chrif0709-dev`
2. Review migration status: `npx prisma migrate status`
3. Test endpoints via Swagger UI
4. Check database schema: `npx prisma studio`

Refer to:
- [FEATURE_IMPLEMENTATION_GUIDE.md](FEATURE_IMPLEMENTATION_GUIDE.md) - Complete implementation details
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Current status and testing guide
- [OPENSHIFT_DEPLOYMENT_SUMMARY.md](OPENSHIFT_DEPLOYMENT_SUMMARY.md) - OpenShift infrastructure details
