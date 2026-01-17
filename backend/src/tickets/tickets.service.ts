import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private email: EmailService,
  ) {}

  async create(userId: string, dto: CreateTicketDto) {
    const ticket = await this.prisma.ticket.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
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

  async findAllByUser(userId: string, user?: any, showAll?: boolean) {
    const where: any = {};

    if (user?.role === UserRole.ADMIN && !showAll) {
      // Admin with filter OFF: show only their created tickets
      where.userId = userId;
    } else if (user?.role === UserRole.AGENT) {
      // Agents always see only tickets they created
      where.userId = userId;
    }
    // ADMIN with showAll=true sees all tickets (no filter)

    return this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
    });
  }

  async update(ticketId: string, userId: string, dto: UpdateTicketDto, user?: any) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // No authorization check needed - admins can update any, agents can update any

    const oldStatus = ticket.status;
    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: dto,
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
    });

    // Audit status change
    if (dto.status && dto.status !== oldStatus) {
      await this.audit.log({
        actorId: userId,
        action: 'ticket.status_changed',
        entityType: 'ticket',
        entityId: ticketId,
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
      where: {
        OR: [
          { assignedToUserId: userId },
          { userId: userId },
        ],
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

    // Authorization: agents and admins can comment on any ticket
    // No checks needed with only AGENT and ADMIN roles

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

    // All agents and admins can view comments
    const where: any = { ticketId };

    // No internal note filtering needed - agents/admins see all

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

  async deleteTicket(ticketId: string, userId: string, userRole: UserRole) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Authorization: ADMIN can delete any ticket, AGENT can only delete tickets they created
    if (userRole === UserRole.AGENT && ticket.userId !== userId) {
      throw new ForbiddenException('Agents can only delete tickets they created');
    }

    // Delete associated comments first
    await this.prisma.ticketComment.deleteMany({ where: { ticketId } });

    // Delete the ticket
    await this.prisma.ticket.delete({ where: { id: ticketId } });

    // Audit log
    await this.audit.log({
      actorId: userId,
      action: 'ticket.deleted',
      entityType: 'ticket',
      entityId: ticketId,
    });

    return { message: 'Ticket deleted successfully' };
  }
}
