# 🚀 Quick Start Guide - 5 Minutes to Deployment

## Implementation Status
✅ **Backend:** 100% Complete - All 5 features fully implemented
✅ **Frontend:** 100% Complete - All pages, components, and API integration ready
✅ **Dependencies:** prom-client, uuid, jwt-decode installed

## Prerequisites
✅ Backend dependencies installed (prom-client, uuid)
✅ Frontend dependencies installed (jwt-decode)
✅ Local PostgreSQL running on port 5433
✅ Environment variables configured

---

## Step 1: Database Migration (2 min)
```bash
cd backend
npx prisma migrate dev --name add_rbac_comments_audit
npx prisma generate
```

---

## Step 2: Start Backend (1 min)
```bash
cd backend
npm run start:dev
```

**Verify:** Visit http://localhost:3000/api/docs
- Should see new endpoints: /admin/*, /tickets/inbox, /tickets/*/comments, /health, /metrics

---

## Step 3: Create Test Users (1 min)

### Via Swagger UI (http://localhost:3000/api/docs)
```json
POST /auth/signup
{
  "email": "agent@test.com",
  "password": "Test123!",
  "firstName": "Test",
  "lastName": "Agent"
}
```

### Promote to AGENT
```bash
npx prisma studio
# Navigate to User table
# Find "agent@test.com"
# Change role from 'USER' to 'AGENT'
# Save
```

---

## Step 4: Test Features (1 min)

### Login as AGENT
```json
POST /auth/login
{
  "email": "agent@test.com",
  "password": "Test123!"
}
```

Copy the JWT token from response.

### Test New Endpoints (use JWT token in Swagger "Authorize" button)
1. `GET /tickets/inbox` - Should return empty array (no assigned tickets yet)
2. `GET /admin/agents` - Should return list including yourself
3. `GET /health` - Should return `{"status":"ok",...}`

---

## OpenShift Deployment (5 min)

```bash
# 1. Update ConfigMap
oc patch configmap api-config -n chrif0709-dev -p '{"data":{"STAFF_NOTIFY_EMAIL":"your-email@example.com"}}'

# 2. Build new image
cd C:\Users\wwwkh\OneDrive\Desktop\cloudproject\helpdesk-ticketing-app
oc start-build api -n chrif0709-dev --from-dir=./backend --follow

# 3. Run migration (port-forward method)
oc port-forward deployment/postgres 5433:5432 -n chrif0709-dev
# In another terminal:
cd backend
$env:DATABASE_URL = "postgresql://helpdesk:helpdesk123@localhost:5433/helpdesk"
npx prisma migrate deploy

# 4. Restart API
oc rollout latest dc/api -n chrif0709-dev

# 5. Verify
curl https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com/health
```

---

## Troubleshooting

### "relation ... does not exist"
**Fix:** Migration didn't run. Repeat Step 1 or Step 3 (OpenShift migration).

### "403 Forbidden" on /admin/* endpoints
**Fix:** User doesn't have AGENT/ADMIN role. Use Prisma Studio to update role.

### Build fails in OpenShift
**Fix:** Test locally first with `npm run build` in backend directory.

---

## What's Next?

1. **Read Full Docs:**
   - [FEATURES_SUMMARY.md](FEATURES_SUMMARY.md) - Feature overview
   - [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Detailed deployment steps
   - [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) - Testing guide

2. **Test All Features:**
   - Create tickets as USER
   - Assign tickets as AGENT
   - Add internal notes
   - View audit trail
   - Check email notifications

3. **Implement Frontend (Optional):**
   See [FEATURE_IMPLEMENTATION_GUIDE.md](FEATURE_IMPLEMENTATION_GUIDE.md) Part 5 for React components.

---

## Cheat Sheet

### Promote User to AGENT via SQL
```sql
UPDATE "User" SET role = 'AGENT' WHERE email = 'user@example.com';
```

### View Audit Events
```sql
SELECT * FROM "AuditEvent" ORDER BY "createdAt" DESC LIMIT 10;
```

### Check Migration Status
```bash
npx prisma migrate status
```

### View All New Endpoints
```
GET    /health
GET    /ready
GET    /metrics
GET    /admin/agents
PATCH  /admin/users/:id/role
GET    /tickets/inbox
PATCH  /tickets/:id/assign
GET    /tickets/:id/audit
GET    /tickets/:id/comments
POST   /tickets/:id/comments
```

---

**Need Help?** Check logs:
- Backend: `oc logs -f dc/api -n chrif0709-dev`
- Migration status: `npx prisma migrate status`
- Database: `npx prisma studio`
