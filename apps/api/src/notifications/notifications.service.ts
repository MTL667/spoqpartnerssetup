import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

export interface CreateNotificationParams {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  channel?: NotificationChannel;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(params: CreateNotificationParams) {
    return this.prisma.notification.create({
      data: {
        recipientId: params.recipientId,
        type: params.type,
        title: params.title,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
        channel: params.channel ?? NotificationChannel.IN_APP,
      },
    });
  }

  async createBulk(notifications: CreateNotificationParams[]) {
    return Promise.all(notifications.map((n) => this.create(n)));
  }

  async getForUser(userId: string, options: { unreadOnly?: boolean } = {}) {
    const where: any = { recipientId: userId };
    if (options.unreadOnly) {
      where.status = NotificationStatus.UNREAD;
    }
    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.recipientId !== userId) throw new NotFoundException('Notification not found');

    return this.prisma.notification.update({
      where: { id },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientId: userId, status: NotificationStatus.UNREAD },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { recipientId: userId, status: NotificationStatus.UNREAD },
    });
  }

  async notifyTaskActivated(taskId: string, taskTitle: string, assigneeId: string | null, ownerRole: string) {
    if (!assigneeId) return;

    return this.create({
      recipientId: assigneeId,
      type: NotificationType.TASK_ACTIVATED,
      title: 'Taak geactiveerd',
      message: `De taak "${taskTitle}" is nu actief en wacht op actie.`,
      entityType: 'Task',
      entityId: taskId,
    });
  }

  async notifyDeadlineApproaching(taskId: string, taskTitle: string, assigneeId: string, dueDate: Date) {
    return this.create({
      recipientId: assigneeId,
      type: NotificationType.DEADLINE_APPROACHING,
      title: 'Deadline nadert',
      message: `De taak "${taskTitle}" heeft een deadline op ${dueDate.toLocaleDateString('nl-NL')}.`,
      entityType: 'Task',
      entityId: taskId,
    });
  }
}
