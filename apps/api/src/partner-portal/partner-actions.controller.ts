import { Controller, Post, Get, Param, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { DeliverableService } from '../tasks/deliverable.service';
import { CommentsService } from '../comments/comments.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';
import { UploadDeliverableDto } from '../tasks/dto/upload-deliverable.dto';
import { PartnerCommentDto } from './dto/partner-comment.dto';

@Controller('partner-portal')
@UseGuards(RolesGuard)
@Roles(UserRole.PARTNER)
export class PartnerActionsController {
  constructor(
    private deliverableService: DeliverableService,
    private commentsService: CommentsService,
  ) {}

  @Post('upload')
  async upload(@Body() dto: UploadDeliverableDto, @CurrentUser() user: SafeUser) {
    if (!user.partnerId) throw new ForbiddenException('No partner association');
    return this.deliverableService.uploadDeliverable(
      dto.requirementId,
      dto.fileName,
      dto.storageRef,
      user.id,
    );
  }

  @Get('tasks/:taskId/comments')
  async getComments(@Param('taskId') taskId: string, @CurrentUser() user: SafeUser) {
    return this.commentsService.getByTask(taskId, user.role, user.partnerId);
  }

  @Post('tasks/:taskId/comments')
  async postComment(
    @Param('taskId') taskId: string,
    @Body() dto: PartnerCommentDto,
    @CurrentUser() user: SafeUser,
  ) {
    return this.commentsService.create({
      taskId,
      authorId: user.id,
      authorRole: user.role,
      text: dto.text,
      visibilityScope: 'ALL',
      mentionUserIds: dto.mentionUserIds,
    });
  }
}
