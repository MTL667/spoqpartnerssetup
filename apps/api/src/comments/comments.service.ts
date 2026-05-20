import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CommentVisibility, NotificationType, UserRole } from '@prisma/client';

export interface CreateCommentParams {
  taskId: string;
  authorId: string;
  authorRole: UserRole;
  text: string;
  visibilityScope?: CommentVisibility;
  mentionUserIds?: string[];
}

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(params: CreateCommentParams) {
    const comment = await this.prisma.comment.create({
      data: {
        taskId: params.taskId,
        authorId: params.authorId,
        text: params.text,
        visibilityScope: params.visibilityScope ?? CommentVisibility.INTERNAL,
        mentions: params.mentionUserIds?.length
          ? {
              create: params.mentionUserIds.map((uid) => ({
                targetUserId: uid,
              })),
            }
          : undefined,
      },
      include: { mentions: true },
    });

    if (params.mentionUserIds?.length) {
      await this.notificationsService.createBulk(
        params.mentionUserIds.map((uid) => ({
          recipientId: uid,
          type: NotificationType.MENTION,
          title: 'Je bent getagd in een opmerking',
          message: `Nieuwe opmerking op taak: "${params.text.substring(0, 100)}"`,
          entityType: 'Comment',
          entityId: comment.id,
        })),
      );
    }

    return comment;
  }

  async getByTask(taskId: string, userRole: UserRole, partnerId?: string | null) {
    const where: any = { taskId };

    if (userRole === UserRole.PARTNER) {
      where.visibilityScope = CommentVisibility.ALL;
    }

    return this.prisma.comment.findMany({
      where,
      include: { mentions: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async delete(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId) throw new ForbiddenException('Cannot delete another user\'s comment');

    await this.prisma.mention.deleteMany({ where: { commentId } });
    return this.prisma.comment.delete({ where: { id: commentId } });
  }
}
