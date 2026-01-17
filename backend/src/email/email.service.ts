import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EmailService {
  constructor(private prisma: PrismaService) {}

  async queueEmail(to: string, subject: string, body: string): Promise<void> {
    await this.prisma.emailOutbox.create({
      data: {
        to,
        subject,
        body,
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
    const frontendUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const subject = 'Password Reset Request';
    const body = `
Hello,

You requested a password reset for your Helpdesk account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Best regards,
Helpdesk Support Team
    `.trim();

    await this.queueEmail(email, subject, body);
  }

  async sendWelcomeEmail(email: string, firstName?: string): Promise<void> {
    const subject = 'Welcome to Helpdesk';
    const greeting = firstName ? `Hello ${firstName}` : 'Hello';
    const body = `
${greeting},

Welcome to Helpdesk! Your account has been successfully created.

You can now log in and start creating support tickets.

Best regards,
Helpdesk Support Team
    `.trim();

    await this.queueEmail(email, subject, body);
  }
}
