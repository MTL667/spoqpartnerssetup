import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommentVisibility, UserRole } from '@prisma/client';

describe('CommentsService', () => {
  let service: CommentsService;
  let prisma: any;
  let notificationsService: any;

  beforeEach(async () => {
    prisma = {
      comment: {
        create: jest.fn().mockResolvedValue({ id: 'c1', mentions: [] }),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
      mention: {
        deleteMany: jest.fn().mockResolvedValue({}),
      },
    };

    notificationsService = {
      createBulk: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('create', () => {
    it('creates a comment with INTERNAL visibility by default', async () => {
      await service.create({
        taskId: 't1',
        authorId: 'user-1',
        authorRole: UserRole.BDM,
        text: 'Test comment',
      });

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          visibilityScope: CommentVisibility.INTERNAL,
        }),
        include: { mentions: true },
      });
    });

    it('creates mentions and sends notifications', async () => {
      prisma.comment.create.mockResolvedValue({
        id: 'c1',
        mentions: [{ targetUserId: 'user-2' }],
      });

      await service.create({
        taskId: 't1',
        authorId: 'user-1',
        authorRole: UserRole.BDM,
        text: 'Hey @user',
        mentionUserIds: ['user-2'],
      });

      expect(notificationsService.createBulk).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ recipientId: 'user-2' }),
        ]),
      );
    });

    it('does not send notifications when no mentions', async () => {
      await service.create({
        taskId: 't1',
        authorId: 'user-1',
        authorRole: UserRole.BDM,
        text: 'Plain comment',
      });

      expect(notificationsService.createBulk).not.toHaveBeenCalled();
    });
  });

  describe('getByTask', () => {
    it('returns all comments for internal users', async () => {
      await service.getByTask('t1', UserRole.BDM);
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { taskId: 't1' } }),
      );
    });

    it('filters to ALL visibility for partner role', async () => {
      await service.getByTask('t1', UserRole.PARTNER, 'p1');
      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { taskId: 't1', visibilityScope: CommentVisibility.ALL },
        }),
      );
    });
  });

  describe('delete', () => {
    it('deletes own comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', authorId: 'user-1' });

      await service.delete('c1', 'user-1');
      expect(prisma.mention.deleteMany).toHaveBeenCalledWith({ where: { commentId: 'c1' } });
      expect(prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    });

    it('throws ForbiddenException for another user\'s comment', async () => {
      prisma.comment.findUnique.mockResolvedValue({ id: 'c1', authorId: 'user-2' });

      await expect(service.delete('c1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException for missing comment', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.delete('invalid', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });
});
