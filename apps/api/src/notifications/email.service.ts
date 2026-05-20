import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';

const MAX_RETRIES = 3;

export interface EmailJob {
  notificationId: string;
  recipientEmail: string;
  subject: string;
  body: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private prisma: PrismaService) {}

  async createEmailNotification(
    recipientId: string,
    recipientEmail: string,
    type: NotificationType,
    title: string,
    message: string,
    entityType?: string,
    entityId?: string,
  ) {
    return this.prisma.notification.create({
      data: {
        recipientId,
        channel: NotificationChannel.EMAIL,
        type,
        title,
        message,
        entityType,
        entityId,
        status: NotificationStatus.UNREAD,
      },
    });
  }

  async processEmailQueue(): Promise<{ sent: number; failed: number }> {
    const pendingEmails = await this.prisma.notification.findMany({
      where: {
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.UNREAD,
      },
      take: 50,
    });

    let sent = 0;
    let failed = 0;

    for (const notification of pendingEmails) {
      try {
        await this.sendEmail({
          notificationId: notification.id,
          recipientEmail: '', // resolved from user lookup in production
          subject: notification.title,
          body: notification.message,
        });

        await this.prisma.notification.update({
          where: { id: notification.id },
          data: { status: NotificationStatus.SENT, sentAt: new Date() },
        });
        sent++;
      } catch (error) {
        this.logger.error(`Failed to send email for notification ${notification.id}`, error);
        failed++;
        await this.handleFailure(notification.id);
      }
    }

    return { sent, failed };
  }

  async sendEmail(job: EmailJob): Promise<void> {
    // Outlook/SMTP integration point
    // In production: use @microsoft/microsoft-graph-client or nodemailer
    this.logger.log(`Sending email: ${job.subject} to ${job.recipientEmail}`);
  }

  private async handleFailure(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) return;

    const metadata = (notification as any).metadata;
    const retryCount = metadata?.retryCount ?? 0;

    if (retryCount >= MAX_RETRIES) {
      await this.prisma.notification.update({
        where: { id: notificationId },
        data: { status: NotificationStatus.FAILED },
      });
      this.logger.error(`Notification ${notificationId} permanently failed after ${MAX_RETRIES} retries`);
    }
  }

  async getFailedNotifications() {
    return this.prisma.notification.findMany({
      where: {
        channel: NotificationChannel.EMAIL,
        status: NotificationStatus.FAILED,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async retryFailed(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.UNREAD },
    });
  }
}
