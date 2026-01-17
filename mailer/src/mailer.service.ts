import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService implements OnModuleInit {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;
  private pollInterval: NodeJS.Timeout;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    this.createTransporter();
    this.startPolling();
  }

  private createTransporter() {
    const smtpHost = process.env.SMTP_HOST || 'mailhog';
    const smtpPort = parseInt(process.env.SMTP_PORT || '1025', 10);
    const smtpSecure = smtpPort === 465; // Use SSL/TLS for port 465

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: process.env.SMTP_USER
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    });

    this.logger.log(`SMTP configured: ${smtpHost}:${smtpPort} (secure: ${smtpSecure})`);
  }

  private startPolling() {
    const intervalMs = parseInt(process.env.POLL_INTERVAL_MS || '5000', 10);

    this.logger.log(`Starting email polling (interval: ${intervalMs}ms)`);

    this.pollInterval = setInterval(async () => {
      await this.processEmails();
    }, intervalMs);

    // Process immediately on start
    this.processEmails();
  }

  private async processEmails() {
    try {
      const emails = await this.prisma.emailOutbox.findMany({
        where: {
          sent: false,
          attempts: {
            lt: 5, // Max 5 attempts
          },
        },
        take: 10, // Process 10 at a time
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (emails.length > 0) {
        this.logger.log(`Found ${emails.length} emails to send`);
      }

      for (const email of emails) {
        await this.sendEmail(email.id, email.to, email.subject, email.body);
      }
    } catch (error) {
      this.logger.error('Error processing emails', error.stack);
    }
  }

  private async sendEmail(
    emailId: string,
    to: string,
    subject: string,
    body: string,
  ) {
    try {
      this.logger.log(`Sending email to ${to}: ${subject}`);

      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@helpdesk.local',
        to,
        subject,
        text: body,
      });

      await this.prisma.emailOutbox.update({
        where: { id: emailId },
        data: {
          sent: true,
          sentAt: new Date(),
          error: null,
        },
      });

      this.logger.log(`Email sent successfully to ${to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error.stack);

      await this.prisma.emailOutbox.update({
        where: { id: emailId },
        data: {
          attempts: {
            increment: 1,
          },
          error: error.message,
        },
      });
    }
  }

  onModuleDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}
