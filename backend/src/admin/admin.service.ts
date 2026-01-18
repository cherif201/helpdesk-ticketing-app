import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async deleteUser(userId: string, actorId: string) {
    // Prevent self-deletion
    if (userId === actorId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user (cascading will handle related records via Prisma schema)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    await this.audit.log({
      actorId,
      action: 'user.deleted',
      entityType: 'user',
      entityId: userId,
      metadata: { email: user.email, role: user.role },
    });

    return { message: 'User deleted successfully' };
  }

  async getDashboardStatistics() {
    const [totalTickets, openTickets, inProgressTickets, doneTickets] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { status: 'DONE' } }),
    ]);

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      doneTickets,
    };
  }
}
