# Microservices Architecture Refactoring Plan

## 📋 Executive Summary

This document provides a comprehensive plan to refactor the current monolithic NestJS backend into a microservices architecture. The goal is to improve scalability, maintainability, fault isolation, and enable independent deployments.

---

## 🏗️ Current Architecture Analysis

### Current Structure (Monolith)

```
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Single API)                       │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────┐ │
│  │ AuthModule   │ │ TicketModule │ │ AdminModule              │ │
│  │ - signup     │ │ - create     │ │ - updateRole             │ │
│  │ - login      │ │ - findAll    │ │ - getAgents              │ │
│  │ - forgot-pwd │ │ - findOne    │ │ - getUsers               │ │
│  │ - reset-pwd  │ │ - update     │ │ - deleteUser             │ │
│  │ - change-pwd │ │ - assign     │ │ - getDashboardStatistics │ │
│  └──────────────┘ │ - comments   │ └──────────────────────────┘ │
│                   │ - audit      │                               │
│  ┌──────────────┐ │ - inbox      │ ┌──────────────────────────┐ │
│  │ EmailModule  │ │ - delete     │ │ AuditModule              │ │
│  │ (queue only) │ └──────────────┘ │ - log                    │ │
│  └──────────────┘                   │ - getTicketAudit         │ │
│                                     └──────────────────────────┘ │
│  ┌──────────────┐ ┌──────────────┐                               │
│  │ HealthModule │ │ PrismaModule │ (Shared database connection)  │
│  └──────────────┘ └──────────────┘                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     MAILER SERVICE (Separate)                    │
│  - Polls email_outbox table                                      │
│  - Sends emails via SMTP                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     POSTGRESQL DATABASE                          │
│  - users, tickets, ticket_comments, email_outbox, audit_events   │
│  - password_reset_tokens                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Current Service Dependencies

| Service | Dependencies |
|---------|--------------|
| AuthService | PrismaService, JwtService, EmailService, AuditService |
| TicketsService | PrismaService, AuditService, EmailService |
| AdminService | PrismaService, AuditService |
| EmailService | PrismaService (queues to email_outbox) |
| AuditService | PrismaService |
| MailerService | PrismaService (standalone, polls email_outbox) |

### Current Pain Points

1. **Tight Coupling**: All modules share a single database connection and codebase
2. **Single Point of Failure**: If the API goes down, all functionality is lost
3. **Scaling Limitations**: Cannot scale individual features independently
4. **Deployment Risk**: Any change requires full redeployment
5. **Cross-cutting Concerns**: Audit and email logic scattered across services

---

## 🎯 Proposed Microservices Architecture

### Target Architecture

```
                                    ┌─────────────────┐
                                    │   API GATEWAY   │
                                    │   (Optional)    │
                                    └────────┬────────┘
                                             │
          ┌──────────────────────────────────┼──────────────────────────────────┐
          │                                  │                                   │
          ▼                                  ▼                                   ▼
┌──────────────────┐            ┌──────────────────────┐           ┌──────────────────┐
│  USER SERVICE    │            │   TICKET SERVICE     │           │ NOTIFICATION SVC │
│                  │◄──────────►│                      │──────────►│                  │
│  - Auth          │    JWT     │  - CRUD Tickets      │   Event   │  - Email Queue   │
│  - User CRUD     │  Validate  │  - Comments          │   Bus     │  - Send Emails   │
│  - Password Mgmt │            │  - Assignment        │           │  - Templates     │
│  - JWT Issue     │            │  - Inbox             │           │                  │
└────────┬─────────┘            └──────────┬───────────┘           └────────┬─────────┘
         │                                  │                                │
         │        ┌──────────────────┐      │       ┌──────────────────┐     │
         │        │   AUDIT SERVICE  │◄─────┴──────►│  ADMIN SERVICE   │     │
         │        │                  │              │                  │     │
         │        │  - Log Events    │              │  - Dashboard     │     │
         │        │  - Query Audit   │              │  - User Mgmt     │     │
         │        │  - Retention     │              │  - Reports       │     │
         │        └────────┬─────────┘              └────────┬─────────┘     │
         │                 │                                  │               │
         ▼                 ▼                                  ▼               ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              MESSAGE BROKER (RabbitMQ/Redis)                        │
│                                                                                     │
│  Exchanges/Channels:                                                                │
│  - user.events (user.created, user.updated, user.deleted)                          │
│  - ticket.events (ticket.created, ticket.updated, ticket.assigned, ticket.deleted) │
│  - audit.events (audit.log)                                                         │
│  - notification.events (email.send, sms.send)                                       │
└────────────────────────────────────────────────────────────────────────────────────┘
                                             │
                                             ▼
┌────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASES (Per-Service or Shared)                      │
│                                                                                     │
│  Option A: Shared Database (Simpler Migration)                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │                         PostgreSQL (helpdesk)                                │   │
│  │  Schema: users, tickets, ticket_comments, email_outbox, audit_events        │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                     │
│  Option B: Database per Service (Full Isolation - Phase 2)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ users_db    │ │ tickets_db  │ │ audit_db    │ │ email_db    │ │ admin_db    │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Microservices Breakdown

### 1. User Service (user-service)
**Responsibility**: Authentication, Authorization, User Management

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/signup | Create new user account |
| POST | /auth/login | Authenticate user |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password with token |
| POST | /auth/change-password | Change password (authenticated) |
| GET | /auth/me | Get current user profile |
| GET | /users/:id | Get user by ID (internal) |
| POST | /auth/validate | Validate JWT token (internal) |

**Database Tables**: `users`, `password_reset_tokens`

**Events Published**:
- `user.created`
- `user.updated`
- `user.deleted`
- `user.password_reset_requested`

**Dependencies**: None (foundation service)

---

### 2. Ticket Service (ticket-service)
**Responsibility**: Ticket lifecycle, Comments, Assignment

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets | Create ticket |
| GET | /tickets | List tickets (with filters) |
| GET | /tickets/inbox | Get assigned tickets |
| GET | /tickets/:id | Get ticket details |
| PATCH | /tickets/:id | Update ticket |
| DELETE | /tickets/:id | Delete ticket |
| PATCH | /tickets/:id/assign | Assign ticket |
| GET | /tickets/:id/comments | Get comments |
| POST | /tickets/:id/comments | Add comment |

**Database Tables**: `tickets`, `ticket_comments`

**Events Published**:
- `ticket.created`
- `ticket.updated`
- `ticket.status_changed`
- `ticket.assigned`
- `ticket.deleted`
- `ticket.comment_added`

**Events Consumed**:
- `user.deleted` (cascade cleanup)

**Dependencies**: User Service (JWT validation)

---

### 3. Notification Service (notification-service)
**Responsibility**: Email queuing, sending, and template management

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| POST | /notifications/email | Queue email (internal) |
| GET | /notifications/status/:id | Get email status |

**Database Tables**: `email_outbox`

**Events Consumed**:
- `user.created` → Send welcome email
- `user.password_reset_requested` → Send reset email
- `ticket.created` → Notify staff
- `ticket.status_changed` → Notify user
- `ticket.assigned` → Notify user

**Dependencies**: SMTP (external)

---

### 4. Audit Service (audit-service)
**Responsibility**: Event logging, audit trail, compliance

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| POST | /audit/log | Create audit entry (internal) |
| GET | /audit/entity/:type/:id | Get audit trail for entity |
| GET | /audit/actor/:id | Get audit trail for actor |
| GET | /audit/search | Search audit events |

**Database Tables**: `audit_events`

**Events Consumed**:
- All domain events for logging

**Dependencies**: None

---

### 5. Admin Service (admin-service)
**Responsibility**: Dashboard, statistics, user administration

**Endpoints**:
| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/dashboard/statistics | Get dashboard stats |
| GET | /admin/users | List all users |
| GET | /admin/agents | List agents/admins |
| PATCH | /admin/users/:id/role | Update user role |
| DELETE | /admin/users/:id | Delete user |

**Database Tables**: Read from `users`, `tickets` (or via service calls)

**Events Published**:
- `user.role_changed`

**Dependencies**: User Service, Ticket Service

---

## 🔄 Communication Patterns

### Synchronous Communication (HTTP/gRPC)

Used for:
- Real-time user-facing requests
- JWT token validation
- Data queries requiring immediate response

```
Frontend → API Gateway → User Service → Response
                      → Ticket Service → Response
```

### Asynchronous Communication (Message Queue)

Used for:
- Event notifications
- Cross-service data updates
- Email sending
- Audit logging

```
Ticket Service → [ticket.created] → RabbitMQ → Notification Service
                                            → Audit Service
```

### Event Schema Example

```typescript
// Event envelope
interface DomainEvent<T> {
  eventId: string;        // UUID
  eventType: string;      // e.g., "ticket.created"
  aggregateId: string;    // Entity ID
  aggregateType: string;  // e.g., "ticket"
  timestamp: Date;
  version: number;
  payload: T;
  metadata: {
    correlationId?: string;
    causationId?: string;
    userId?: string;
  };
}

// Example: Ticket Created Event
interface TicketCreatedPayload {
  ticketId: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  createdAt: Date;
  userEmail: string;
}
```

---

## 🗂️ Proposed Directory Structure

```
helpdesk-ticketing-app/
├── docker-compose.yml              # Orchestrates all services
├── docker-compose.dev.yml          # Development overrides
├── shared/                         # Shared libraries/types
│   ├── events/                     # Event definitions
│   │   ├── user.events.ts
│   │   ├── ticket.events.ts
│   │   └── index.ts
│   ├── dto/                        # Shared DTOs
│   │   ├── user.dto.ts
│   │   └── pagination.dto.ts
│   └── interfaces/                 # Shared interfaces
│       ├── jwt-payload.interface.ts
│       └── base-response.interface.ts
│
├── services/
│   ├── user-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   └── schema.prisma       # users, password_reset_tokens
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── auth/
│   │       │   ├── auth.controller.ts
│   │       │   ├── auth.service.ts
│   │       │   ├── auth.module.ts
│   │       │   ├── strategies/
│   │       │   ├── guards/
│   │       │   └── dto/
│   │       ├── users/
│   │       │   ├── users.controller.ts
│   │       │   ├── users.service.ts
│   │       │   └── users.module.ts
│   │       ├── events/
│   │       │   ├── user-events.publisher.ts
│   │       │   └── user-events.module.ts
│   │       ├── prisma/
│   │       ├── health/
│   │       └── common/
│   │
│   ├── ticket-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── schema.prisma       # tickets, ticket_comments
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── tickets/
│   │       │   ├── tickets.controller.ts
│   │       │   ├── tickets.service.ts
│   │       │   ├── tickets.module.ts
│   │       │   └── dto/
│   │       ├── comments/
│   │       │   ├── comments.controller.ts
│   │       │   ├── comments.service.ts
│   │       │   └── comments.module.ts
│   │       ├── events/
│   │       │   ├── ticket-events.publisher.ts
│   │       │   ├── user-events.consumer.ts
│   │       │   └── events.module.ts
│   │       ├── clients/
│   │       │   └── user-service.client.ts
│   │       ├── prisma/
│   │       └── health/
│   │
│   ├── notification-service/       # Evolved from mailer/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── schema.prisma       # email_outbox
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── email/
│   │       │   ├── email.service.ts
│   │       │   ├── email.processor.ts
│   │       │   └── templates/
│   │       ├── consumers/
│   │       │   ├── user-events.consumer.ts
│   │       │   ├── ticket-events.consumer.ts
│   │       │   └── consumers.module.ts
│   │       ├── prisma/
│   │       └── health/
│   │
│   ├── audit-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── prisma/
│   │   │   └── schema.prisma       # audit_events
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── audit/
│   │       │   ├── audit.controller.ts
│   │       │   ├── audit.service.ts
│   │       │   └── audit.module.ts
│   │       ├── consumers/
│   │       │   └── all-events.consumer.ts
│   │       ├── prisma/
│   │       └── health/
│   │
│   └── admin-service/
│       ├── Dockerfile
│       ├── package.json
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── dashboard/
│           │   ├── dashboard.controller.ts
│           │   └── dashboard.service.ts
│           ├── user-management/
│           │   ├── user-management.controller.ts
│           │   └── user-management.service.ts
│           ├── clients/
│           │   ├── user-service.client.ts
│           │   └── ticket-service.client.ts
│           └── health/
│
├── api-gateway/                    # Optional: Kong, NGINX, or custom
│   ├── Dockerfile
│   ├── kong.yml                    # or nginx.conf
│   └── routes/
│
├── frontend/                       # Existing frontend (minimal changes)
│   └── ...
│
└── openshift/                      # Updated manifests
    ├── 00-namespace.yaml
    ├── 01-secrets.yaml
    ├── 02-configmaps.yaml
    ├── 03-rabbitmq/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── 04-postgres/
    │   ├── pvc.yaml
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── 05-user-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── route.yaml
    ├── 06-ticket-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── route.yaml
    ├── 07-notification-service/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── 08-audit-service/
    │   ├── deployment.yaml
    │   └── service.yaml
    ├── 09-admin-service/
    │   ├── deployment.yaml
    │   ├── service.yaml
    │   └── route.yaml
    └── 10-frontend/
        ├── deployment.yaml
        ├── service.yaml
        └── route.yaml
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up infrastructure and extract User Service

1. **Set up Message Broker**
   - Add RabbitMQ to docker-compose
   - Create exchange and queue configurations
   - Add NestJS microservice transport layer

2. **Create Shared Library**
   - Extract common types, DTOs, and interfaces
   - Define event schemas
   - Create JWT validation middleware

3. **Extract User Service**
   - Move auth module to standalone service
   - Implement JWT token validation endpoint
   - Publish user events
   - Update frontend to use new endpoints

**Deliverables**:
- RabbitMQ running in docker-compose
- `@helpdesk/shared` npm package
- `user-service` running independently
- All auth endpoints functional

---

### Phase 2: Core Services (Week 3-4)
**Goal**: Extract Ticket and Notification Services

1. **Extract Ticket Service**
   - Move tickets module to standalone service
   - Implement user validation via User Service client
   - Publish ticket events
   - Consume user.deleted events for cleanup

2. **Evolve Notification Service**
   - Upgrade existing mailer to event-driven
   - Add event consumers for all notification triggers
   - Implement email templates
   - Remove polling, use event-driven approach

3. **Extract Audit Service**
   - Move audit module to standalone service
   - Subscribe to all domain events
   - Implement audit query endpoints

**Deliverables**:
- `ticket-service` running independently
- `notification-service` fully event-driven
- `audit-service` capturing all events
- Cross-service communication working

---

### Phase 3: Admin & Gateway (Week 5-6)
**Goal**: Complete service extraction and add gateway

1. **Extract Admin Service**
   - Move admin module to standalone service
   - Implement service clients for aggregated data
   - Add caching for dashboard statistics

2. **Implement API Gateway** (Optional)
   - Set up Kong/NGINX/Custom gateway
   - Configure routing rules
   - Implement rate limiting
   - Add request logging

3. **Update Frontend**
   - Update API service for new routes
   - Handle service-specific endpoints
   - Implement retry logic

**Deliverables**:
- `admin-service` running independently
- API Gateway routing traffic
- Frontend fully integrated
- All services communicating

---

### Phase 4: Production Readiness (Week 7-8)
**Goal**: Harden for production deployment

1. **Observability**
   - Add distributed tracing (Jaeger/Zipkin)
   - Implement correlation IDs
   - Add service health checks
   - Set up centralized logging (ELK/Loki)
   - Configure Prometheus metrics

2. **Resilience**
   - Implement circuit breakers
   - Add retry policies
   - Configure timeouts
   - Implement graceful degradation

3. **Security**
   - Service-to-service authentication
   - Secrets management
   - Network policies in OpenShift

4. **Update OpenShift Manifests**
   - Create deployments for each service
   - Configure HPA (Horizontal Pod Autoscaler)
   - Set resource limits
   - Configure liveness/readiness probes

**Deliverables**:
- Full observability stack
- Resilient service communication
- Production-ready OpenShift manifests
- Documentation updated

---

## 📊 Database Migration Strategy

### Option A: Shared Database (Recommended for Initial Migration)

**Pros**:
- Simpler migration path
- No data synchronization issues
- Maintains referential integrity
- Easier rollback

**Cons**:
- Services still coupled at data layer
- Schema changes affect all services
- Single point of failure

**Implementation**:
- Keep single PostgreSQL instance
- Each service has its own Prisma schema file referencing only its tables
- Use database views or materialized views for cross-service data needs

```prisma
// user-service/prisma/schema.prisma
model User { ... }
model PasswordResetToken { ... }

// ticket-service/prisma/schema.prisma
model Ticket { ... }
model TicketComment { ... }

// audit-service/prisma/schema.prisma
model AuditEvent { ... }

// notification-service/prisma/schema.prisma
model EmailOutbox { ... }
```

### Option B: Database per Service (Future Phase)

**When to Consider**:
- Need for independent scaling
- Different database technologies per service
- Strict domain isolation required

**Migration Path**:
1. Start with shared database (Option A)
2. Introduce change data capture (Debezium)
3. Gradually migrate to separate databases
4. Implement saga patterns for distributed transactions

---

## 🛠️ Technology Stack

### Core Technologies

| Component | Current | Proposed |
|-----------|---------|----------|
| Backend Framework | NestJS | NestJS (per service) |
| Database | PostgreSQL | PostgreSQL (shared initially) |
| ORM | Prisma | Prisma (per service) |
| Message Broker | None | RabbitMQ |
| API Gateway | None | Kong / NGINX / Custom |
| Container Registry | OpenShift Internal | OpenShift Internal |

### New Dependencies

```json
// Per-service package.json additions
{
  "@nestjs/microservices": "^10.x",
  "amqplib": "^0.10.x",
  "amqp-connection-manager": "^4.x"
}
```

### NestJS Microservice Configuration

```typescript
// main.ts for each service
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

async function bootstrap() {
  // HTTP Server
  const app = await NestFactory.create(AppModule);
  
  // Microservice (RabbitMQ)
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: 'user-service-queue',
      queueOptions: { durable: true },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3000);
}
```

---

## 🔐 Security Considerations

### Service-to-Service Authentication

1. **JWT Propagation**: Forward user JWT to downstream services
2. **Service Tokens**: Use service account JWTs for internal calls
3. **mTLS**: Implement mutual TLS for service mesh (Istio in OpenShift)

### API Gateway Security

- Rate limiting per service
- Request validation
- JWT verification at gateway level
- IP whitelisting for admin endpoints

---

## 📈 Scalability Considerations

### Horizontal Scaling

Each service can scale independently based on load:

```yaml
# OpenShift HPA example
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ticket-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ticket-service
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Service Load Expectations

| Service | Expected Load | Scaling Priority |
|---------|--------------|------------------|
| User Service | Medium (auth operations) | Medium |
| Ticket Service | High (main business logic) | High |
| Notification Service | Medium (async) | Low |
| Audit Service | High (all events) | Medium |
| Admin Service | Low (admin operations) | Low |

---

## ⚠️ Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Distributed transaction failures | Data inconsistency | Implement saga pattern, use idempotency keys |
| Network latency | Degraded performance | Add caching, use async where possible |
| Service discovery failures | Service unavailability | Use Kubernetes DNS, implement retries |
| Message broker failure | Event loss | Enable message persistence, implement DLQ |
| Increased operational complexity | Higher maintenance cost | Invest in observability, documentation |

---

## ✅ Success Criteria

1. **Functional**: All existing features work as before
2. **Performance**: No degradation in response times (p95 < 200ms)
3. **Availability**: 99.9% uptime per service
4. **Scalability**: Each service can scale to 10 replicas
5. **Observability**: Full request tracing across services
6. **Deployment**: Independent deployment of each service
7. **Recovery**: Graceful degradation on service failure

---

## 📚 References

- [NestJS Microservices Documentation](https://docs.nestjs.com/microservices/basics)
- [RabbitMQ Best Practices](https://www.rabbitmq.com/best-practices.html)
- [12-Factor App Methodology](https://12factor.net/)
- [Microservices Patterns by Chris Richardson](https://microservices.io/patterns/)

---

## 📝 Next Steps

1. **Review this plan** with the team
2. **Prioritize services** based on business needs
3. **Set up RabbitMQ** in development environment
4. **Create shared library** with event definitions
5. **Start with User Service** extraction as proof of concept

---

*Document Version: 1.0*
*Last Updated: January 18, 2026*
*Author: Architecture Team*
