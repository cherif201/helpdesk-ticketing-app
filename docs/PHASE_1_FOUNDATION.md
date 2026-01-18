# Phase 1: Foundation (Week 1-2)

## 📋 Phase Overview

**Goal**: Set up infrastructure and extract User Service  
**Duration**: Week 1-2  
**Dependencies**: None (Starting phase)  
**Database Strategy**: Option A - Shared Database

---

## 📊 Progress Summary

| Category | Total | Completed | In Progress | Not Started |
|----------|-------|-----------|-------------|-------------|
| Tasks | 3 | 0 | 0 | 3 |
| Subtasks | 47 | 0 | 0 | 47 |

**Overall Phase Progress**: 0%

---

## 🔧 Task 1: Set up Message Broker (RabbitMQ)

**Status**: ⬜ Not Started  
**Priority**: High  
**Estimated Duration**: 2-3 days

### 1.1 Install and Configure RabbitMQ in Development

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.1.1 | Add RabbitMQ service to `docker-compose.yml` | ⬜ Not Started | |
| 1.1.2 | Configure RabbitMQ ports (5672 for AMQP, 15672 for management UI) | ⬜ Not Started | |
| 1.1.3 | Set RabbitMQ environment variables (user, password, vhost) | ⬜ Not Started | |
| 1.1.4 | Add RabbitMQ volume for data persistence | ⬜ Not Started | |
| 1.1.5 | Add healthcheck configuration for RabbitMQ | ⬜ Not Started | |
| 1.1.6 | Test RabbitMQ container starts successfully | ⬜ Not Started | |
| 1.1.7 | Access RabbitMQ management UI and verify connectivity | ⬜ Not Started | |

### 1.2 Create Exchange and Queue Configurations

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.2.1 | Design exchange topology (topic exchanges for domain events) | ⬜ Not Started | |
| 1.2.2 | Create `user.events` exchange configuration | ⬜ Not Started | |
| 1.2.3 | Create `ticket.events` exchange configuration | ⬜ Not Started | |
| 1.2.4 | Create `audit.events` exchange configuration | ⬜ Not Started | |
| 1.2.5 | Create `notification.events` exchange configuration | ⬜ Not Started | |
| 1.2.6 | Define queue naming conventions | ⬜ Not Started | |
| 1.2.7 | Create Dead Letter Queue (DLQ) configuration | ⬜ Not Started | |
| 1.2.8 | Document exchange and queue topology | ⬜ Not Started | |

### 1.3 Add NestJS Microservice Transport Layer

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 1.3.1 | Install `@nestjs/microservices` package | ⬜ Not Started | |
| 1.3.2 | Install `amqplib` package | ⬜ Not Started | |
| 1.3.3 | Install `amqp-connection-manager` package | ⬜ Not Started | |
| 1.3.4 | Create RabbitMQ connection configuration module | ⬜ Not Started | |
| 1.3.5 | Create reusable RabbitMQ client provider | ⬜ Not Started | |
| 1.3.6 | Test connection to RabbitMQ from NestJS app | ⬜ Not Started | |

---

## 📦 Task 2: Create Shared Library

**Status**: ⬜ Not Started  
**Priority**: High  
**Estimated Duration**: 2-3 days

### 2.1 Set Up Shared Package Structure

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.1.1 | Create `shared/` directory in project root | ⬜ Not Started | |
| 2.1.2 | Initialize `package.json` for shared library | ⬜ Not Started | |
| 2.1.3 | Configure TypeScript (`tsconfig.json`) for shared library | ⬜ Not Started | |
| 2.1.4 | Set up build scripts for shared library | ⬜ Not Started | |
| 2.1.5 | Configure npm workspace or local package linking | ⬜ Not Started | |

### 2.2 Extract Common Types and Interfaces

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.2.1 | Create `shared/interfaces/` directory | ⬜ Not Started | |
| 2.2.2 | Create `jwt-payload.interface.ts` | ⬜ Not Started | |
| 2.2.3 | Create `base-response.interface.ts` | ⬜ Not Started | |
| 2.2.4 | Create `pagination.interface.ts` | ⬜ Not Started | |
| 2.2.5 | Create `user-role.enum.ts` | ⬜ Not Started | |
| 2.2.6 | Create `ticket-status.enum.ts` | ⬜ Not Started | |
| 2.2.7 | Export all interfaces from `shared/interfaces/index.ts` | ⬜ Not Started | |

### 2.3 Define Event Schemas

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.3.1 | Create `shared/events/` directory | ⬜ Not Started | |
| 2.3.2 | Create `domain-event.interface.ts` (base event envelope) | ⬜ Not Started | |
| 2.3.3 | Create `user.events.ts` with all user event types | ⬜ Not Started | |
| 2.3.4 | Create `ticket.events.ts` with all ticket event types | ⬜ Not Started | |
| 2.3.5 | Create `audit.events.ts` with audit event types | ⬜ Not Started | |
| 2.3.6 | Create `notification.events.ts` with notification event types | ⬜ Not Started | |
| 2.3.7 | Create event constants (event names, routing keys) | ⬜ Not Started | |
| 2.3.8 | Export all events from `shared/events/index.ts` | ⬜ Not Started | |

### 2.4 Create Shared DTOs

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.4.1 | Create `shared/dto/` directory | ⬜ Not Started | |
| 2.4.2 | Create `user.dto.ts` (UserDto, CreateUserDto) | ⬜ Not Started | |
| 2.4.3 | Create `pagination.dto.ts` (PaginationDto, PaginatedResponse) | ⬜ Not Started | |
| 2.4.4 | Create `api-response.dto.ts` (standard API responses) | ⬜ Not Started | |
| 2.4.5 | Export all DTOs from `shared/dto/index.ts` | ⬜ Not Started | |

### 2.5 Create Shared Utilities

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 2.5.1 | Create `shared/utils/` directory | ⬜ Not Started | |
| 2.5.2 | Create event factory utility for creating domain events | ⬜ Not Started | |
| 2.5.3 | Create correlation ID generator utility | ⬜ Not Started | |
| 2.5.4 | Create shared constants file | ⬜ Not Started | |
| 2.5.5 | Build and test shared library | ⬜ Not Started | |

---

## 🔐 Task 3: Extract User Service

**Status**: ⬜ Not Started  
**Priority**: Critical  
**Estimated Duration**: 5-7 days

### 3.1 Create User Service Project Structure

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.1.1 | Create `services/` directory in project root | ⬜ Not Started | |
| 3.1.2 | Create `services/user-service/` directory | ⬜ Not Started | |
| 3.1.3 | Initialize `package.json` for user-service | ⬜ Not Started | |
| 3.1.4 | Copy and configure `tsconfig.json` | ⬜ Not Started | |
| 3.1.5 | Copy and configure `nest-cli.json` | ⬜ Not Started | |
| 3.1.6 | Create `src/` directory structure | ⬜ Not Started | |
| 3.1.7 | Link shared library to user-service | ⬜ Not Started | |

### 3.2 Set Up User Service Prisma Schema

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.2.1 | Create `prisma/` directory in user-service | ⬜ Not Started | |
| 3.2.2 | Create `schema.prisma` with User model | ⬜ Not Started | |
| 3.2.3 | Add PasswordResetToken model to schema | ⬜ Not Started | |
| 3.2.4 | Configure database connection string | ⬜ Not Started | |
| 3.2.5 | Generate Prisma client for user-service | ⬜ Not Started | |
| 3.2.6 | Create PrismaModule for user-service | ⬜ Not Started | |
| 3.2.7 | Create PrismaService for user-service | ⬜ Not Started | |

### 3.3 Migrate Auth Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.3.1 | Create `src/auth/` directory in user-service | ⬜ Not Started | |
| 3.3.2 | Copy `auth.module.ts` and adapt imports | ⬜ Not Started | |
| 3.3.3 | Copy `auth.controller.ts` and adapt | ⬜ Not Started | |
| 3.3.4 | Copy `auth.service.ts` and remove external dependencies | ⬜ Not Started | |
| 3.3.5 | Copy `dto/` folder (signup, login, forgot-password, etc.) | ⬜ Not Started | |
| 3.3.6 | Copy `guards/` folder (jwt-auth.guard.ts) | ⬜ Not Started | |
| 3.3.7 | Copy `strategies/` folder (jwt.strategy.ts) | ⬜ Not Started | |
| 3.3.8 | Update imports to use shared library types | ⬜ Not Started | |

### 3.4 Create Users Module (Internal API)

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.4.1 | Create `src/users/` directory | ⬜ Not Started | |
| 3.4.2 | Create `users.module.ts` | ⬜ Not Started | |
| 3.4.3 | Create `users.controller.ts` with internal endpoints | ⬜ Not Started | |
| 3.4.4 | Create `users.service.ts` | ⬜ Not Started | |
| 3.4.5 | Implement `GET /users/:id` endpoint (internal) | ⬜ Not Started | |
| 3.4.6 | Implement `POST /auth/validate` endpoint for JWT validation | ⬜ Not Started | |
| 3.4.7 | Implement `GET /auth/me` endpoint | ⬜ Not Started | |

### 3.5 Implement User Event Publishing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.5.1 | Create `src/events/` directory | ⬜ Not Started | |
| 3.5.2 | Create `user-events.publisher.ts` | ⬜ Not Started | |
| 3.5.3 | Create `user-events.module.ts` | ⬜ Not Started | |
| 3.5.4 | Implement `publishUserCreated()` method | ⬜ Not Started | |
| 3.5.5 | Implement `publishUserUpdated()` method | ⬜ Not Started | |
| 3.5.6 | Implement `publishUserDeleted()` method | ⬜ Not Started | |
| 3.5.7 | Implement `publishPasswordResetRequested()` method | ⬜ Not Started | |
| 3.5.8 | Integrate event publishing into AuthService (signup, forgot-password) | ⬜ Not Started | |
| 3.5.9 | Test event publishing to RabbitMQ | ⬜ Not Started | |

### 3.6 Remove Email/Audit Direct Dependencies

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.6.1 | Remove EmailService import from AuthService | ⬜ Not Started | |
| 3.6.2 | Remove AuditService import from AuthService | ⬜ Not Started | |
| 3.6.3 | Replace email calls with event publishing | ⬜ Not Started | |
| 3.6.4 | Replace audit calls with event publishing | ⬜ Not Started | |
| 3.6.5 | Update AuthModule providers | ⬜ Not Started | |

### 3.7 Create User Service Entry Point

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.7.1 | Create `src/main.ts` with HTTP server | ⬜ Not Started | |
| 3.7.2 | Configure RabbitMQ microservice transport | ⬜ Not Started | |
| 3.7.3 | Create `src/app.module.ts` with all module imports | ⬜ Not Started | |
| 3.7.4 | Configure CORS settings | ⬜ Not Started | |
| 3.7.5 | Configure Swagger documentation | ⬜ Not Started | |
| 3.7.6 | Configure global validation pipe | ⬜ Not Started | |

### 3.8 Create Health Check Module

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.8.1 | Create `src/health/` directory | ⬜ Not Started | |
| 3.8.2 | Create `health.module.ts` | ⬜ Not Started | |
| 3.8.3 | Create `health.controller.ts` | ⬜ Not Started | |
| 3.8.4 | Implement database health check | ⬜ Not Started | |
| 3.8.5 | Implement RabbitMQ health check | ⬜ Not Started | |

### 3.9 Create Dockerfile for User Service

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.9.1 | Create `Dockerfile` in user-service directory | ⬜ Not Started | |
| 3.9.2 | Configure multi-stage build (builder + runtime) | ⬜ Not Started | |
| 3.9.3 | Copy and install dependencies | ⬜ Not Started | |
| 3.9.4 | Generate Prisma client in Docker build | ⬜ Not Started | |
| 3.9.5 | Configure runtime user (non-root) | ⬜ Not Started | |
| 3.9.6 | Test Docker build locally | ⬜ Not Started | |

### 3.10 Update Docker Compose

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.10.1 | Add user-service to `docker-compose.yml` | ⬜ Not Started | |
| 3.10.2 | Configure user-service environment variables | ⬜ Not Started | |
| 3.10.3 | Set user-service port (e.g., 3001) | ⬜ Not Started | |
| 3.10.4 | Add dependency on postgres and rabbitmq | ⬜ Not Started | |
| 3.10.5 | Test user-service starts in Docker Compose | ⬜ Not Started | |

### 3.11 Update Frontend API Service

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.11.1 | Add USER_SERVICE_URL environment variable to frontend | ⬜ Not Started | |
| 3.11.2 | Update auth endpoints in `api.ts` to point to user-service | ⬜ Not Started | |
| 3.11.3 | Test signup flow with new user-service | ⬜ Not Started | |
| 3.11.4 | Test login flow with new user-service | ⬜ Not Started | |
| 3.11.5 | Test forgot-password flow with new user-service | ⬜ Not Started | |
| 3.11.6 | Test reset-password flow with new user-service | ⬜ Not Started | |
| 3.11.7 | Test change-password flow with new user-service | ⬜ Not Started | |

### 3.12 Integration Testing

| # | Subtask | Status | Notes |
|---|---------|--------|-------|
| 3.12.1 | Write integration tests for auth endpoints | ⬜ Not Started | |
| 3.12.2 | Write integration tests for user endpoints | ⬜ Not Started | |
| 3.12.3 | Verify events are published correctly | ⬜ Not Started | |
| 3.12.4 | Test error handling and edge cases | ⬜ Not Started | |
| 3.12.5 | Document any breaking changes | ⬜ Not Started | |

---

## 📋 Phase 1 Deliverables Checklist

| # | Deliverable | Status | Verification |
|---|-------------|--------|--------------|
| 1 | RabbitMQ running in docker-compose | ⬜ Not Started | Management UI accessible |
| 2 | `@helpdesk/shared` package created | ⬜ Not Started | Package builds successfully |
| 3 | `user-service` running independently | ⬜ Not Started | Health check returns OK |
| 4 | All auth endpoints functional | ⬜ Not Started | All tests pass |
| 5 | Events publishing to RabbitMQ | ⬜ Not Started | Messages visible in RabbitMQ |
| 6 | Frontend integrated with user-service | ⬜ Not Started | Full auth flow works |
| 7 | Docker Compose orchestrates all services | ⬜ Not Started | `docker-compose up` works |

---

## 📝 Notes & Decisions

### Configuration Decisions
- User Service Port: `3001`
- RabbitMQ Management Port: `15672`
- RabbitMQ AMQP Port: `5672`
- Shared library name: `@helpdesk/shared`

### Known Dependencies
- Existing backend must remain functional during migration
- Frontend will need environment variable updates
- Database schema remains unchanged (Option A)

### Rollback Plan
- Keep original backend running in parallel
- Frontend can switch between backends via environment variable
- RabbitMQ events are optional until Phase 2

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
