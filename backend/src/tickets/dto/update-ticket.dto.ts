import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @ApiProperty({
    description: 'Ticket status',
    enum: TicketStatus,
    example: 'IN_PROGRESS',
    required: false,
    enumName: 'TicketStatus'
  })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;
}
