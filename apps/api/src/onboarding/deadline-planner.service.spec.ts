import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeadlinePlannerService } from './deadline-planner.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

describe('DeadlinePlannerService', () => {
  let service: DeadlinePlannerService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      onboarding: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeadlinePlannerService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<DeadlinePlannerService>(DeadlinePlannerService);
  });

  describe('setGoLiveDate', () => {
    it('sets go-live date, calculates deadlines, and logs audit event', async () => {
      const goLive = new Date('2026-09-01');
      prisma.onboarding.findUnique
        .mockResolvedValueOnce({ id: 'onb-1' })
        .mockResolvedValueOnce({ id: 'onb-1', targetGoLiveDate: goLive, phases: [] });

      await service.setGoLiveDate('onb-1', goLive, 'actor-1');

      expect(prisma.onboarding.update).toHaveBeenCalledWith({
        where: { id: 'onb-1' },
        data: { targetGoLiveDate: goLive },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GO_LIVE_DATE_SET' }),
      );
    });

    it('throws NotFoundException for invalid onboarding', async () => {
      prisma.onboarding.findUnique.mockResolvedValue(null);
      await expect(service.setGoLiveDate('invalid', new Date(), 'a')).rejects.toThrow(NotFoundException);
    });
  });

  describe('calculateDeadlines', () => {
    it('calculates due dates from offset', async () => {
      const goLive = new Date('2026-09-01');
      prisma.task.findMany.mockResolvedValue([
        { id: 'task-1', offsetDays: -30, dueDateOverride: false },
        { id: 'task-2', offsetDays: -7, dueDateOverride: false },
      ]);

      await service.calculateDeadlines('onb-1', goLive);

      expect(prisma.task.update).toHaveBeenCalledTimes(2);
      const call1 = prisma.task.update.mock.calls[0][0];
      expect(call1.data.dueDate).toEqual(new Date('2026-08-02'));
      const call2 = prisma.task.update.mock.calls[1][0];
      expect(call2.data.dueDate).toEqual(new Date('2026-08-25'));
    });

    it('skips tasks with dueDateOverride', async () => {
      prisma.task.findMany.mockResolvedValue([]);
      await service.calculateDeadlines('onb-1', new Date());
      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });

  describe('overrideTaskDueDate', () => {
    it('overrides due date and marks as override', async () => {
      prisma.task.findUnique
        .mockResolvedValueOnce({ id: 'task-1', dueDate: new Date('2026-08-01') })
        .mockResolvedValueOnce({ id: 'task-1', dueDate: new Date('2026-08-15'), dueDateOverride: true });

      const result = await service.overrideTaskDueDate('task-1', new Date('2026-08-15'), 'actor-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { dueDate: new Date('2026-08-15'), dueDateOverride: true },
      });
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'TASK_DUE_DATE_OVERRIDE' }),
      );
    });

    it('throws when task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(service.overrideTaskDueDate('invalid', new Date(), 'a')).rejects.toThrow(NotFoundException);
    });
  });

  describe('recalculate', () => {
    it('recalculates non-overridden task deadlines', async () => {
      prisma.onboarding.findUnique
        .mockResolvedValueOnce({ id: 'onb-1', targetGoLiveDate: new Date('2026-09-01') })
        .mockResolvedValueOnce({ id: 'onb-1', phases: [] });

      await service.recalculate('onb-1', 'actor-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DEADLINES_RECALCULATED' }),
      );
    });

    it('throws when no go-live date set', async () => {
      prisma.onboarding.findUnique.mockResolvedValue({ id: 'onb-1', targetGoLiveDate: null });
      await expect(service.recalculate('onb-1', 'actor-1')).rejects.toThrow(BadRequestException);
    });
  });
});
