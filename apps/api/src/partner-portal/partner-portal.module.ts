import { Module } from '@nestjs/common';
import { PartnerInvitationService } from './partner-invitation.service';
import { PartnerInvitationController } from './partner-invitation.controller';
import { PartnerPortalService } from './partner-portal.service';
import { PartnerPortalController } from './partner-portal.controller';
import { PartnerActionsController } from './partner-actions.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { TasksModule } from '../tasks/tasks.module';
import { CommentsModule } from '../comments/comments.module';

@Module({
  imports: [NotificationsModule, TasksModule, CommentsModule],
  controllers: [PartnerInvitationController, PartnerPortalController, PartnerActionsController],
  providers: [PartnerInvitationService, PartnerPortalService],
  exports: [PartnerInvitationService, PartnerPortalService],
})
export class PartnerPortalModule {}
