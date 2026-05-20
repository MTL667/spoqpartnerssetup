import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PartnerInvitationService } from './partner-invitation.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../notifications/email.service';
import { UserRole, UserStatus } from '@prisma/client';

describe('PartnerInvitationService', () => {
  let service: PartnerInvitationService;
  let prisma: any;
  let auditService: any;
  let emailService: any;

  beforeEach(async () => {
    prisma = {
      partner: { findUnique: jest.fn() },
      user: {
        findUnique: jest.fn(),
        create: jest.fn().mockResolvedValue({
          id: 'u1', email: 'partner@test.nl', role: UserRole.PARTNER, partnerId: 'p1',
        }),
        update: jest.fn().mockResolvedValue({ id: 'u1', status: UserStatus.DEACTIVATED }),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };
    emailService = { createEmailNotification: jest.fn().mockResolvedValue({ id: 'n1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerInvitationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: {} },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<PartnerInvitationService>(PartnerInvitationService);
  });

  describe('invitePartner', () => {
    it('creates partner user and sends email', async () => {
      prisma.partner.findUnique.mockResolvedValue({ id: 'p1', companyName: 'Test BV' });
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.invitePartner('p1', 'partner@test.nl', 'actor-1');

      expect(result.email).toBe('partner@test.nl');
      expect(result.role).toBe(UserRole.PARTNER);
      expect(result.tempPassword).toBeDefined();
      expect(emailService.createEmailNotification).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PARTNER_INVITED' }),
      );
    });

    it('throws when partner not found', async () => {
      prisma.partner.findUnique.mockResolvedValue(null);
      await expect(service.invitePartner('invalid', 'e@e.nl', 'a')).rejects.toThrow(NotFoundException);
    });

    it('throws when email already exists', async () => {
      prisma.partner.findUnique.mockResolvedValue({ id: 'p1' });
      prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(service.invitePartner('p1', 'dup@e.nl', 'a')).rejects.toThrow(BadRequestException);
    });
  });

  describe('disablePartnerAccount', () => {
    it('deactivates partner user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: UserRole.PARTNER });

      const result = await service.disablePartnerAccount('u1', 'actor-1');
      expect(result.status).toBe(UserStatus.DEACTIVATED);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PARTNER_ACCOUNT_DISABLED' }),
      );
    });

    it('throws when user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.disablePartnerAccount('invalid', 'a')).rejects.toThrow(NotFoundException);
    });

    it('throws when user is not a partner', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: UserRole.BDM });
      await expect(service.disablePartnerAccount('u1', 'a')).rejects.toThrow(BadRequestException);
    });
  });
});
