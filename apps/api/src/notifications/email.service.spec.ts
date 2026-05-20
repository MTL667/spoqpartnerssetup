import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationChannel, NotificationStatus, NotificationType } from '@prisma/client';

describe('EmailService', () => {
  let service: EmailService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      notification: {
        create: jest.fn().mockResolvedValue({ id: 'n1' }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  describe('createEmailNotification', () => {
    it('creates a notification with EMAIL channel', async () => {
      await service.createEmailNotification(
        'user-1', 'user@test.nl',
        NotificationType.TASK_ACTIVATED,
        'Subject', 'Body',
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          channel: NotificationChannel.EMAIL,
          recipientId: 'user-1',
        }),
      });
    });
  });

  describe('processEmailQueue', () => {
    it('processes pending email notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([
        { id: 'n1', title: 'Test', message: 'Body', status: NotificationStatus.UNREAD },
      ]);

      jest.spyOn(service, 'sendEmail').mockResolvedValue(undefined);

      const result = await service.processEmailQueue();
      expect(result.sent).toBe(1);
      expect(result.failed).toBe(0);
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { status: NotificationStatus.SENT, sentAt: expect.any(Date) },
      });
    });

    it('handles send failures gracefully', async () => {
      prisma.notification.findMany.mockResolvedValue([
        { id: 'n1', title: 'Test', message: 'Body', status: NotificationStatus.UNREAD },
      ]);

      jest.spyOn(service, 'sendEmail').mockRejectedValue(new Error('SMTP error'));
      prisma.notification.findUnique.mockResolvedValue({ id: 'n1', metadata: null });

      const result = await service.processEmailQueue();
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('returns zero counts when queue is empty', async () => {
      prisma.notification.findMany.mockResolvedValue([]);
      const result = await service.processEmailQueue();
      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('getFailedNotifications', () => {
    it('returns failed email notifications', async () => {
      prisma.notification.findMany.mockResolvedValue([{ id: 'n1', status: NotificationStatus.FAILED }]);
      const result = await service.getFailedNotifications();
      expect(result).toHaveLength(1);
    });
  });

  describe('retryFailed', () => {
    it('resets status to UNREAD for retry', async () => {
      await service.retryFailed('n1');
      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id: 'n1' },
        data: { status: NotificationStatus.UNREAD },
      });
    });
  });
});
