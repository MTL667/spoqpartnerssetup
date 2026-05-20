import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LifecycleService } from './lifecycle.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OnboardingStatus, PhaseStatus, TaskStatus } from '@prisma/client';

describe('LifecycleService', () => {
  let service: LifecycleService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      onboarding: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({ id: 'onb-1', status: OnboardingStatus.COMPLETED }),
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
      onboardingPhase: {
        update: jest.fn().mockResolvedValue({}),
      },
      partner: {
        update: jest.fn().mockResolvedValue({}),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LifecycleService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<LifecycleService>(LifecycleService);
  });

  describe('advancePhase', () => {
    it('starts first phase when none in progress', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({
        id: 'onb-1', status: OnboardingStatus.ACTIVE,
        phases: [
          { id: 'ph-1', name: 'Preparation', sequence: 1, status: PhaseStatus.NOT_STARTED, tasks: [] },
          { id: 'ph-2', name: 'Technical Setup', sequence: 2, status: PhaseStatus.NOT_STARTED, tasks: [] },
        ],
      });

      const result = await service.advancePhase('onb-1', 'actor-1');
      expect(result.phase).toBe('Preparation');
    });

    it('advances to next phase when all tasks completed', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({
        id: 'onb-1', status: OnboardingStatus.ACTIVE,
        phases: [
          { id: 'ph-1', name: 'Preparation', sequence: 1, status: PhaseStatus.IN_PROGRESS,
            tasks: [{ status: TaskStatus.COMPLETED }] },
          { id: 'ph-2', name: 'Technical Setup', sequence: 2, status: PhaseStatus.NOT_STARTED, tasks: [] },
        ],
      });

      const result = await service.advancePhase('onb-1', 'actor-1');
      expect(result.completedPhase).toBe('Preparation');
      expect(result.nextPhase).toBe('Technical Setup');
    });

    it('throws when tasks not completed', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({
        id: 'onb-1', status: OnboardingStatus.ACTIVE,
        phases: [
          { id: 'ph-1', name: 'Preparation', sequence: 1, status: PhaseStatus.IN_PROGRESS,
            tasks: [{ status: TaskStatus.ACTIVE }] },
        ],
      });

      await expect(service.advancePhase('onb-1', 'a')).rejects.toThrow(BadRequestException);
    });

    it('throws when onboarding not active', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({
        id: 'onb-1', status: OnboardingStatus.COMPLETED, phases: [],
      });

      await expect(service.advancePhase('onb-1', 'a')).rejects.toThrow(BadRequestException);
    });
  });

  describe('archiveOnboarding', () => {
    it('marks onboarding completed and partner active', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({
        id: 'onb-1', partnerId: 'p1', partner: { id: 'p1' },
      });

      await service.archiveOnboarding('onb-1', 'actor-1');

      expect(prisma.onboarding.update).toHaveBeenCalledWith({
        where: { id: 'onb-1' },
        data: { status: OnboardingStatus.COMPLETED },
      });
      expect(prisma.partner.update).toHaveBeenCalledWith({
        where: { id: 'p1' },
        data: { lifecycleStatus: 'ACTIVE' },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ONBOARDING_ARCHIVED' }),
      );
    });

    it('throws when onboarding not found', async () => {
      prisma.onboarding.findUnique.mockResolvedValue(null);
      await expect(service.archiveOnboarding('invalid', 'a')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listArchived', () => {
    it('returns paginated archived onboardings', async () => {
      prisma.onboarding.findMany.mockResolvedValue([{ id: 'onb-1' }]);
      prisma.onboarding.count.mockResolvedValue(1);

      const result = await service.listArchived({ page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });
});
