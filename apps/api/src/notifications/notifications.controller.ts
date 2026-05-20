import { Controller, Get, Patch, Param, Post, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async list(@CurrentUser() user: SafeUser, @Query('unreadOnly') unreadOnly?: string) {
    return this.notificationsService.getForUser(user.id, {
      unreadOnly: unreadOnly === 'true',
    });
  }

  @Get('count')
  async unreadCount(@CurrentUser() user: SafeUser) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @CurrentUser() user: SafeUser) {
    return this.notificationsService.markRead(id, user.id);
  }

  @Post('mark-all-read')
  async markAllRead(@CurrentUser() user: SafeUser) {
    return this.notificationsService.markAllRead(user.id);
  }
}
