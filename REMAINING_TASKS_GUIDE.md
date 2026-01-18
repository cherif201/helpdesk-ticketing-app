# Remaining Tasks Guide

## Completed ✅

1. **Backend Dashboard Statistics Endpoint** - `GET /admin/dashboard/statistics`
   - Returns: totalTickets, openTickets, inProgressTickets, doneTickets
   - File: `backend/src/admin/admin.controller.ts` & `admin.service.ts`

2. **Fixed My Inbox Route Order** - `/tickets/inbox` now works correctly
   - Moved `@Get('inbox')` before `@Get(':id')` in controller
   - File: `backend/src/tickets/tickets.controller.ts`

## Remaining Tasks

### 1. Modernize TicketDetail Page

**File:** `frontend/src/pages/TicketDetail.tsx`

**Changes Needed:**
- Replace all inline styles with shadcn/ui components
- Use Card for main ticket info
- Badge for status (top right)
- Buttons for status updates
- Select dropdown for assignment (shows names only like My Tickets)
- Add audit trail section with collapsible Table
- Modernize comments section

**Key Features:**
- Assignment dropdown shows: `{user.firstName} {user.lastName}` (no email/role)
- Audit trail behind "View History" button with Table component
- All status buttons visible, current one disabled
- Card-based layout throughout

**New Imports Needed:**
```typescript
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Trash2, History, ChevronDown, ChevronUp } from 'lucide-react';
```

### 2. Create Admin Dashboard Page

**File:** `frontend/src/pages/Dashboard.tsx` (NEW FILE)

**Purpose:** Show statistics cards on admin login

**Content:**
```typescript
import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  doneTickets: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const data = await api.getDashboardStatistics();
      setStats(data);
    } catch (err: any) {
      console.error('Failed to load dashboard statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground mt-2">System overview and statistics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
              <p className="text-xs text-muted-foreground">All tickets in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting assignment or action</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.inProgressTickets || 0}</div>
              <p className="text-xs text-muted-foreground">Currently being worked on</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.doneTickets || 0}</div>
              <p className="text-xs text-muted-foreground">Successfully resolved</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
```

### 3. Add API Method for Dashboard Stats

**File:** `frontend/src/services/api.ts`

**Add after `deleteUser` method:**
```typescript
async getDashboardStatistics(): Promise<{
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  doneTickets: number;
}> {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard/statistics`, {
    headers: this.getHeaders(true),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch dashboard statistics');
  }

  return response.json();
}
```

### 4. Update App Routing

**File:** `frontend/src/App.tsx`

**Changes:**
1. Import Dashboard component
2. Add Dashboard route
3. Update redirect logic for admin login

**Add import:**
```typescript
import { Dashboard } from './pages/Dashboard';
```

**Add route (before other routes):**
```typescript
<Route path="/dashboard" element={
  <RequireAuth>
    <Dashboard />
  </RequireAuth>
} />
```

### 5. Update Navigation

**File:** `frontend/src/components/Layout.tsx`

**Add Dashboard link for admins:**
```typescript
{isAdmin && (
  <Link to="/dashboard">
    <Button variant="ghost">
      <BarChart3 className="mr-2 h-4 w-4" />
      Dashboard
    </Button>
  </Link>
)}
```

**Import icon:**
```typescript
import { BarChart3 } from 'lucide-react';
```

### 6. Update Login Redirect

**File:** `frontend/src/pages/Login.tsx`

**Change redirect logic** after successful login:
```typescript
// After successful login:
const userData = await api.login(email, password);
localStorage.setItem('token', userData.token);

// Redirect admin to dashboard, others to tickets
if (userData.user.role === 'ADMIN') {
  window.location.href = '/dashboard';
} else {
  window.location.href = '/tickets';
}
```

## Testing Checklist

After implementing all changes:

### As Admin:
- [ ] Login redirects to Dashboard
- [ ] Dashboard shows 4 stat cards with correct numbers
- [ ] Navigate to My Tickets - dropdown shows names only
- [ ] View ticket detail - modern card layout
- [ ] Assignment dropdown shows names only
- [ ] Click "View History" - table with audit events appears
- [ ] All status buttons visible, current one disabled

### As Agent:
- [ ] Login redirects to My Tickets (not dashboard)
- [ ] View ticket detail page
- [ ] Can see audit trail
- [ ] Cannot see Dashboard link in navbar

### Backend:
- [ ] `GET /admin/dashboard/statistics` returns correct counts
- [ ] `GET /tickets/inbox` works (no 404)
- [ ] All endpoints properly secured with roles

## Quick Implementation Steps

1. Add `getDashboardStatistics()` to `api.ts`
2. Create `Dashboard.tsx` (copy code from this guide)
3. Update `App.tsx` routing
4. Update `Layout.tsx` navigation
5. Update `Login.tsx` redirect logic
6. Manually update `TicketDetail.tsx` (too large for automated tools):
   - Replace inline styles with shadcn components
   - Add audit trail section
   - Fix dropdown to show names only

## File Locations Summary

```
backend/
  src/admin/
    admin.controller.ts ✅ (dashboard endpoint added)
    admin.service.ts ✅ (getDashboardStatistics added)
  src/tickets/
    tickets.controller.ts ✅ (inbox route fixed)

frontend/
  src/pages/
    Dashboard.tsx ❌ (needs creation)
    TicketDetail.tsx ❌ (needs modernization)
    Login.tsx ❌ (needs redirect update)
  src/components/
    Layout.tsx ❌ (needs dashboard link)
  src/services/
    api.ts ❌ (needs getDashboardStatistics)
  src/
    App.tsx ❌ (needs dashboard route)
```

## Priority Order

1. **High Priority:**
   - Create Dashboard page
   - Add dashboard API method
   - Update routing
   - Fix login redirect

2. **Medium Priority:**
   - Modernize TicketDetail page
   - Add audit trail section

3. **Low Priority:**
   - Polish UI details
   - Test all scenarios

All backend changes are complete! The frontend just needs the new Dashboard page and TicketDetail modernization.
