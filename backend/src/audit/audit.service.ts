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
