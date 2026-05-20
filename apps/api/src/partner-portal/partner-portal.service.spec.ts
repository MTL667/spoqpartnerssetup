import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PartnerPortalService } from './partner-portal.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, PhaseStatus } from '@prisma/client';

describe('PartnerPortalService', () => {
  let service: PartnerPortalService;
  let prisma: any;

  const mockOnboarding = {
    id: 'onb-1',
    targetGoLiveDate: new Date('2026-09-01'),
    partner: { companyName: 'TechFlow BV' },
    phases: [
      {
        id: 'ph-1', name: 'Preparation', sequence: 1, status: PhaseStatus.COMPLETED,
        tasks: [
          { id: 't1', status: TaskStatus.COMPLETED },
          { id: 't2', status: TaskStatus.COMPLETED },
        ],
      },
      {
        id: 'ph-2', name: 'Technical Setup', sequence: 2, status: PhaseStatus.IN_PROGRESS,
        tasks: [
          { id: 't3', status: TaskStatus.COMPLETED },
          { id: 't4', status: TaskStatus.ACTIVE },
        ],
      },
      {
        id: 'ph-3', name: 'Content & Marketing', sequence: 3, status: PhaseStatus.NOT_STARTED,
        tasks: [{ id: 't5', status: TaskStatus.NOT_ACTIVE }],
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      onboarding: { findFirst: jest.fn() },
      deliverableRequirement: { findMany: jest.fn().mockResolvedValue([]) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PartnerPortalService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<PartnerPortalService>(PartnerPortalService);
  });

  describe('getProgress', () => {
    it('returns phase progress with percentages', async () => {
      prisma.onboarding.findFirst.mockResolvedValue(mockOnboarding);

      const result = await service.getProgress('p1');

      expect(result.companyName).toBe('TechFlow BV');
      expect(result.phases).toHaveLength(3);
      expect(result.phases[0].progressPercent).toBe(100);
      expect(result.phases[1].progressPercent).toBe(50);
      expect(result.phases[2].progressPercent).toBe(0);
      expect(result.overallProgress).toBe(60);
    });

    it('throws when no active onboarding', async () => {
      prisma.onboarding.findFirst.mockResolvedValue(null);
      await expect(service.getProgress('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getActionItems', () => {
    it('returns partner deliverable requirements', async () => {
      prisma.deliverableRequirement.findMany.mockResolvedValue([
        {
          id: 'dr-1',
          title: 'Partner Logo',
          fulfilled: false,
          task: { id: 't1', title: 'Marketing Assets', dueDate: new Date() },
        },
      ]);

      const items = await service.getActionItems('p1');
      expect(items).toHaveLength(1);
      expect(items[0].type).toBe('deliverable');
      expect(items[0].title).toBe('Partner Logo');
      expect(items[0].fulfilled).toBe(false);
    });

    it('returns empty list when no actions pending', async () => {
      const items = await service.getActionItems('p1');
      expect(items).toHaveLength(0);
    });
  });

  describe('getSchedule', () => {
    it('returns timeline with phases and tasks', async () => {
      prisma.onboarding.findFirst.mockResolvedValue({
        targetGoLiveDate: new Date('2026-09-01'),
        phases: [
          {
            name: 'Preparation', sequence: 1,
            tasks: [{ title: 'Task 1', dueDate: new Date(), status: TaskStatus.COMPLETED }],
          },
        ],
      });

      const result = await service.getSchedule('p1');
      expect(result.targetGoLiveDate).toBeDefined();
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].tasks[0].title).toBe('Task 1');
    });

    it('throws when no active onboarding', async () => {
      prisma.onboarding.findFirst.mockResolvedValue(null);
      await expect(service.getSchedule('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
