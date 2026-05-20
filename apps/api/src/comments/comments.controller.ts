import { Controller, Get, Post, Delete, Param, Body } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('tasks/:taskId/comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Get()
  async list(@Param('taskId') taskId: string, @CurrentUser() user: SafeUser) {
    return this.commentsService.getByTask(taskId, user.role, user.partnerId);
  }

  @Post()
  async create(
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.commentsService.create({
      taskId,
      authorId: user.id,
      authorRole: user.role,
      text: dto.text,
      visibilityScope: dto.visibilityScope,
      mentionUserIds: dto.mentionUserIds,
    });
  }

  @Delete(':commentId')
  async delete(@Param('commentId') commentId: string, @CurrentUser() user: SafeUser) {
    return this.commentsService.delete(commentId, user.id);
  }
}
