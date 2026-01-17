import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Ticket title/summary',
    example: 'Cannot access dashboard',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'When I try to access the analytics dashboard, I get a 403 error. This started after the update.',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
