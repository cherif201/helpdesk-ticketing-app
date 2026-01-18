# Phase 2: Core Services (Week 3-4)

## 📋 Phase Overview

**Goal**: Extract Ticket, Notification, and Audit Services  
**Duration**: Week 3-4  
**Dependencies**: Phase 1 completed (RabbitMQ, Shared Library, User Service)  
**Database Strategy**: Option A - Shared Database

---

## 📊 Progress Summary

| Category | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| Tasks | 3 | 0 | 0 | 3 |
| Subtasks | 89 | 0 | 0 | 89 |

**Overall Phase Progress**: 0%

---

## 🎫 Task 1: Extract Ticket Service

**Status**: ⬜ Not Started  
**Priority**: Critical  
**Estimated Duration**: 5-6 days

### 1.1 Create Ticket Service Project Structure

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.1.1 | Create `services/ticket-service/` directory | ⬜ Not Started | |
| 1.1.2 | Initialize `package.json` for ticket-service | ⬜ Not Started | |
| 1.1.3 | Copy and configure `tsconfig.json` | ⬜ Not Started | |
| 1.1.4 | Copy and configure `nest-cli.json` | ⬜ Not Started | |
| 1.1.5 | Create `src/` directory structure | ⬜ Not Started | |
| 1.1.6 | Install NestJS dependencies | ⬜ Not Started | |
| 1.1.7 | Install microservices dependencies (@nestjs/microservices, amqplib) | ⬜ Not Started | |
| 1.1.8 | Link shared library to ticket-service | ⬜ Not Started | |

### 1.2 Set Up Ticket Service Prisma Schema

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.2.1 | Create `prisma/` directory in ticket-service | ⬜ Not Started | |
| 1.2.2 | Create `schema.prisma` with Ticket model | ⬜ Not Started | |
| 1.2.3 | Add TicketComment model to schema | ⬜ Not Started | |
| 1.2.4 | Add TicketStatus enum to schema | ⬜ Not Started | |
| 1.2.5 | Configure database connection string (shared DB) | ⬜ Not Started | |
| 1.2.6 | Generate Prisma client for ticket-service | ⬜ Not Started | |
| 1.2.7 | Create PrismaModule for ticket-service | ⬜ Not Started | |
| 1.2.8 | Create PrismaService for ticket-service | ⬜ Not Started | |

### 1.3 Migrate Tickets Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.3.1 | Create `src/tickets/` directory in ticket-service | ⬜ Not Started | |
| 1.3.2 | Copy `tickets.module.ts` and adapt imports | ⬜ Not Started | |
| 1.3.3 | Copy `tickets.controller.ts` and adapt | ⬜ Not Started | |
| 1.3.4 | Copy `tickets.service.ts` and remove external dependencies | ⬜ Not Started | |
| 1.3.5 | Copy `dto/` folder (create-ticket, update-ticket) | ⬜ Not Started | |
| 1.3.6 | Update imports to use shared library types | ⬜ Not Started | |
| 1.3.7 | Remove EmailService dependency from TicketsService | ⬜ Not Started | |
| 1.3.8 | Remove AuditService dependency from TicketsService | ⬜ Not Started | |

### 1.4 Create Comments Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.4.1 | Create `src/comments/` directory | ⬜ Not Started | |
| 1.4.2 | Create `comments.module.ts` | ⬜ Not Started | |
| 1.4.3 | Create `comments.controller.ts` | ⬜ Not Started | |
| 1.4.4 | Create `comments.service.ts` | ⬜ Not Started | |
| 1.4.5 | Create `dto/create-comment.dto.ts` | ⬜ Not Started | |
| 1.4.6 | Implement `POST /tickets/:id/comments` endpoint | ⬜ Not Started | |
| 1.4.7 | Implement `GET /tickets/:id/comments` endpoint | ⬜ Not Started | |

### 1.5 Create User Service Client

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.5.1 | Create `src/clients/` directory | ⬜ Not Started | |
| 1.5.2 | Create `user-service.client.ts` | ⬜ Not Started | |
| 1.5.3 | Implement `validateToken()` method via HTTP call | ⬜ Not Started | |
| 1.5.4 | Implement `getUserById()` method | ⬜ Not Started | |
| 1.5.5 | Implement error handling and retry logic | ⬜ Not Started | |
| 1.5.6 | Create HTTP client module with axios/fetch | ⬜ Not Started | |
| 1.5.7 | Configure USER_SERVICE_URL environment variable | ⬜ Not Started | |

### 1.6 Implement JWT Validation via User Service

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.6.1 | Create `src/auth/` directory for guards | ⬜ Not Started | |
| 1.6.2 | Create `jwt-auth.guard.ts` that calls user-service | ⬜ Not Started | |
| 1.6.3 | Implement token validation logic | ⬜ Not Started | |
| 1.6.4 | Cache validated tokens (optional, for performance) | ⬜ Not Started | |
| 1.6.5 | Create `roles.guard.ts` | ⬜ Not Started | |
| 1.6.6 | Create `roles.decorator.ts` | ⬜ Not Started | |
| 1.6.7 | Test authentication flow with user-service | ⬜ Not Started | |

### 1.7 Implement Ticket Event Publishing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.7.1 | Create `src/events/` directory | ⬜ Not Started | |
| 1.7.2 | Create `ticket-events.publisher.ts` | ⬜ Not Started | |
| 1.7.3 | Create `ticket-events.module.ts` | ⬜ Not Started | |
| 1.7.4 | Implement `publishTicketCreated()` method | ⬜ Not Started | |
| 1.7.5 | Implement `publishTicketUpdated()` method | ⬜ Not Started | |
| 1.7.6 | Implement `publishTicketStatusChanged()` method | ⬜ Not Started | |
| 1.7.7 | Implement `publishTicketAssigned()` method | ⬜ Not Started | |
| 1.7.8 | Implement `publishTicketDeleted()` method | ⬜ Not Started | |
| 1.7.9 | Implement `publishCommentAdded()` method | ⬜ Not Started | |
| 1.7.10 | Integrate event publishing into TicketsService | ⬜ Not Started | |
| 1.7.11 | Integrate event publishing into CommentsService | ⬜ Not Started | |
| 1.7.12 | Test event publishing to RabbitMQ | ⬜ Not Started | |

### 1.8 Implement User Events Consumer

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.8.1 | Create `user-events.consumer.ts` | ⬜ Not Started | |
| 1.8.2 | Subscribe to `user.deleted` event | ⬜ Not Started | |
| 1.8.3 | Implement cascade cleanup for deleted users | ⬜ Not Started | |
| 1.8.4 | Handle ticket orphaning when user is deleted | ⬜ Not Started | |
| 1.8.5 | Test user deletion cascade | ⬜ Not Started | |

### 1.9 Create Ticket Service Entry Point

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.9.1 | Create `src/main.ts` with HTTP server | ⬜ Not Started | |
| 1.9.2 | Configure RabbitMQ microservice transport | ⬜ Not Started | |
| 1.9.3 | Create `src/app.module.ts` with all module imports | ⬜ Not Started | |
| 1.9.4 | Configure CORS settings | ⬜ Not Started | |
| 1.9.5 | Configure Swagger documentation | ⬜ Not Started | |
| 1.9.6 | Configure global validation pipe | ⬜ Not Started | |

### 1.10 Create Health Check Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.10.1 | Create `src/health/` directory | ⬜ Not Started | |
| 1.10.2 | Create `health.module.ts` | ⬜ Not Started | |
| 1.10.3 | Create `health.controller.ts` | ⬜ Not Started | |
| 1.10.4 | Implement database health check | ⬜ Not Started | |
| 1.10.5 | Implement RabbitMQ health check | ⬜ Not Started | |
| 1.10.6 | Implement user-service dependency health check | ⬜ Not Started | |

### 1.11 Create Dockerfile and Update Docker Compose

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.11.1 | Create `Dockerfile` in ticket-service directory | ⬜ Not Started | |
| 1.11.2 | Configure multi-stage build | ⬜ Not Started | |
| 1.11.3 | Generate Prisma client in Docker build | ⬜ Not Started | |
| 1.11.4 | Add ticket-service to `docker-compose.yml` | ⬜ Not Started | |
| 1.11.5 | Configure ticket-service environment variables | ⬜ Not Started | |
| 1.11.6 | Set ticket-service port (e.g., 3002) | ⬜ Not Started | |
| 1.11.7 | Add dependencies on postgres, rabbitmq, user-service | ⬜ Not Started | |
| 1.11.8 | Test ticket-service starts in Docker Compose | ⬜ Not Started | |

### 1.12 Update Frontend for Ticket Service

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.12.1 | Add TICKET_SERVICE_URL environment variable | ⬜ Not Started | |
| 1.12.2 | Update ticket endpoints in `api.ts` | ⬜ Not Started | |
| 1.12.3 | Test create ticket flow | ⬜ Not Started | |
| 1.12.4 | Test list tickets flow | ⬜ Not Started | |
| 1.12.5 | Test update ticket flow | ⬜ Not Started | |
| 1.12.6 | Test delete ticket flow | ⬜ Not Started | |
| 1.12.7 | Test comments functionality | ⬜ Not Started | |
| 1.12.8 | Test ticket assignment flow | ⬜ Not Started | |

---

## 📧 Task 2: Evolve Notification Service

**Status**: ⬜ Not Started  
**Priority**: High  
**Estimated Duration**: 3-4 days

### 2.1 Restructure Existing Mailer Service

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.1.1 | Rename `mailer/` directory to `services/notification-service/` | ⬜ Not Started | |
| 2.1.2 | Update `package.json` name to `notification-service` | ⬜ Not Started | |
| 2.1.3 | Install microservices dependencies | ⬜ Not Started | |
| 2.1.4 | Link shared library to notification-service | ⬜ Not Started | |

### 2.2 Update Prisma Schema

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.2.1 | Update `schema.prisma` to only include EmailOutbox model | ⬜ Not Started | |
| 2.2.2 | Regenerate Prisma client | ⬜ Not Started | |
| 2.2.3 | Test database connection | ⬜ Not Started | |

### 2.3 Create Event Consumers

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.3.1 | Create `src/consumers/` directory | ⬜ Not Started | |
| 2.3.2 | Create `consumers.module.ts` | ⬜ Not Started | |
| 2.3.3 | Create `user-events.consumer.ts` | ⬜ Not Started | |
| 2.3.4 | Implement `user.created` handler (welcome email) | ⬜ Not Started | |
| 2.3.5 | Implement `user.password_reset_requested` handler | ⬜ Not Started | |
| 2.3.6 | Create `ticket-events.consumer.ts` | ⬜ Not Started | |
| 2.3.7 | Implement `ticket.created` handler (staff notification) | ⬜ Not Started | |
| 2.3.8 | Implement `ticket.status_changed` handler | ⬜ Not Started | |
| 2.3.9 | Implement `ticket.assigned` handler | ⬜ Not Started | |
| 2.3.10 | Test all event consumers | ⬜ Not Started | |

### 2.4 Implement Email Templates

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.4.1 | Create `src/email/templates/` directory | ⬜ Not Started | |
| 2.4.2 | Create `welcome.template.ts` | ⬜ Not Started | |
| 2.4.3 | Create `password-reset.template.ts` | ⬜ Not Started | |
| 2.4.4 | Create `ticket-created.template.ts` | ⬜ Not Started | |
| 2.4.5 | Create `ticket-status-changed.template.ts` | ⬜ Not Started | |
| 2.4.6 | Create `ticket-assigned.template.ts` | ⬜ Not Started | |
| 2.4.7 | Create template factory/manager | ⬜ Not Started | |

### 2.5 Refactor Email Processing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.5.1 | Update `email.service.ts` to use templates | ⬜ Not Started | |
| 2.5.2 | Keep polling mechanism as fallback | ⬜ Not Started | |
| 2.5.3 | Add priority field to email queue | ⬜ Not Started | |
| 2.5.4 | Implement email retry with exponential backoff | ⬜ Not Started | |
| 2.5.5 | Add email delivery status tracking | ⬜ Not Started | |

### 2.6 Add HTTP Endpoints (Optional)

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.6.1 | Create `notifications.controller.ts` | ⬜ Not Started | |
| 2.6.2 | Implement `POST /notifications/email` (internal) | ⬜ Not Started | |
| 2.6.3 | Implement `GET /notifications/status/:id` | ⬜ Not Started | |
| 2.6.4 | Add authentication for internal endpoints | ⬜ Not Started | |

### 2.7 Update Entry Point and Configuration

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.7.1 | Update `main.ts` to include microservice transport | ⬜ Not Started | |
| 2.7.2 | Update `app.module.ts` with new modules | ⬜ Not Started | |
| 2.7.3 | Create health check endpoint | ⬜ Not Started | |
| 2.7.4 | Update Dockerfile | ⬜ Not Started | |
| 2.7.5 | Update docker-compose.yml configuration | ⬜ Not Started | |
| 2.7.6 | Test notification service in isolation | ⬜ Not Started | |

---

## 📊 Task 3: Extract Audit Service

**Status**: ⬜ Not Started  
**Priority**: High  
**Estimated Duration**: 3-4 days

### 3.1 Create Audit Service Project Structure

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.1.1 | Create `services/audit-service/` directory | ⬜ Not Started | |
| 3.1.2 | Initialize `package.json` for audit-service | ⬜ Not Started | |
| 3.1.3 | Copy and configure `tsconfig.json` | ⬜ Not Started | |
| 3.1.4 | Copy and configure `nest-cli.json` | ⬜ Not Started | |
| 3.1.5 | Create `src/` directory structure | ⬜ Not Started | |
| 3.1.6 | Install NestJS and microservices dependencies | ⬜ Not Started | |
| 3.1.7 | Link shared library to audit-service | ⬜ Not Started | |

### 3.2 Set Up Audit Service Prisma Schema

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.2.1 | Create `prisma/` directory in audit-service | ⬜ Not Started | |
| 3.2.2 | Create `schema.prisma` with AuditEvent model | ⬜ Not Started | |
| 3.2.3 | Configure database connection string (shared DB) | ⬜ Not Started | |
| 3.2.4 | Generate Prisma client for audit-service | ⬜ Not Started | |
| 3.2.5 | Create PrismaModule and PrismaService | ⬜ Not Started | |

### 3.3 Create Audit Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.3.1 | Create `src/audit/` directory | ⬜ Not Started | |
| 3.3.2 | Create `audit.module.ts` | ⬜ Not Started | |
| 3.3.3 | Create `audit.controller.ts` | ⬜ Not Started | |
| 3.3.4 | Create `audit.service.ts` | ⬜ Not Started | |
| 3.3.5 | Implement `POST /audit/log` endpoint (internal) | ⬜ Not Started | |
| 3.3.6 | Implement `GET /audit/entity/:type/:id` endpoint | ⬜ Not Started | |
| 3.3.7 | Implement `GET /audit/actor/:id` endpoint | ⬜ Not Started | |
| 3.3.8 | Implement `GET /audit/search` endpoint with filters | ⬜ Not Started | |
| 3.3.9 | Add pagination to audit endpoints | ⬜ Not Started | |

### 3.4 Create All Events Consumer

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.4.1 | Create `src/consumers/` directory | ⬜ Not Started | |
| 3.4.2 | Create `all-events.consumer.ts` | ⬜ Not Started | |
| 3.4.3 | Subscribe to `user.events` exchange | ⬜ Not Started | |
| 3.4.4 | Subscribe to `ticket.events` exchange | ⬜ Not Started | |
| 3.4.5 | Subscribe to `audit.events` exchange | ⬜ Not Started | |
| 3.4.6 | Implement event-to-audit-log transformation | ⬜ Not Started | |
| 3.4.7 | Handle all event types and log appropriately | ⬜ Not Started | |
| 3.4.8 | Implement idempotency to prevent duplicate logs | ⬜ Not Started | |
| 3.4.9 | Test audit logging for all event types | ⬜ Not Started | |

### 3.5 Create Audit Service Entry Point

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.5.1 | Create `src/main.ts` with HTTP server | ⬜ Not Started | |
| 3.5.2 | Configure RabbitMQ microservice transport | ⬜ Not Started | |
| 3.5.3 | Create `src/app.module.ts` | ⬜ Not Started | |
| 3.5.4 | Configure CORS settings | ⬜ Not Started | |
| 3.5.5 | Configure Swagger documentation | ⬜ Not Started | |

### 3.6 Create Health Check Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.6.1 | Create `src/health/` directory | ⬜ Not Started | |
| 3.6.2 | Create `health.module.ts` and `health.controller.ts` | ⬜ Not Started | |
| 3.6.3 | Implement database health check | ⬜ Not Started | |
| 3.6.4 | Implement RabbitMQ health check | ⬜ Not Started | |

### 3.7 Create Dockerfile and Update Docker Compose

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.7.1 | Create `Dockerfile` in audit-service directory | ⬜ Not Started | |
| 3.7.2 | Configure multi-stage build | ⬜ Not Started | |
| 3.7.3 | Add audit-service to `docker-compose.yml` | ⬜ Not Started | |
| 3.7.4 | Configure audit-service environment variables | ⬜ Not Started | |
| 3.7.5 | Set audit-service port (e.g., 3003) | ⬜ Not Started | |
| 3.7.6 | Add dependencies on postgres and rabbitmq | ⬜ Not Started | |
| 3.7.7 | Test audit-service starts in Docker Compose | ⬜ Not Started | |

### 3.8 Integration Testing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.8.1 | Test user events are logged | ⬜ Not Started | |
| 3.8.2 | Test ticket events are logged | ⬜ Not Started | |
| 3.8.3 | Test audit query endpoints | ⬜ Not Started | |
| 3.8.4 | Verify no duplicate audit entries | ⬜ Not Started | |
| 3.8.5 | Test audit trail retrieval | ⬜ Not Started | |

---

## 📋 Phase 2 Deliverables Checklist

| # | Deliverable | Status | Verification |
|---|-------------|--------|--------------|
| 1 | `ticket-service` running independently | ⬜ Not Started | Health check returns OK |
| 2 | Ticket CRUD operations functional | ⬜ Not Started | All endpoints work |
| 3 | Comments functionality working | ⬜ Not Started | Add/list comments works |
| 4 | JWT validation via user-service | ⬜ Not Started | Auth flow works |
| 5 | `notification-service` fully event-driven | ⬜ Not Started | Emails sent on events |
| 6 | Email templates implemented | ⬜ Not Started | Formatted emails sent |
| 7 | `audit-service` capturing all events | ⬜ Not Started | Audit logs created |
| 8 | Audit query endpoints functional | ⬜ Not Started | Can retrieve audit trail |
| 9 | Cross-service communication working | ⬜ Not Started | Events flow correctly |
| 10 | Frontend integrated with ticket-service | ⬜ Not Started | Full ticket flow works |
| 11 | All services in Docker Compose | ⬜ Not Started | All services start |

---

## 📝 Notes & Decisions

### Configuration Decisions
- Ticket Service Port: `3002`
- Audit Service Port: `3003`
- Notification Service Port: `3004` (optional HTTP)

### Service Dependencies
```
user-service (3001)
    ↑
ticket-service (3002) → RabbitMQ → notification-service (3004)
                     → RabbitMQ → audit-service (3003)
```

### Event Flow
1. User creates ticket → ticket-service publishes `ticket.created`
2. notification-service consumes event → sends email
3. audit-service consumes event → creates audit log

### Known Challenges
- JWT validation adds latency (consider caching)
- Event ordering must be maintained
- Error handling across services

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
