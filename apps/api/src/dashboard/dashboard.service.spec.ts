import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      onboarding: { findMany: jest.fn() },
      task: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  describe('getAlerts', () => {
    it('returns red severity for blocked/overdue tasks', async () => {
      prisma.onboarding.findMany.mockResolvedValue([
        {
          id: 'onb-1',
          partner: { id: 'p1', companyName: 'Blocked Corp' },
          phases: [
            {
              tasks: [
                { id: 't1', status: TaskStatus.BLOCKED, dueDate: null },
                { id: 't2', status: TaskStatus.ACTIVE, dueDate: null },
              ],
            },
          ],
        },
      ]);

      const alerts = await service.getAlerts();
      expect(alerts).toHaveLength(1);
      expect(alerts[0].severity).toBe('red');
      expect(alerts[0].blockedTasks).toBe(1);
    });

    it('returns orange severity for at-risk tasks (due within 3 days)', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      prisma.onboarding.findMany.mockResolvedValue([
        {
          id: 'onb-1',
          partner: { id: 'p1', companyName: 'AtRisk BV' },
          phases: [
            {
              tasks: [
                { id: 't1', status: TaskStatus.ACTIVE, dueDate: tomorrow },
              ],
            },
          ],
        },
      ]);

      const alerts = await service.getAlerts();
      expect(alerts[0].severity).toBe('orange');
      expect(alerts[0].atRiskTasks).toBe(1);
    });

    it('returns green severity when all tasks on track', async () => {
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);

      prisma.onboarding.findMany.mockResolvedValue([
        {
          id: 'onb-1',
          partner: { id: 'p1', companyName: 'Happy BV' },
          phases: [
            {
              tasks: [
                { id: 't1', status: TaskStatus.ACTIVE, dueDate: farFuture },
              ],
            },
          ],
        },
      ]);

      const alerts = await service.getAlerts();
      expect(alerts[0].severity).toBe('green');
    });

    it('sorts by severity: red first, then orange, then green', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const farFuture = new Date();
      farFuture.setDate(farFuture.getDate() + 30);

      prisma.onboarding.findMany.mockResolvedValue([
        {
          id: 'onb-1',
          partner: { id: 'p1', companyName: 'Green' },
          phases: [{ tasks: [{ id: 't1', status: TaskStatus.ACTIVE, dueDate: farFuture }] }],
        },
        {
          id: 'onb-2',
          partner: { id: 'p2', companyName: 'Red' },
          phases: [{ tasks: [{ id: 't2', status: TaskStatus.OVERDUE, dueDate: null }] }],
        },
        {
          id: 'onb-3',
          partner: { id: 'p3', companyName: 'Orange' },
          phases: [{ tasks: [{ id: 't3', status: TaskStatus.ACTIVE, dueDate: tomorrow }] }],
        },
      ]);

      const alerts = await service.getAlerts();
      expect(alerts[0].severity).toBe('red');
      expect(alerts[1].severity).toBe('orange');
      expect(alerts[2].severity).toBe('green');
    });

    it('calculates completion counts', async () => {
      prisma.onboarding.findMany.mockResolvedValue([
        {
          id: 'onb-1',
          partner: { id: 'p1', companyName: 'Progress BV' },
          phases: [
            {
              tasks: [
                { id: 't1', status: TaskStatus.COMPLETED, dueDate: null },
                { id: 't2', status: TaskStatus.COMPLETED, dueDate: null },
                { id: 't3', status: TaskStatus.ACTIVE, dueDate: null },
              ],
            },
          ],
        },
      ]);

      const alerts = await service.getAlerts();
      expect(alerts[0].totalTasks).toBe(3);
      expect(alerts[0].completedTasks).toBe(2);
    });
  });

  describe('getDrillDown', () => {
    it('returns tasks with blocking reasons', async () => {
      prisma.task.findMany.mockResolvedValue([
        {
          id: 't1',
          title: 'Blocked Task',
          status: TaskStatus.BLOCKED,
          ownerRole: 'IT',
          dueDate: null,
          assigneeId: null,
          predecessors: [
            { predecessorTask: { id: 'p1', title: 'Predecessor', status: TaskStatus.ACTIVE } },
          ],
          deliverableRequirements: [{ title: 'Missing Doc', fulfilled: false }],
        },
      ]);

      const details = await service.getDrillDown('onb-1');
      expect(details).toHaveLength(1);
      expect(details[0].blockingReason).toContain('Waiting for: Predecessor');
      expect(details[0].blockingReason).toContain('Missing deliverables: Missing Doc');
    });

    it('returns no blocking reason for active tasks', async () => {
      prisma.task.findMany.mockResolvedValue([
        {
          id: 't1',
          title: 'Active Task',
          status: TaskStatus.ACTIVE,
          ownerRole: 'BDM',
          dueDate: new Date(),
          assigneeId: 'user-1',
          predecessors: [],
          deliverableRequirements: [],
        },
      ]);

      const details = await service.getDrillDown('onb-1');
      expect(details[0].blockingReason).toBeUndefined();
    });
  });
});
