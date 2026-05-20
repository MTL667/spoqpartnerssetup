import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { UserRole, UserStatus, NotificationType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class PartnerInvitationService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async invitePartner(
    partnerId: string,
    email: string,
    actorId: string,
  ) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('User with this email already exists');

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const passwordHash = await bcrypt.hash(tempPassword, 12);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.PARTNER,
        partnerId,
        locale: 'nl',
      },
    });

    await this.emailService.createEmailNotification(
      user.id,
      email,
      NotificationType.TASK_ACTIVATED,
      'Welkom bij SPOQ Partner Portal',
      `U bent uitgenodigd voor het partnerportaal van ${partner.companyName}. Uw tijdelijke wachtwoord is: ${tempPassword}`,
    );

    await this.auditService.log({
      actorId,
      action: 'PARTNER_INVITED',
      entityType: 'User',
      entityId: user.id,
      metadata: { partnerId, email },
    });

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      partnerId: user.partnerId,
      tempPassword,
    };
  }

  async disablePartnerAccount(userId: string, actorId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.PARTNER) throw new BadRequestException('User is not a partner');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.DEACTIVATED },
    });

    await this.auditService.log({
      actorId,
      action: 'PARTNER_ACCOUNT_DISABLED',
      entityType: 'User',
      entityId: userId,
    });

    return { id: userId, status: UserStatus.DEACTIVATED };
  }
}
