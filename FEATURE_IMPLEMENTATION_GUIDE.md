# Helpdesk App - Feature Implementation Guide

## Overview
This guide contains all changes needed to implement 5 standout features:
1. RBAC + Ticket Assignment
2. Comments + Internal Notes
3. Audit Timeline
4. Email Notifications
5. Health/Metrics

---

## PART 1: DATABASE MIGRATION

### Step 1: Update Prisma Schema
✅ Already completed in `backend/prisma/schema.prisma`

### Step 2: Create Migration
```bash
cd backend
npx prisma migrate dev --name add_rbac_comments_audit
```

This creates a new migration with:
- UserRole enum (USER, AGENT, ADMIN)
- User.role field
- Ticket.assignedToUserId field
- TicketComment table
- AuditEvent table

---

## PART 2: BACKEND IMPLEMENTATION

### A. Common Infrastructure

#### 1. Create `src/common/enums/user-role.enum.ts`
✅ Already created

#### 2. Create `src/common/decorators/roles.decorator.ts`
✅ Already created

#### 3. Create `src/common/guards/roles.guard.ts`
✅ Already created

### B. Audit Module

#### 1. Create `src/audit/audit.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
```

#### 2. Update `src/audit/audit.service.ts`
✅ Basic version created - needs PrismaService import:
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: any;
  }) {
    await this.prisma.auditEvent.create({
      data: {
        actorId: params.actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata || {},
      },
    });
  }

  async getTicketAudit(ticketId: string) {
    return this.prisma.auditEvent.findMany({
      where: {
        entityType: 'ticket',
        entityId: ticketId,
      },
      include: {
        actor: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
```

### C. Admin Module

#### 1. Create `src/admin/admin.controller.ts`
```typescript
import { Controller, Patch, Param, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { AdminService } from './admin.service';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Patch('users/:id/role')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update user role (ADMIN only)' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body() dto: { role: UserRole },
  ) {
    return this.adminService.updateUserRole(userId, dto.role);
  }

  @Get('agents')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'List all agents' })
  async getAgents() {
    return this.adminService.getAgents();
  }
}
```

#### 2. Create `src/admin/admin.service.ts`
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '../common/enums/user-role.enum';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async updateUserRole(userId: string, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    await this.audit.log({
      action: 'user.role_changed',
      entityType: 'user',
      entityId: userId,
      metadata: { oldRole: user.role, newRole: role },
    });

    return updated;
  }

  async getAgents() {
    return this.prisma.user.findMany({
      where: {
        role: {
          in: [UserRole.AGENT, UserRole.ADMIN],
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });
  }
}
```

#### 3. Create `src/admin/admin.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
```

### D. Update Tickets Module

#### Update `src/tickets/tickets.controller.ts`
Add these methods:

```typescript
import { Request } from 'express';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/enums/user-role.enum';

// Add RolesGuard to @UseGuards
@UseGuards(JwtAuthGuard, RolesGuard)

// Add new endpoints:

@Patch(':id/assign')
@Roles(UserRole.AGENT, UserRole.ADMIN)
@ApiOperation({ summary: 'Assign/unassign ticket to agent' })
async assignTicket(
  @Param('id') id: string,
  @Body() dto: { assignedToUserId: string | null },
  @Request() req,
) {
  return this.ticketsService.assignTicket(id, dto.assignedToUserId, req.user.userId);
}

@Get('inbox')
@Roles(UserRole.AGENT, UserRole.ADMIN)
@ApiOperation({ summary: 'Get tickets assigned to me' })
async getInbox(@Request() req) {
  return this.ticketsService.getInbox(req.user.userId);
}

@Get(':id/audit')
@Roles(UserRole.AGENT, UserRole.ADMIN)
@ApiOperation({ summary: 'Get ticket audit trail' })
async getTicketAudit(@Param('id') id: string) {
  return this.ticketsService.getTicketAudit(id);
}

@Post(':id/comments')
@ApiOperation({ summary: 'Add comment to ticket' })
async addComment(
  @Param('id') id: string,
  @Body() dto: { body: string; isInternal?: boolean },
  @Request() req,
) {
  return this.ticketsService.addComment(id, dto, req.user);
}

@Get(':id/comments')
@ApiOperation({ summary: 'Get ticket comments' })
async getComments(
  @Param('id') id: string,
  @Request() req,
) {
  return this.ticketsService.getComments(id, req.user);
}
```

#### Update `src/tickets/tickets.service.ts`
Add these methods:

```typescript
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '../common/enums/user-role.enum';

constructor(
  private prisma: PrismaService,
  private audit: AuditService,
  private email: EmailService,
) {}

// Update create method to include audit + notification
async create(dto: CreateTicketDto, userId: string) {
  const ticket = await this.prisma.ticket.create({
    data: {
      ...dto,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  // Audit log
  await this.audit.log({
    actorId: userId,
    action: 'ticket.created',
    entityType: 'ticket',
    entityId: ticket.id,
  });

  // Notify staff (if STAFF_NOTIFY_EMAIL is set)
  if (process.env.STAFF_NOTIFY_EMAIL) {
    await this.email.queueEmail(
      process.env.STAFF_NOTIFY_EMAIL,
      `New Ticket: ${ticket.title}`,
      `A new ticket has been created by ${ticket.user.email}.\n\nTitle: ${ticket.title}\nDescription: ${ticket.description}`,
    );
  }

  return ticket;
}

// Update findAll to implement RBAC
async findAll(user: any) {
  const where: any = {};

  if (user.role === UserRole.USER) {
    // Users see only their own tickets
    where.userId = user.userId;
  } else if (user.role === UserRole.AGENT) {
    // Agents see assigned tickets + unassigned
    where.OR = [
      { assignedToUserId: user.userId },
      { assignedToUserId: null },
    ];
  }
  // ADMIN sees all (no filter)

  return this.prisma.ticket.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

// Update update method to audit changes
async update(id: string, dto: UpdateTicketDto, user: any) {
  const ticket = await this.prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    throw new NotFoundException('Ticket not found');
  }

  // Authorization check
  if (user.role === UserRole.USER && ticket.userId !== user.userId) {
    throw new ForbiddenException('Cannot update other users tickets');
  }

  const oldStatus = ticket.status;
  const updated = await this.prisma.ticket.update({
    where: { id },
    data: dto,
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    },
  });

  // Audit status change
  if (dto.status && dto.status !== oldStatus) {
    await this.audit.log({
      actorId: user.userId,
      action: 'ticket.status_changed',
      entityType: 'ticket',
      entityId: id,
      metadata: { oldStatus, newStatus: dto.status },
    });

    // Notify ticket owner
    await this.email.queueEmail(
      updated.user.email,
      `Ticket Status Updated: ${updated.title}`,
      `Your ticket status has been changed from ${oldStatus} to ${dto.status}.`,
    );
  }

  return updated;
}

async assignTicket(ticketId: string, assignedToUserId: string | null, actorId: string) {
  const ticket = await this.prisma.ticket.update({
    where: { id: ticketId },
    data: { assignedToUserId },
    include: {
      user: true,
      assignedTo: true,
    },
  });

  await this.audit.log({
    actorId,
    action: assignedToUserId ? 'ticket.assigned' : 'ticket.unassigned',
    entityType: 'ticket',
    entityId: ticketId,
    metadata: { assignedToUserId },
  });

  // Notify ticket owner
  const message = assignedToUserId
    ? `Your ticket has been assigned to ${ticket.assignedTo?.email}.`
    : `Your ticket is no longer assigned.`;

  await this.email.queueEmail(
    ticket.user.email,
    `Ticket Assignment Update: ${ticket.title}`,
    message,
  );

  return ticket;
}

async getInbox(userId: string) {
  return this.prisma.ticket.findMany({
    where: { assignedToUserId: userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

async getTicketAudit(ticketId: string) {
  return this.audit.getTicketAudit(ticketId);
}

async addComment(ticketId: string, dto: { body: string; isInternal?: boolean }, user: any) {
  const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new NotFoundException('Ticket not found');
  }

  // Authorization: users can only comment on own tickets
  if (user.role === UserRole.USER && ticket.userId !== user.userId) {
    throw new ForbiddenException('Cannot comment on other users tickets');
  }

  // Only staff can add internal notes
  const isInternal = dto.isInternal && [UserRole.AGENT, UserRole.ADMIN].includes(user.role);

  const comment = await this.prisma.ticketComment.create({
    data: {
      ticketId,
      authorId: user.userId,
      body: dto.body,
      isInternal,
    },
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });

  return comment;
}

async getComments(ticketId: string, user: any) {
  const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) {
    throw new NotFoundException('Ticket not found');
  }

  // Authorization
  if (user.role === UserRole.USER && ticket.userId !== user.userId) {
    throw new ForbiddenException('Cannot view other users tickets');
  }

  const where: any = { ticketId };

  // Users can't see internal notes
  if (user.role === UserRole.USER) {
    where.isInternal = false;
  }

  return this.prisma.ticketComment.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });
}
```

#### Update `src/tickets/tickets.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [PrismaModule, AuditModule, EmailModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
```

### E. Health & Metrics Module

#### 1. Create `src/health/health.controller.ts`
```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  async health() {
    return this.healthService.check();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check endpoint' })
  async ready() {
    return this.healthService.ready();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics' })
  async metrics() {
    return this.healthService.getMetrics();
  }
}
```

#### 2. Create `src/health/health.service.ts`
```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as promClient from 'prom-client';

@Injectable()
export class HealthService {
  private register: promClient.Registry;
  private httpRequestDuration: promClient.Histogram;
  private httpRequestTotal: promClient.Counter;

  constructor(private prisma: PrismaService) {
    this.register = new promClient.Registry();
    
    // Default metrics
    promClient.collectDefaultMetrics({ register: this.register });

    // Custom metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });

    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [this.register],
    });
  }

  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  async ready() {
    try {
      // Check DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not_ready',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getMetrics() {
    return this.register.metrics();
  }

  recordRequest(method: string, route: string, statusCode: number, duration: number) {
    this.httpRequestTotal.inc({ method, route, status_code: statusCode });
    this.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }
}
```

#### 3. Create `src/health/health.module.ts`
```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
```

#### 4. Create Request ID Middleware `src/common/middleware/request-id.middleware.ts`
```typescript
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req['requestId'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  }
}
```

### F. Update App Module

Update `src/app.module.ts`:

```typescript
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { TicketsModule } from './tickets/tickets.module';
import { EmailModule } from './email/email.module';
import { AuditModule } from './audit/audit.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    TicketsModule,
    EmailModule,
    AuditModule,
    AdminModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

### G. Update Auth Module

Update `src/auth/auth.service.ts` signup method to log audit:

```typescript
import { AuditService } from '../audit/audit.service';

constructor(
  private prisma: PrismaService,
  private jwtService: JwtService,
  private emailService: EmailService,
  private audit: AuditService,
) {}

async signup(dto: SignupDto) {
  // ... existing code ...

  await this.audit.log({
    actorId: user.id,
    action: 'user.signup',
    entityType: 'user',
    entityId: user.id,
  });

  return { user: userResponse, token };
}

async forgotPassword(dto: ForgotPasswordDto) {
  // ... existing code ...
  
  if (user) {
    await this.audit.log({
      actorId: user.id,
      action: 'user.forgot_password_requested',
      entityType: 'user',
      entityId: user.id,
    });
  }

  return { message: 'If the email exists, a reset link has been sent' };
}

async resetPassword(dto: ResetPasswordDto) {
  // ... existing code ...

  await this.audit.log({
    actorId: token.userId,
    action: 'user.password_reset',
    entityType: 'user',
    entityId: token.userId,
  });

  return { message: 'Password reset successful' };
}
```

Update `src/auth/auth.module.ts`:
```typescript
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    AuditModule, // Add this
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  // ...
})
```

---

## PART 3: ENVIRONMENT VARIABLES

Add to `backend/.env`:
```env
# Existing vars...
DATABASE_URL=postgresql://helpdesk:helpdesk123@localhost:5433/helpdesk
JWT_SECRET=your-secret-key
FRONTEND_BASE_URL=http://localhost:8080

# New var for staff notifications
STAFF_NOTIFY_EMAIL=admin@helpdesk.local
```

Add to OpenShift `03-configmaps.yaml`:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
  namespace: helpdesk
data:
  FRONTEND_BASE_URL: "http://frontend-helpdesk.apps.example.com"
  PORT: "3000"
  STAFF_NOTIFY_EMAIL: "admin@helpdesk.local"
```

---

## PART 4: INSTALL DEPENDENCIES

```bash
cd backend
npm install prom-client uuid
npm install -D @types/uuid
```

---

## PART 5: FRONTEND IMPLEMENTATION

### A. Update API Service

Update `frontend/src/services/api.ts`:

```typescript
// Add after existing interfaces
export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  author: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
}

export interface AuditEvent {
  id: string;
  actorId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: any;
  createdAt: string;
  actor?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
}

// Update Ticket interface
export interface Ticket {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';
  assignedToUserId?: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
  assignedTo?: User;
}

// Add new methods to api object
export const api = {
  // ... existing methods ...

  // Admin endpoints
  async updateUserRole(userId: string, role: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  async getAgents(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/admin/agents`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Ticket assignment
  async assignTicket(ticketId: string, assignedToUserId: string | null): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/assign`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ assignedToUserId }),
    });
    return handleResponse(response);
  },

  async getInbox(): Promise<Ticket[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/inbox`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Comments
  async addComment(ticketId: string, body: string, isInternal: boolean = false): Promise<Comment> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({ body, isInternal }),
    });
    return handleResponse(response);
  },

  async getComments(ticketId: string): Promise<Comment[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/comments`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },

  // Audit
  async getTicketAudit(ticketId: string): Promise<AuditEvent[]> {
    const response = await fetch(`${API_BASE_URL}/tickets/${ticketId}/audit`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    });
    return handleResponse(response);
  },
};
```

### B. Add User Context

Create `frontend/src/context/AuthContext.tsx`:

```typescript
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

interface User {
  userId: string;
  email: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
}

interface AuthContextType {
  user: User | null;
  isAgent: boolean;
  isAdmin: boolean;
  isUser: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUser({
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role || 'USER',
        });
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
  }, []);

  const isAgent = user?.role === 'AGENT' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

  return (
    <AuthContext.Provider value={{ user, isAgent, isAdmin, isUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### C. Create Admin Pages

#### 1. Create `frontend/src/pages/AdminUsers.tsx`
```typescript
import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { api, User } from '../services/api';

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const data = await api.getAgents();
      setUsers(data);
    } catch (error: any) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.updateUserRole(userId, newRole);
      await loadAgents();
    } catch (error: any) {
      alert('Failed to update role: ' + error.message);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h2>User Management</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{user.role}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="form-control"
                    >
                      <option value="USER">USER</option>
                      <option value="AGENT">AGENT</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
```

#### 2. Create `frontend/src/pages/AgentInbox.tsx`
```typescript
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, Ticket } from '../services/api';

export function AgentInbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInbox();
  }, []);

  const loadInbox = async () => {
    setLoading(true);
    try {
      const data = await api.getInbox();
      setTickets(data);
    } catch (error: any) {
      console.error('Failed to load inbox', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container">
        <h2>My Inbox ({tickets.length} tickets)</h2>
        
        {loading ? (
          <p>Loading...</p>
        ) : tickets.length === 0 ? (
          <p>No tickets assigned to you</p>
        ) : (
          <div className="tickets-list">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="ticket-card">
                <div className="ticket-header">
                  <h3>{ticket.title}</h3>
                  <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                    {ticket.status}
                  </span>
                </div>
                <p>{ticket.description}</p>
                <div className="ticket-meta">
                  <span>From: {ticket.user?.email}</span>
                  <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </div>
                <Link to={`/tickets/${ticket.id}`} className="btn btn-sm">
                  View Details
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
```

#### 3. Create `frontend/src/pages/TicketDetails.tsx`
```typescript
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { api, Ticket, Comment, AuditEvent, User } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function TicketDetails() {
  const { id } = useParams<{ id: string }>();
  const { user, isAgent, isAdmin } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [agents, setAgents] = useState<User[]>([]);
  const [commentBody, setCommentBody] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      loadTicket();
      loadComments();
      if (isAgent) {
        loadAudit();
        loadAgents();
      }
    }
  }, [id, isAgent]);

  const loadTicket = async () => {
    const tickets = await api.getTickets();
    const found = tickets.find((t) => t.id === id);
    setTicket(found || null);
  };

  const loadComments = async () => {
    if (!id) return;
    const data = await api.getComments(id);
    setComments(data);
  };

  const loadAudit = async () => {
    if (!id) return;
    try {
      const data = await api.getTicketAudit(id);
      setAuditEvents(data);
    } catch (error) {
      console.error('Failed to load audit', error);
    }
  };

  const loadAgents = async () => {
    try {
      const data = await api.getAgents();
      setAgents(data);
    } catch (error) {
      console.error('Failed to load agents', error);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return;
    try {
      await api.updateTicket(id, { status: newStatus });
      await loadTicket();
      if (isAgent) await loadAudit();
    } catch (error: any) {
      alert('Failed to update status: ' + error.message);
    }
  };

  const handleAssignment = async (agentId: string | null) => {
    if (!id) return;
    try {
      await api.assignTicket(id, agentId);
      await loadTicket();
      if (isAgent) await loadAudit();
    } catch (error: any) {
      alert('Failed to assign ticket: ' + error.message);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentBody.trim()) return;

    setLoading(true);
    try {
      await api.addComment(id, commentBody, isInternal);
      setCommentBody('');
      setIsInternal(false);
      await loadComments();
      if (isAgent) await loadAudit();
    } catch (error: any) {
      alert('Failed to add comment: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ticket) {
    return <Layout><div className="container"><p>Loading...</p></div></Layout>;
  }

  return (
    <Layout>
      <div className="container">
        <div className="ticket-details">
          <div className="ticket-header">
            <h2>{ticket.title}</h2>
            <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
              {ticket.status}
            </span>
          </div>

          <div className="ticket-meta">
            <p><strong>From:</strong> {ticket.user?.email}</p>
            <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
            {ticket.assignedTo && (
              <p><strong>Assigned to:</strong> {ticket.assignedTo.email}</p>
            )}
          </div>

          <div className="ticket-description">
            <h3>Description</h3>
            <p>{ticket.description}</p>
          </div>

          {isAgent && (
            <div className="ticket-controls">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={ticket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="form-control"
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="DONE">DONE</option>
                </select>
              </div>

              <div className="form-group">
                <label>Assign to</label>
                <select
                  value={ticket.assignedToUserId || ''}
                  onChange={(e) => handleAssignment(e.target.value || null)}
                  className="form-control"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.email} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="comments-section">
            <h3>Comments</h3>
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`comment ${comment.isInternal ? 'internal-comment' : ''}`}
              >
                <div className="comment-header">
                  <strong>{comment.author.email}</strong>
                  {comment.isInternal && <span className="badge">Internal</span>}
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p>{comment.body}</p>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="comment-form">
              <textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Add a comment..."
                className="form-control"
                rows={4}
              />
              {isAgent && (
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isInternal}
                    onChange={(e) => setIsInternal(e.target.checked)}
                  />
                  Internal note (staff only)
                </label>
              )}
              <button type="submit" className="btn" disabled={loading}>
                {loading ? 'Adding...' : 'Add Comment'}
              </button>
            </form>
          </div>

          {isAgent && auditEvents.length > 0 && (
            <div className="audit-section">
              <h3>Timeline</h3>
              <div className="timeline">
                {auditEvents.map((event) => (
                  <div key={event.id} className="timeline-item">
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <strong>{event.action}</strong>
                      {event.actor && <span> by {event.actor.email}</span>}
                      <div className="timeline-date">
                        {new Date(event.createdAt).toLocaleString()}
                      </div>
                      {event.metadata && (
                        <pre className="metadata">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
```

### D. Update Routes

Update `frontend/src/main.tsx`:

```typescript
import { AuthProvider } from './context/AuthContext';
import { AgentInbox } from './pages/AgentInbox';
import { AdminUsers } from './pages/AdminUsers';
import { TicketDetails } from './pages/TicketDetails';

// Wrap App with AuthProvider
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <Tickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tickets/:id"
            element={
              <ProtectedRoute>
                <TicketDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inbox"
            element={
              <ProtectedRoute>
                <AgentInbox />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### E. Update Layout Navigation

Update `frontend/src/components/Layout.tsx`:

```typescript
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAgent, isAdmin } = useAuth();

  // ... existing code ...

  return (
    <div>
      <nav className="nav">
        <div className="nav-content">
          <h1>Helpdesk</h1>
          <div className="nav-links">
            <Link to="/tickets">Tickets</Link>
            {isAgent && <Link to="/inbox">My Inbox</Link>}
            {isAdmin && <Link to="/admin/users">Manage Users</Link>}
            <Link to="/change-password">Change Password</Link>
            <button onClick={handleLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
```

### F. Add CSS Styles

Add to `frontend/src/index.css`:

```css
/* Ticket Details */
.ticket-details {
  max-width: 900px;
  margin: 0 auto;
}

.ticket-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin: 2rem 0;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 4px;
}

/* Comments */
.comments-section {
  margin-top: 2rem;
}

.comment {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.comment.internal-comment {
  background: #fff3cd;
  border-left: 4px solid #ffc107;
}

.comment-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.comment-date {
  color: #6c757d;
  margin-left: auto;
}

.badge {
  background: #ffc107;
  color: #000;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: bold;
}

.comment-form {
  margin-top: 2rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 1rem 0;
}

/* Timeline */
.timeline {
  margin-top: 1rem;
}

.timeline-item {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  position: relative;
}

.timeline-item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 20px;
  bottom: -20px;
  width: 2px;
  background: #dee2e6;
}

.timeline-marker {
  width: 16px;
  height: 16px;
  background: #0d6efd;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
  z-index: 1;
}

.timeline-content {
  flex: 1;
}

.timeline-date {
  font-size: 0.85rem;
  color: #6c757d;
  margin-top: 0.25rem;
}

.metadata {
  background: #f8f9fa;
  padding: 0.5rem;
  border-radius: 3px;
  font-size: 0.85rem;
  margin-top: 0.5rem;
  overflow-x: auto;
}

/* Table */
.table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #dee2e6;
}

.table th {
  background: #f8f9fa;
  font-weight: 600;
}

.form-control {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
}
```

---

## PART 6: DEPLOYMENT

### Step 1: Run Migration
```bash
cd backend
npx prisma migrate dev --name add_rbac_comments_audit
npx prisma generate
```

### Step 2: Install Dependencies
```bash
npm install prom-client uuid jwt-decode
npm install -D @types/uuid
```

### Step 3: Test Locally
```bash
# Backend
cd backend
npm run start:dev

# Frontend
cd frontend
npm run dev
```

### Step 4: Build for OpenShift
```bash
# From project root
oc start-build api -n chrif0709-dev --from-dir=./backend --follow
oc start-build frontend -n chrif0709-dev --from-dir=./frontend --follow
```

### Step 5: Update ConfigMap
```bash
oc patch configmap api-config -n chrif0709-dev -p '{"data":{"STAFF_NOTIFY_EMAIL":"admin@helpdesk.local"}}'
```

### Step 6: Restart Services
```bash
oc rollout latest dc/api -n chrif0709-dev
oc rollout latest dc/frontend -n chrif0709-dev
```

---

## TESTING CHECKLIST

- [ ] Create a test user and promote to AGENT role via direct DB or API
- [ ] Login as AGENT and verify inbox access
- [ ] Assign a ticket to yourself
- [ ] Add public and internal comments
- [ ] Change ticket status and verify email notifications
- [ ] Login as ADMIN and verify user management page
- [ ] Promote a user to AGENT role
- [ ] View audit timeline on a ticket
- [ ] Test /health and /ready endpoints
- [ ] Verify metrics at /metrics

---

## SUMMARY

This implementation adds:

✅ **RBAC** - 3 roles (USER, AGENT, ADMIN) with proper authorization
✅ **Ticket Assignment** - Assign tickets to agents
✅ **Comments** - Public & internal notes
✅ **Audit Trail** - Complete activity log
✅ **Email Notifications** - Status changes, assignments
✅ **Health & Metrics** - Prometheus-compatible metrics
✅ **Request Tracking** - x-request-id correlation

All changes maintain existing functionality and follow the project structure.
