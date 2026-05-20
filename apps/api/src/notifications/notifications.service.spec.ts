import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        updateMany: jest.fn().mockResolvedValue({ count: 3 }),
        count: jest.fn().mockResolvedValue(5),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('creates an in-app notification', async () => {
      await service.create({
        recipientId: 'user-1',
        type: NotificationType.TASK_ACTIVATED,
        title: 'Test',
        message: 'Test message',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'user-1',
          type: NotificationType.TASK_ACTIVATED,
          channel: NotificationChannel.IN_APP,
        }),
      });
    });
  });

  describe('getForUser', () => {
    it('returns notifications for user', async () => {
      await service.getForUser('user-1');
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { recipientId: 'user-1' } }),
      );
    });

    it('filters unread only when requested', async () => {
      await service.getForUser('user-1', { unreadOnly: true });
      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { recipientId: 'user-1', status: NotificationStatus.UNREAD },
        }),
      );
    });
  });

  describe('markRead', () => {
    it('marks notification as read', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'n1',
        recipientId: 'user-1',
      });

      await service.markRead('n1', 'user-1');
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { status: NotificationStatus.READ, readAt: expect.any(Date) },
      });
    });

    it('throws when notification belongs to different user', async () => {
      prisma.notification.findUnique.mockResolvedValue({
        id: 'n1',
        recipientId: 'other-user',
      });

      await expect(service.markRead('n1', 'user-1')).rejects.toThrow(NotFoundException);
    });

    it('throws when notification not found', async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.markRead('invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markAllRead', () => {
    it('marks all unread notifications as read', async () => {
      const result = await service.markAllRead('user-1');
      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: { recipientId: 'user-1', status: NotificationStatus.UNREAD },
        data: { status: NotificationStatus.READ, readAt: expect.any(Date) },
      });
    });
  });

  describe('getUnreadCount', () => {
    it('returns unread count', async () => {
      const count = await service.getUnreadCount('user-1');
      expect(count).toBe(5);
    });
  });

  describe('notifyTaskActivated', () => {
    it('creates notification for assignee', async () => {
      await service.notifyTaskActivated('t1', 'Test Task', 'user-1', 'IT');
      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          recipientId: 'user-1',
          type: NotificationType.TASK_ACTIVATED,
        }),
      });
    });

    it('skips when no assignee', async () => {
      await service.notifyTaskActivated('t1', 'Test Task', null, 'IT');
      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });
});
