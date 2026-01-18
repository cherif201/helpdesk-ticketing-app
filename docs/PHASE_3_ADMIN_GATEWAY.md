# Phase 3: Admin & Gateway (Week 5-6)

## 📋 Phase Overview

**Goal**: Complete service extraction and add API Gateway  
**Duration**: Week 5-6  
**Dependencies**: Phase 1 & 2 completed (All core services running)  
**Database Strategy**: Option A - Shared Database

---

## 📊 Progress Summary

| Category | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| Tasks | 3 | 0 | 0 | 3 |
| Subtasks | 72 | 0 | 0 | 72 |

**Overall Phase Progress**: 0%

---

## 👑 Task 1: Extract Admin Service

**Status**: ⬜ Not Started  
**Priority**: High  
**Estimated Duration**: 4-5 days

### 1.1 Create Admin Service Project Structure

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.1.1 | Create `services/admin-service/` directory | ⬜ Not Started | |
| 1.1.2 | Initialize `package.json` for admin-service | ⬜ Not Started | |
| 1.1.3 | Copy and configure `tsconfig.json` | ⬜ Not Started | |
| 1.1.4 | Copy and configure `nest-cli.json` | ⬜ Not Started | |
| 1.1.5 | Create `src/` directory structure | ⬜ Not Started | |
| 1.1.6 | Install NestJS dependencies | ⬜ Not Started | |
| 1.1.7 | Install HTTP client dependencies (axios) | ⬜ Not Started | |
| 1.1.8 | Install caching dependencies (@nestjs/cache-manager) | ⬜ Not Started | |
| 1.1.9 | Link shared library to admin-service | ⬜ Not Started | |

### 1.2 Create Service Clients

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.2.1 | Create `src/clients/` directory | ⬜ Not Started | |
| 1.2.2 | Create `user-service.client.ts` | ⬜ Not Started | |
| 1.2.3 | Implement `getUsers()` method | ⬜ Not Started | |
| 1.2.4 | Implement `getAgents()` method | ⬜ Not Started | |
| 1.2.5 | Implement `updateUserRole()` method | ⬜ Not Started | |
| 1.2.6 | Implement `deleteUser()` method | ⬜ Not Started | |
| 1.2.7 | Create `ticket-service.client.ts` | ⬜ Not Started | |
| 1.2.8 | Implement `getTicketStatistics()` method | ⬜ Not Started | |
| 1.2.9 | Implement error handling for service calls | ⬜ Not Started | |
| 1.2.10 | Implement retry logic with exponential backoff | ⬜ Not Started | |
| 1.2.11 | Configure service URLs via environment variables | ⬜ Not Started | |

### 1.3 Create Dashboard Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.3.1 | Create `src/dashboard/` directory | ⬜ Not Started | |
| 1.3.2 | Create `dashboard.module.ts` | ⬜ Not Started | |
| 1.3.3 | Create `dashboard.controller.ts` | ⬜ Not Started | |
| 1.3.4 | Create `dashboard.service.ts` | ⬜ Not Started | |
| 1.3.5 | Implement `GET /admin/dashboard/statistics` endpoint | ⬜ Not Started | |
| 1.3.6 | Aggregate ticket statistics from ticket-service | ⬜ Not Started | |
| 1.3.7 | Aggregate user statistics from user-service | ⬜ Not Started | |
| 1.3.8 | Implement caching for dashboard statistics | ⬜ Not Started | |
| 1.3.9 | Configure cache TTL (e.g., 60 seconds) | ⬜ Not Started | |
| 1.3.10 | Add cache invalidation mechanism | ⬜ Not Started | |

### 1.4 Create User Management Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.4.1 | Create `src/user-management/` directory | ⬜ Not Started | |
| 1.4.2 | Create `user-management.module.ts` | ⬜ Not Started | |
| 1.4.3 | Create `user-management.controller.ts` | ⬜ Not Started | |
| 1.4.4 | Create `user-management.service.ts` | ⬜ Not Started | |
| 1.4.5 | Implement `GET /admin/users` endpoint | ⬜ Not Started | |
| 1.4.6 | Implement `GET /admin/agents` endpoint | ⬜ Not Started | |
| 1.4.7 | Implement `PATCH /admin/users/:id/role` endpoint | ⬜ Not Started | |
| 1.4.8 | Implement `DELETE /admin/users/:id` endpoint | ⬜ Not Started | |
| 1.4.9 | Add ADMIN role authorization guard | ⬜ Not Started | |

### 1.5 Implement JWT Validation

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.5.1 | Create `src/auth/` directory | ⬜ Not Started | |
| 1.5.2 | Create `jwt-auth.guard.ts` | ⬜ Not Started | |
| 1.5.3 | Create `roles.guard.ts` | ⬜ Not Started | |
| 1.5.4 | Create `roles.decorator.ts` | ⬜ Not Started | |
| 1.5.5 | Implement token validation via user-service | ⬜ Not Started | |
| 1.5.6 | Enforce ADMIN role for all endpoints | ⬜ Not Started | |

### 1.6 Implement Event Publishing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.6.1 | Create `src/events/` directory | ⬜ Not Started | |
| 1.6.2 | Create `admin-events.publisher.ts` | ⬜ Not Started | |
| 1.6.3 | Implement `publishUserRoleChanged()` method | ⬜ Not Started | |
| 1.6.4 | Integrate event publishing into user management | ⬜ Not Started | |

### 1.7 Create Admin Service Entry Point

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.7.1 | Create `src/main.ts` with HTTP server | ⬜ Not Started | |
| 1.7.2 | Create `src/app.module.ts` with all module imports | ⬜ Not Started | |
| 1.7.3 | Configure CORS settings | ⬜ Not Started | |
| 1.7.4 | Configure Swagger documentation | ⬜ Not Started | |
| 1.7.5 | Configure global validation pipe | ⬜ Not Started | |

### 1.8 Create Health Check Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.8.1 | Create `src/health/` directory | ⬜ Not Started | |
| 1.8.2 | Create `health.module.ts` and `health.controller.ts` | ⬜ Not Started | |
| 1.8.3 | Implement user-service health check | ⬜ Not Started | |
| 1.8.4 | Implement ticket-service health check | ⬜ Not Started | |
| 1.8.5 | Implement RabbitMQ health check | ⬜ Not Started | |

### 1.9 Create Dockerfile and Update Docker Compose

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.9.1 | Create `Dockerfile` in admin-service directory | ⬜ Not Started | |
| 1.9.2 | Configure multi-stage build | ⬜ Not Started | |
| 1.9.3 | Add admin-service to `docker-compose.yml` | ⬜ Not Started | |
| 1.9.4 | Configure admin-service environment variables | ⬜ Not Started | |
| 1.9.5 | Set admin-service port (e.g., 3005) | ⬜ Not Started | |
| 1.9.6 | Add dependencies on user-service and ticket-service | ⬜ Not Started | |
| 1.9.7 | Test admin-service starts in Docker Compose | ⬜ Not Started | |

---

## 🚪 Task 2: Implement API Gateway

**Status**: ⬜ Not Started  
**Priority**: Medium  
**Estimated Duration**: 3-4 days

### 2.1 Choose and Set Up Gateway Technology

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.1.1 | Evaluate gateway options (Kong, NGINX, Custom NestJS) | ⬜ Not Started | |
| 2.1.2 | Create `api-gateway/` directory | ⬜ Not Started | |
| 2.1.3 | Set up chosen gateway (NGINX recommended for simplicity) | ⬜ Not Started | |
| 2.1.4 | Create gateway configuration file | ⬜ Not Started | |

### 2.2 Configure Routing Rules

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.2.1 | Configure route for `/auth/*` → user-service | ⬜ Not Started | |
| 2.2.2 | Configure route for `/users/*` → user-service | ⬜ Not Started | |
| 2.2.3 | Configure route for `/tickets/*` → ticket-service | ⬜ Not Started | |
| 2.2.4 | Configure route for `/admin/*` → admin-service | ⬜ Not Started | |
| 2.2.5 | Configure route for `/audit/*` → audit-service | ⬜ Not Started | |
| 2.2.6 | Configure route for `/health` → aggregated health check | ⬜ Not Started | |
| 2.2.7 | Set up path rewriting if needed | ⬜ Not Started | |

### 2.3 Implement Security Features

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.3.1 | Configure rate limiting per endpoint | ⬜ Not Started | |
| 2.3.2 | Configure rate limiting per IP | ⬜ Not Started | |
| 2.3.3 | Set up request size limits | ⬜ Not Started | |
| 2.3.4 | Configure CORS at gateway level | ⬜ Not Started | |
| 2.3.5 | Add security headers (HSTS, X-Frame-Options, etc.) | ⬜ Not Started | |
| 2.3.6 | Configure SSL/TLS termination (production) | ⬜ Not Started | |

### 2.4 Implement Observability

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.4.1 | Configure request logging | ⬜ Not Started | |
| 2.4.2 | Add request ID propagation | ⬜ Not Started | |
| 2.4.3 | Configure access logs format | ⬜ Not Started | |
| 2.4.4 | Set up metrics endpoint for Prometheus | ⬜ Not Started | |

### 2.5 Create Dockerfile and Update Docker Compose

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.5.1 | Create `Dockerfile` for api-gateway | ⬜ Not Started | |
| 2.5.2 | Add api-gateway to `docker-compose.yml` | ⬜ Not Started | |
| 2.5.3 | Configure gateway port (80/443 or 8080) | ⬜ Not Started | |
| 2.5.4 | Add dependencies on all backend services | ⬜ Not Started | |
| 2.5.5 | Test gateway routing for all services | ⬜ Not Started | |

---

## 🖥️ Task 3: Update Frontend

**Status**: ⬜ Not Started  
**Priority**: High  
**Estimated Duration**: 2-3 days

### 3.1 Update API Configuration

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.1.1 | Update `VITE_API_URL` to point to API gateway | ⬜ Not Started | |
| 3.1.2 | Remove individual service URL environment variables | ⬜ Not Started | |
| 3.1.3 | Update `api.ts` to use single gateway URL | ⬜ Not Started | |

### 3.2 Update API Service Methods

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.2.1 | Verify auth endpoints still work via gateway | ⬜ Not Started | |
| 3.2.2 | Verify ticket endpoints still work via gateway | ⬜ Not Started | |
| 3.2.3 | Verify admin endpoints still work via gateway | ⬜ Not Started | |
| 3.2.4 | Verify audit endpoints still work via gateway | ⬜ Not Started | |

### 3.3 Implement Retry Logic

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.3.1 | Create retry utility function | ⬜ Not Started | |
| 3.3.2 | Implement exponential backoff | ⬜ Not Started | |
| 3.3.3 | Add retry logic to critical API calls | ⬜ Not Started | |
| 3.3.4 | Handle network errors gracefully | ⬜ Not Started | |

### 3.4 Implement Error Handling

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.4.1 | Create global error handler for API calls | ⬜ Not Started | |
| 3.4.2 | Handle service unavailable errors (503) | ⬜ Not Started | |
| 3.4.3 | Handle gateway timeout errors (504) | ⬜ Not Started | |
| 3.4.4 | Display user-friendly error messages | ⬜ Not Started | |
| 3.4.5 | Implement offline detection | ⬜ Not Started | |

### 3.5 End-to-End Testing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.5.1 | Test complete signup → login flow | ⬜ Not Started | |
| 3.5.2 | Test complete ticket creation flow | ⬜ Not Started | |
| 3.5.3 | Test ticket assignment and updates | ⬜ Not Started | |
| 3.5.4 | Test admin dashboard functionality | ⬜ Not Started | |
| 3.5.5 | Test user management functionality | ⬜ Not Started | |
| 3.5.6 | Test comments functionality | ⬜ Not Started | |
| 3.5.7 | Test password reset flow | ⬜ Not Started | |
| 3.5.8 | Verify all error scenarios handled | ⬜ Not Started | |

---

## 📋 Phase 3 Deliverables Checklist

| # | Deliverable | Status | Verification |
|---|-------------|--------|--------------|
| 1 | `admin-service` running independently | ⬜ Not Started | Health check returns OK |
| 2 | Dashboard statistics endpoint working | ⬜ Not Started | Returns aggregated data |
| 3 | User management endpoints working | ⬜ Not Started | CRUD operations work |
| 4 | Caching implemented for dashboard | ⬜ Not Started | Response times improved |
| 5 | API Gateway routing all traffic | ⬜ Not Started | All routes work |
| 6 | Rate limiting configured | ⬜ Not Started | Limits enforced |
| 7 | Request logging enabled | ⬜ Not Started | Logs visible |
| 8 | Frontend fully integrated via gateway | ⬜ Not Started | All flows work |
| 9 | Retry logic implemented in frontend | ⬜ Not Started | Handles failures |
| 10 | All services communicating via gateway | ⬜ Not Started | E2E tests pass |

---

## 📝 Notes & Decisions

### Configuration Decisions
- Admin Service Port: `3005`
- API Gateway Port: `8080` (development) / `80`/`443` (production)
- Gateway Technology: NGINX (recommended) or Kong

### Service Architecture After Phase 3
```
                    ┌─────────────────┐
                    │   API GATEWAY   │ :8080
                    │     (NGINX)     │
                    └────────┬────────┘
                             │
    ┌────────────────────────┼────────────────────────┐
    │           │            │           │            │
    ▼           ▼            ▼           ▼            ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌────────┐ ┌────────────┐
│  User  │ │ Ticket │ │   Audit  │ │ Admin  │ │Notification│
│Service │ │Service │ │  Service │ │Service │ │  Service   │
│ :3001  │ │ :3002  │ │  :3003   │ │ :3005  │ │   :3004    │
└────────┘ └────────┘ └──────────┘ └────────┘ └────────────┘
    │           │            │           │            │
    └───────────┴────────────┴───────────┴────────────┘
                             │
                    ┌────────┴────────┐
                    │    RabbitMQ     │
                    └─────────────────┘
```

### Gateway Routing Table
| Path Pattern | Backend Service | Auth Required |
|--------------|-----------------|---------------|
| `/auth/*` | user-service:3001 | No (except change-password) |
| `/users/*` | user-service:3001 | Yes |
| `/tickets/*` | ticket-service:3002 | Yes |
| `/admin/*` | admin-service:3005 | Yes (ADMIN) |
| `/audit/*` | audit-service:3003 | Yes |
| `/health` | Gateway aggregated | No |

### Known Challenges
- Admin service depends on multiple services (availability)
- Gateway adds single point of failure (consider HA)
- Need to handle partial failures gracefully

---

## 🔄 Status Legend

| Symbol | Meaning |
|--------|---------|
| ⬜ | Not Started |
| 🔄 | In Progress |
| ✅ | Completed |
| ⚠️ | Blocked |
| ❌ | Cancelled |

---

*Last Updated: January 18, 2026*
