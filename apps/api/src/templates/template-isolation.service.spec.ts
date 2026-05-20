import { Test, TestingModule } from '@nestjs/testing';
import { TemplateIsolationService } from './template-isolation.service';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationType, ContractType } from '@prisma/client';

describe('TemplateIsolationService', () => {
  let service: TemplateIsolationService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      template: {
        findFirst: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      onboarding: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplateIsolationService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TemplateIsolationService>(TemplateIsolationService);
  });

  describe('verifyIsolation', () => {
    it('returns active template and version history', async () => {
      prisma.template.findFirst.mockResolvedValue({ id: 't2', version: 2 });
      prisma.template.findMany.mockResolvedValue([
        { id: 't2', version: 2, active: true, createdAt: new Date() },
        { id: 't1', version: 1, active: false, createdAt: new Date() },
      ]);

      const result = await service.verifyIsolation(
        IntegrationType.FORMS_ERP,
        ContractType.EXPERT_PARTNER,
      );

      expect(result.activeTemplateVersion).toBe(2);
      expect(result.versionHistory).toHaveLength(2);
    });

    it('returns null when no active template', async () => {
      prisma.template.findFirst.mockResolvedValue(null);

      const result = await service.verifyIsolation(
        IntegrationType.API_INTEGRATION,
        ContractType.SOFTWARE_PARTNER,
      );

      expect(result.activeTemplateId).toBeNull();
    });
  });

  describe('getOnboardingTemplateSnapshot', () => {
    it('returns snapshot of onboarding template binding', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({
        id: 'onb-1',
        templateVersionId: 't1',
        template: { version: 1, active: false, blueprints: [{}, {}] },
      });

      const result = await service.getOnboardingTemplateSnapshot('onb-1');
      expect(result?.templateVersion).toBe(1);
      expect(result?.isCurrentActive).toBe(false);
      expect(result?.blueprintCount).toBe(2);
    });

    it('returns null for missing onboarding', async () => {
      prisma.onboarding.findUnique.mockResolvedValue(null);
      const result = await service.getOnboardingTemplateSnapshot('invalid');
      expect(result).toBeNull();
    });
  });
});
