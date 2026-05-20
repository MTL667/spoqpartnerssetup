import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { TaskStatusEngineService } from './task-status-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

describe('TaskStatusEngineService', () => {
  let service: TaskStatusEngineService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      task: {
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation(({ where }) =>
          Promise.resolve({ id: where.id, status: TaskStatus.COMPLETED }),
        ),
        findMany: jest.fn().mockResolvedValue([]),
      },
      taskDependency: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskStatusEngineService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TaskStatusEngineService>(TaskStatusEngineService);
  });

  describe('transitionTask', () => {
    it('allows NOT_ACTIVE -> ACTIVE', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1', status: TaskStatus.NOT_ACTIVE, predecessors: [],
      });
      prisma.task.update.mockResolvedValue({ id: 't1', status: TaskStatus.ACTIVE });

      const result = await service.transitionTask('t1', TaskStatus.ACTIVE);
      expect(result.task.status).toBe(TaskStatus.ACTIVE);
    });

    it('allows ACTIVE -> COMPLETED and evaluates successors', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1', status: TaskStatus.ACTIVE, predecessors: [],
      });

      const result = await service.transitionTask('t1', TaskStatus.COMPLETED);
      expect(prisma.taskDependency.findMany).toHaveBeenCalled();
    });

    it('rejects invalid transition COMPLETED -> ACTIVE', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1', status: TaskStatus.COMPLETED, predecessors: [],
      });

      await expect(
        service.transitionTask('t1', TaskStatus.ACTIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects NOT_ACTIVE -> COMPLETED (must go through ACTIVE)', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1', status: TaskStatus.NOT_ACTIVE, predecessors: [],
      });

      await expect(
        service.transitionTask('t1', TaskStatus.COMPLETED),
      ).rejects.toThrow(BadRequestException);
    });

    it('blocks activation when predecessors not complete', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't2',
        status: TaskStatus.BLOCKED,
        predecessors: [
          { predecessorTask: { id: 't1', status: TaskStatus.ACTIVE } },
        ],
      });

      await expect(
        service.transitionTask('t2', TaskStatus.ACTIVE),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows activation when all predecessors complete', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't2',
        status: TaskStatus.BLOCKED,
        predecessors: [
          { predecessorTask: { id: 't1', status: TaskStatus.COMPLETED } },
        ],
      });
      prisma.task.update.mockResolvedValue({ id: 't2', status: TaskStatus.ACTIVE });

      const result = await service.transitionTask('t2', TaskStatus.ACTIVE);
      expect(result.task.status).toBe(TaskStatus.ACTIVE);
    });

    it('throws NotFoundException for missing task', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(service.transitionTask('invalid', TaskStatus.ACTIVE)).rejects.toThrow(NotFoundException);
    });
  });

  describe('evaluateSuccessors', () => {
    it('unblocks successor when all predecessors completed', async () => {
      prisma.taskDependency.findMany.mockResolvedValue([
        {
          successorTask: {
            id: 'succ-1',
            status: TaskStatus.BLOCKED,
            predecessors: [
              { predecessorTask: { id: 'pred-1', status: TaskStatus.COMPLETED } },
            ],
            deliverableRequirements: [],
          },
        },
      ]);
      prisma.task.update.mockResolvedValue({ id: 'succ-1', status: TaskStatus.ACTIVE });

      const unblocked = await service.evaluateSuccessors('pred-1');
      expect(unblocked).toHaveLength(1);
      expect(unblocked[0].id).toBe('succ-1');
    });

    it('does not unblock when some predecessors still incomplete', async () => {
      prisma.taskDependency.findMany.mockResolvedValue([
        {
          successorTask: {
            id: 'succ-1',
            status: TaskStatus.BLOCKED,
            predecessors: [
              { predecessorTask: { id: 'pred-1', status: TaskStatus.COMPLETED } },
              { predecessorTask: { id: 'pred-2', status: TaskStatus.ACTIVE } },
            ],
            deliverableRequirements: [],
          },
        },
      ]);

      const unblocked = await service.evaluateSuccessors('pred-1');
      expect(unblocked).toHaveLength(0);
    });

    it('does not unblock when deliverables unfulfilled', async () => {
      prisma.taskDependency.findMany.mockResolvedValue([
        {
          successorTask: {
            id: 'succ-1',
            status: TaskStatus.BLOCKED,
            predecessors: [
              { predecessorTask: { id: 'pred-1', status: TaskStatus.COMPLETED } },
            ],
            deliverableRequirements: [{ fulfilled: false }],
          },
        },
      ]);

      const unblocked = await service.evaluateSuccessors('pred-1');
      expect(unblocked).toHaveLength(0);
    });
  });

  describe('checkOverdue', () => {
    it('marks overdue tasks', async () => {
      prisma.task.findMany.mockResolvedValue([
        { id: 't1' }, { id: 't2' },
      ]);

      const count = await service.checkOverdue();
      expect(count).toBe(2);
      expect(prisma.task.update).toHaveBeenCalledTimes(2);
    });
  });
});
