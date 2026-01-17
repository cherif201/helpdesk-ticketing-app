import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@ApiTags('tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new ticket',
    description: 'Create a support ticket for the authenticated user. Initial status is OPEN.'
  })
  @ApiResponse({ status: 201, description: 'Ticket successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid.' })
  create(@Request() req, @Body() dto: CreateTicketDto) {
    return this.ticketsService.create(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user tickets',
    description: 'Retrieve all tickets belonging to the authenticated user. Admins can use ?showAll=true to see all tickets. Sorted by creation date (newest first).'
  })
  @ApiResponse({ status: 200, description: 'Returns array of user tickets.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid.' })
  findAll(@Request() req, @Query('showAll') showAll?: string) {
    return this.ticketsService.findAllByUser(req.user.userId, req.user, showAll === 'true');
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update ticket status',
    description: 'Update the status of a ticket. User can only update their own tickets. Valid statuses: OPEN, IN_PROGRESS, DONE.'
  })
  @ApiParam({ name: 'id', description: 'Ticket UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'Ticket successfully updated.' })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized - JWT token missing or invalid.' })
  @ApiResponse({ status: 403, description: 'Forbidden - User can only update their own tickets.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  update(@Param('id') id: string, @Request() req, @Body() dto: UpdateTicketDto) {
    return this.ticketsService.update(id, req.user.userId, dto, req.user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Assign/unassign ticket to user (Admin only)' })
  @ApiResponse({ status: 200, description: 'Ticket assignment updated.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async assignTicket(
    @Param('id') id: string,
    @Body() dto: { assignedToUserId: string | null },
    @Request() req,
  ) {
    return this.ticketsService.assignTicket(id, dto.assignedToUserId, req.user.userId);
  }

  @Get('inbox')
  @ApiOperation({ summary: 'Get tickets assigned to me or created by me' })
  @ApiResponse({ status: 200, description: 'Returns array of assigned or created tickets.' })
  async getInbox(@Request() req) {
    return this.ticketsService.getInbox(req.user.userId);
  }

  @Get(':id/audit')
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get ticket audit trail' })
  @ApiResponse({ status: 200, description: 'Returns audit events for the ticket.' })
  async getTicketAudit(@Param('id') id: string) {
    return this.ticketsService.getTicketAudit(id);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Add comment to ticket' })
  @ApiResponse({ status: 201, description: 'Comment added successfully.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: { body: string; isInternal?: boolean },
    @Request() req,
  ) {
    return this.ticketsService.addComment(id, dto, req.user);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get ticket comments' })
  @ApiResponse({ status: 200, description: 'Returns array of comments.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async getComments(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.ticketsService.getComments(id, req.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a ticket' })
  @ApiResponse({ status: 200, description: 'Ticket successfully deleted.' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions.' })
  @ApiResponse({ status: 404, description: 'Ticket not found.' })
  async deleteTicket(
    @Param('id') id: string,
    @Request() req,
  ) {
    return this.ticketsService.deleteTicket(id, req.user.userId, req.user.role);
  }
}
