import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PartnerInvitationService } from './partner-invitation.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SafeUser } from '../auth/auth.service';
import { InvitePartnerDto } from './dto/invite-partner.dto';

@Controller('partner-portal')
export class PartnerInvitationController {
  constructor(private invitationService: PartnerInvitationService) {}

  @Post('invite/:partnerId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async invite(
    @Param('partnerId') partnerId: string,
    @Body() dto: InvitePartnerDto,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.invitationService.invitePartner(partnerId, dto.email, actor.id);
  }

  @Post('disable/:userId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.BDM, UserRole.ADMIN)
  async disable(
    @Param('userId') userId: string,
    @CurrentUser() actor: SafeUser,
  ) {
    return this.invitationService.disablePartnerAccount(userId, actor.id);
  }
}
