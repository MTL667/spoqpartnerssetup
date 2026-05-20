import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { PartnersService } from '../partners/partners.service';
import { TemplatesService } from '../templates/templates.service';
import { AuditService } from '../audit/audit.service';
import { TaskGeneratorService } from '../tasks/task-generator.service';
import { IntegrationType, ContractType } from '@prisma/client';

describe('OnboardingService', () => {
  let service: OnboardingService;
  let prisma: any;
  let partnersService: Partial<PartnersService>;
  let templatesService: Partial<TemplatesService>;
  let auditService: Partial<AuditService>;
  let taskGenerator: Partial<TaskGeneratorService>;

  const mockTemplate = {
    id: 'tmpl-1',
    integrationType: IntegrationType.FORMS_ERP,
    contractType: ContractType.EXPERT_PARTNER,
    version: 1,
    active: true,
  };

  const mockPartner = {
    id: 'partner-1',
    companyName: 'TechFlow BV',
    primaryContactEmail: 'info@techflow.be',
    lifecycleStatus: 'ONBOARDING',
  };

  const mockOnboarding = {
    id: 'onb-1',
    partnerId: 'partner-1',
    integrationType: IntegrationType.FORMS_ERP,
    contractType: ContractType.EXPERT_PARTNER,
    templateVersionId: 'tmpl-1',
    status: 'ACTIVE',
    partner: mockPartner,
    phases: [
      { id: 'p1', name: 'Preparation', sequence: 1, status: 'NOT_STARTED' },
      { id: 'p2', name: 'Technical Setup', sequence: 2, status: 'NOT_STARTED' },
      { id: 'p3', name: 'Content & Marketing', sequence: 3, status: 'NOT_STARTED' },
      { id: 'p4', name: 'Go-to-Market', sequence: 4, status: 'NOT_STARTED' },
      { id: 'p5', name: 'Post-Launch', sequence: 5, status: 'NOT_STARTED' },
    ],
  };

  beforeEach(async () => {
    prisma = {
      onboarding: {
        create: jest.fn().mockResolvedValue(mockOnboarding),
        findUnique: jest.fn().mockResolvedValue(mockOnboarding),
        findMany: jest.fn().mockResolvedValue([mockOnboarding]),
      },
    } as any;

    partnersService = {
      create: jest.fn().mockResolvedValue(mockPartner),
    };

    templatesService = {
      findActiveTemplate: jest.fn().mockResolvedValue(mockTemplate),
    };

    auditService = {
      log: jest.fn().mockResolvedValue(undefined),
    };

    taskGenerator = {
      generateTasksForOnboarding: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: PrismaService, useValue: prisma },
        { provide: PartnersService, useValue: partnersService },
        { provide: TemplatesService, useValue: templatesService },
        { provide: AuditService, useValue: auditService },
        { provide: TaskGeneratorService, useValue: taskGenerator },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('createOnboarding', () => {
    it('creates partner, resolves template, and creates onboarding with 5 phases', async () => {
      const result = await service.createOnboarding({
        companyName: 'TechFlow BV',
        contactEmail: 'info@techflow.be',
        integrationType: IntegrationType.FORMS_ERP,
        contractType: ContractType.EXPERT_PARTNER,
        actorId: 'actor-1',
      });

      expect(templatesService.findActiveTemplate).toHaveBeenCalledWith(
        IntegrationType.FORMS_ERP,
        ContractType.EXPERT_PARTNER,
      );
      expect(partnersService.create).toHaveBeenCalledWith('TechFlow BV', 'info@techflow.be');
      expect(result!.phases).toHaveLength(5);
      expect(result!.phases[0].name).toBe('Preparation');
      expect(result!.phases[4].name).toBe('Post-Launch');
    });

    it('logs PARTNER_CREATED and ONBOARDING_CREATED audit events', async () => {
      await service.createOnboarding({
        companyName: 'Test BV',
        contactEmail: 'test@test.nl',
        integrationType: IntegrationType.PARTNER_PORTAL,
        contractType: ContractType.SOFTWARE_PARTNER,
        actorId: 'actor-1',
      });

      expect(auditService.log).toHaveBeenCalledTimes(2);
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'PARTNER_CREATED' }),
      );
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ONBOARDING_CREATED' }),
      );
    });
  });

  describe('findById', () => {
    it('returns onboarding with partner and phases', async () => {
      const result = await service.findById('onb-1');
      expect(result).toBeDefined();
      expect(prisma.onboarding.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'onb-1' } }),
      );
    });
  });

  describe('list', () => {
    it('returns onboardings', async () => {
      const result = await service.list();
      expect(result).toHaveLength(1);
    });
  });
});
