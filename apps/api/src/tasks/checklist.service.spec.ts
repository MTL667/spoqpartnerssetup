import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ChecklistService } from './checklist.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatusEngineService } from './task-status-engine.service';
import { TaskStatus } from '@prisma/client';

describe('ChecklistService', () => {
  let service: ChecklistService;
  let prisma: any;
  let taskStatusEngine: any;

  beforeEach(async () => {
    prisma = {
      checklistItem: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      task: {
        findUnique: jest.fn(),
      },
    };

    taskStatusEngine = {
      transitionTask: jest.fn().mockResolvedValue({
        task: { id: 't1', status: TaskStatus.COMPLETED },
        unblocked: [],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChecklistService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaskStatusEngineService, useValue: taskStatusEngine },
      ],
    }).compile();

    service = module.get<ChecklistService>(ChecklistService);
  });

  describe('toggleItem', () => {
    it('checks an unchecked item', async () => {
      prisma.checklistItem.findUnique.mockResolvedValue({
        id: 'ci-1',
        checked: false,
        task: { id: 't1', status: TaskStatus.ACTIVE },
      });

      await service.toggleItem('ci-1', 'user-1');

      expect(prisma.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'ci-1' },
        data: { checked: true, checkedBy: 'user-1', checkedAt: expect.any(Date) },
      });
    });

    it('unchecks a checked item', async () => {
      prisma.checklistItem.findUnique.mockResolvedValue({
        id: 'ci-1',
        checked: true,
        task: { id: 't1', status: TaskStatus.ACTIVE },
      });

      await service.toggleItem('ci-1', 'user-1');

      expect(prisma.checklistItem.update).toHaveBeenCalledWith({
        where: { id: 'ci-1' },
        data: { checked: false, checkedBy: null, checkedAt: null },
      });
    });

    it('throws when item not found', async () => {
      prisma.checklistItem.findUnique.mockResolvedValue(null);
      await expect(service.toggleItem('invalid', 'u1')).rejects.toThrow(NotFoundException);
    });

    it('throws when task is not active', async () => {
      prisma.checklistItem.findUnique.mockResolvedValue({
        id: 'ci-1',
        checked: false,
        task: { id: 't1', status: TaskStatus.BLOCKED },
      });

      await expect(service.toggleItem('ci-1', 'u1')).rejects.toThrow(BadRequestException);
    });

    it('allows toggle on OVERDUE task', async () => {
      prisma.checklistItem.findUnique.mockResolvedValue({
        id: 'ci-1',
        checked: false,
        task: { id: 't1', status: TaskStatus.OVERDUE },
      });

      await service.toggleItem('ci-1', 'user-1');
      expect(prisma.checklistItem.update).toHaveBeenCalled();
    });
  });

  describe('completeTask', () => {
    it('completes task when all checklist items and deliverables are done', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1',
        status: TaskStatus.ACTIVE,
        checklistItems: [{ checked: true }, { checked: true }],
        deliverableRequirements: [{ fulfilled: true }],
      });

      await service.completeTask('t1');

      expect(taskStatusEngine.transitionTask).toHaveBeenCalledWith('t1', TaskStatus.COMPLETED);
    });

    it('throws when not all checklist items are checked', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1',
        status: TaskStatus.ACTIVE,
        checklistItems: [{ checked: true }, { checked: false }],
        deliverableRequirements: [],
      });

      await expect(service.completeTask('t1')).rejects.toThrow(BadRequestException);
    });

    it('throws when deliverables are unfulfilled', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1',
        status: TaskStatus.ACTIVE,
        checklistItems: [{ checked: true }],
        deliverableRequirements: [{ fulfilled: false }],
      });

      await expect(service.completeTask('t1')).rejects.toThrow(BadRequestException);
    });

    it('throws when task is not active', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 't1',
        status: TaskStatus.NOT_ACTIVE,
        checklistItems: [],
        deliverableRequirements: [],
      });

      await expect(service.completeTask('t1')).rejects.toThrow(BadRequestException);
    });

    it('throws when task not found', async () => {
      prisma.task.findUnique.mockResolvedValue(null);
      await expect(service.completeTask('invalid')).rejects.toThrow(NotFoundException);
    });
  });
});
