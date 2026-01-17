import { Controller, Patch, Param, Body, UseGuards, Get, Request } from '@nestjs/common';
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
    @Request() req,
  ) {
    console.log('[ADMIN] Updating user role:', { userId, newRole: dto.role, actorRole: req.user?.role, actorId: req.user?.userId });
    return this.adminService.updateUserRole(userId, dto.role);
  }

  @Get('agents')
  @Roles(UserRole.ADMIN, UserRole.AGENT)
  @ApiOperation({ summary: 'List all agents and admins' })
  async getAgents() {
    return this.adminService.getAgents();
  }

  @Get('users')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'List all users (ADMIN only)' })
  async getUsers() {
    return this.adminService.getUsers();
  }
}
