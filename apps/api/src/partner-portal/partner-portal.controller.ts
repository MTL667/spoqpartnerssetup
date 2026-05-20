import { Controller, Get, UseGuards, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PartnerPortalService } from './partner-portal.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';

@Controller('partner-portal')
@UseGuards(RolesGuard)
@Roles(UserRole.PARTNER)
export class PartnerPortalController {
  constructor(private portalService: PartnerPortalService) {}

  @Get('progress')
  async getProgress(@CurrentUser() user: SafeUser) {
    if (!user.partnerId) throw new ForbiddenException('No partner association');
    return this.portalService.getProgress(user.partnerId);
  }

  @Get('actions')
  async getActions(@CurrentUser() user: SafeUser) {
    if (!user.partnerId) throw new ForbiddenException('No partner association');
    return this.portalService.getActionItems(user.partnerId);
  }

  @Get('schedule')
  async getSchedule(@CurrentUser() user: SafeUser) {
    if (!user.partnerId) throw new ForbiddenException('No partner association');
    return this.portalService.getSchedule(user.partnerId);
  }
}
