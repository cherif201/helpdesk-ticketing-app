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
