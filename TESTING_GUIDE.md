# Testing New Features - Step-by-Step Guide

## Part 1: Connect to Database with pgAdmin

### 1. Make sure port-forward is running
A new PowerShell window should have opened with port-forwarding active.
**KEEP THAT WINDOW OPEN** while using pgAdmin!

If it didn't open, run this command manually in a terminal:
```powershell
oc port-forward pod/postgres-1-w2jc6 5433:5432 -n chrif0709-dev
```

### 2. Connect pgAdmin
In pgAdmin, use these **exact** settings:

| Setting  | Value         |
|----------|---------------|
| Host     | `localhost`   |
| Port     | `5433`        |
| Database | `helpdesk`    |
| Username | `helpdesk`    |
| Password | `helpdesk123` |

### 3. Common Connection Issues

**"Connection refused"** - Port-forward is not running
- Solution: Make sure the port-forward window is open and shows "Forwarding from 127.0.0.1:5433"

**"Port already in use"** - Another process is using port 5433
- Solution: Close other applications using that port, or change the port number

---

## Part 2: Setup Test Users

### Option A: Using pgAdmin Query Tool

1. In pgAdmin, right-click on your database → **Query Tool**
2. Open the file: `setup-test-users.sql`
3. Run each query step by step (select text, then click Execute F5)

### Option B: Quick Commands

**View all users:**
```sql
SELECT id, email, "firstName", "lastName", role 
FROM "User" 
ORDER BY "createdAt" DESC;
```

**Promote a user to AGENT:**
```sql
-- Replace the email with your actual user email
UPDATE "User" 
SET role = 'AGENT' 
WHERE email = 'youruser@example.com';
```

**Verify the change:**
```sql
SELECT email, role FROM "User" WHERE role != 'USER';
```

---

## Part 3: Why Features Don't Appear Yet

### The new features are **role-based**:

1. **Regular USER** sees:
   - ✅ Their own tickets
   - ✅ Create ticket form
   - ✅ Add public comments
   - ❌ NO access to admin features
   - ❌ NO access to agent inbox
   - ❌ NO access to internal notes
   - ❌ NO "Manage Users" menu

2. **AGENT** sees:
   - ✅ All of USER features
   - ✅ **"My Inbox"** menu item (assigned tickets)
   - ✅ All unassigned tickets
   - ✅ Assign button on tickets
   - ✅ Add internal notes
   - ✅ View audit trail
   - ❌ NO "Manage Users" menu

3. **ADMIN** sees:
   - ✅ All of AGENT features
   - ✅ **"Manage Users"** menu item
   - ✅ Change user roles
   - ✅ Access to everything

---

## Part 4: Testing Workflow

### Step 1: Create Regular Users
1. Go to: https://frontend-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com
2. Sign up with at least 2 different email addresses
3. Login with the first user

### Step 2: Verify Regular USER View
As a regular USER, you should see:
- "My Tickets" page
- No special menu items
- Can create tickets
- Can add comments

### Step 3: Promote User to AGENT
1. In pgAdmin, run:
```sql
UPDATE "User" 
SET role = 'AGENT' 
WHERE email = 'your-first-user@example.com';
```

2. **Logout and login again** with that user

### Step 4: Verify AGENT Features
Now you should see:
- ✅ **"My Inbox"** in the navigation menu
- ✅ Click "My Inbox" to see assigned tickets
- ✅ On the tickets page, you can assign tickets to yourself
- ✅ When viewing a ticket, you can add internal notes

### Step 5: Test Ticket Assignment
1. As AGENT, go to "My Tickets"
2. Create a new ticket
3. Click on the ticket
4. You should see an "Assign" button
5. Assign it to yourself
6. Go to "My Inbox" - the ticket should appear there

### Step 6: Promote User to ADMIN
```sql
UPDATE "User" 
SET role = 'ADMIN' 
WHERE email = 'your-first-user@example.com';
```

**Logout and login again**

### Step 7: Verify ADMIN Features
Now you should see:
- ✅ **"Manage Users"** in the navigation menu
- ✅ Click "Manage Users" to see all users
- ✅ Can change any user's role from dropdown
- ✅ All AGENT features also available

---

## Part 5: API Testing via Swagger

Visit: https://api-chrif0709-dev.apps.rm3.7wse.p1.openshiftapps.com/api/docs

### Get JWT Token
1. Click **POST /auth/login**
2. Enter your credentials
3. Copy the `access_token` from response

### Authorize in Swagger
1. Click **🔒 Authorize** button (top right)
2. Enter: `Bearer YOUR_TOKEN_HERE`
3. Click Authorize

### Test New Endpoints

**Admin endpoints (requires ADMIN role):**
- `GET /admin/agents` - List all agents
- `PATCH /admin/users/{id}/role` - Change user role

**Ticket endpoints (requires AGENT role):**
- `GET /tickets/inbox` - Your assigned tickets
- `PATCH /tickets/{id}/assign` - Assign ticket to agent
- `POST /tickets/{id}/comments` - Add comment (set `isInternal: true` for staff-only)
- `GET /tickets/{id}/comments` - View all comments
- `GET /tickets/{id}/audit` - View audit trail

**Health endpoints (public):**
- `GET /health` - Service health
- `GET /ready` - Readiness check
- `GET /metrics` - Prometheus metrics

---

## Part 6: Email Notifications

When testing, you should receive emails for:

1. **Ticket Created** - Sent to STAFF_NOTIFY_EMAIL (admin)
2. **Status Changed** - Sent to ticket owner
3. **Ticket Assigned** - Sent to ticket owner and assigned agent

**Note:** Emails are sent to your Gmail configured in OpenShift secrets.

---

## Troubleshooting

### "Cannot see new features after promoting to AGENT"
**Solution:** You must logout and login again for the JWT token to refresh with new role.

### "Manage Users menu not showing"
**Solution:** Only ADMIN users see this menu. Make sure:
1. User role is 'ADMIN' in database
2. You logged out and logged back in
3. Check browser console for JWT token (should contain `role: 'ADMIN'`)

### "My Inbox is empty"
**Solution:** 
1. You need to assign tickets to yourself first
2. As AGENT, go to tickets list and assign tickets
3. Only tickets assigned to YOU appear in your inbox

### "Cannot add internal notes"
**Solution:** 
1. Only AGENT and ADMIN can add internal notes
2. Regular USER cannot see or add internal notes
3. Check that `isInternal` is set to `true` when adding comment

### "403 Forbidden on admin endpoints"
**Solution:** 
1. Your user doesn't have required role
2. Check your role in database
3. Logout and login again
4. Verify JWT token contains correct role

---

## Database Schema Verification

Run these queries in pgAdmin to verify everything is set up:

### Check all new tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('User', 'Ticket', 'TicketComment', 'AuditEvent', '_prisma_migrations');
```

### Check User table has role column:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name = 'role';
```

### Check UserRole enum values:
```sql
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole');
```

### Check migrations applied:
```sql
SELECT migration_name, finished_at 
FROM "_prisma_migrations" 
ORDER BY finished_at DESC;
```

---

## Quick Reference: What's Working

✅ **Backend:** All endpoints live and working
✅ **Frontend:** All pages created and connected
✅ **Database:** Migration applied, all tables created
✅ **OpenShift:** All services running

🎯 **You just need to:**
1. Connect pgAdmin (with port-forward running)
2. Promote users to AGENT/ADMIN roles
3. Logout and login again
4. Test the features!

---

## Next Steps After Testing

Once you've verified everything works:

1. **Document admin credentials** - Keep ADMIN user credentials secure
2. **Train staff** - Show agents how to use internal notes
3. **Monitor metrics** - Set up Prometheus scraping for /metrics endpoint
4. **Review audit trail** - Check audit events are being logged
5. **Test email notifications** - Verify emails are being sent correctly
