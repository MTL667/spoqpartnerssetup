import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { DeliverableService } from './deliverable.service';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatusEngineService } from './task-status-engine.service';
import { AuditService } from '../audit/audit.service';

describe('DeliverableService', () => {
  let service: DeliverableService;
  let prisma: any;
  let auditService: any;

  beforeEach(async () => {
    prisma = {
      deliverableRequirement: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
        findMany: jest.fn().mockResolvedValue([]),
      },
      deliverable: { create: jest.fn().mockResolvedValue({ id: 'del-1' }) },
      task: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'task-1',
          successors: [],
        }),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    auditService = { log: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliverableService,
        { provide: PrismaService, useValue: prisma },
        { provide: TaskStatusEngineService, useValue: {} },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<DeliverableService>(DeliverableService);
  });

  describe('uploadDeliverable', () => {
    it('creates deliverable and marks requirement as fulfilled', async () => {
      prisma.deliverableRequirement.findUnique.mockResolvedValue({
        id: 'req-1',
        taskId: 'task-1',
        fulfilled: false,
        task: { id: 'task-1' },
      });

      await service.uploadDeliverable('req-1', 'logo.png', 'uploads/logo.png', 'user-1');

      expect(prisma.deliverable.create).toHaveBeenCalledWith({
        data: {
          requirementId: 'req-1',
          fileName: 'logo.png',
          storageRef: 'uploads/logo.png',
          uploadedBy: 'user-1',
        },
      });
      expect(prisma.deliverableRequirement.update).toHaveBeenCalledWith({
        where: { id: 'req-1' },
        data: { fulfilled: true },
      });
    });

    it('logs audit event on upload', async () => {
      prisma.deliverableRequirement.findUnique.mockResolvedValue({
        id: 'req-1',
        taskId: 'task-1',
        fulfilled: false,
        task: { id: 'task-1' },
      });

      await service.uploadDeliverable('req-1', 'doc.pdf', 'uploads/doc.pdf', 'user-1');

      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'DELIVERABLE_UPLOADED' }),
      );
    });

    it('throws when requirement not found', async () => {
      prisma.deliverableRequirement.findUnique.mockResolvedValue(null);
      await expect(
        service.uploadDeliverable('invalid', 'f.txt', 'ref', 'u1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws when requirement already fulfilled', async () => {
      prisma.deliverableRequirement.findUnique.mockResolvedValue({
        id: 'req-1',
        taskId: 'task-1',
        fulfilled: true,
        task: { id: 'task-1' },
      });

      await expect(
        service.uploadDeliverable('req-1', 'f.txt', 'ref', 'u1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('evaluateTaskUnblock', () => {
    it('unblocks successor when all deps and deliverables fulfilled', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        successors: [
          {
            successorTask: {
              id: 'succ-1',
              status: 'BLOCKED',
              predecessors: [{ predecessorTask: { status: 'COMPLETED' } }],
              deliverableRequirements: [{ fulfilled: true }],
            },
          },
        ],
      });
      prisma.task.update.mockResolvedValue({ id: 'succ-1', status: 'ACTIVE' });

      const unblocked = await service.evaluateTaskUnblock('task-1');
      expect(unblocked).toHaveLength(1);
    });

    it('does not unblock when deliverable unfulfilled', async () => {
      prisma.task.findUnique.mockResolvedValue({
        id: 'task-1',
        successors: [
          {
            successorTask: {
              id: 'succ-1',
              status: 'BLOCKED',
              predecessors: [{ predecessorTask: { status: 'COMPLETED' } }],
              deliverableRequirements: [{ fulfilled: false }],
            },
          },
        ],
      });

      const unblocked = await service.evaluateTaskUnblock('task-1');
      expect(unblocked).toHaveLength(0);
    });
  });

  describe('getRequirements', () => {
    it('returns requirements with deliverables', async () => {
      prisma.deliverableRequirement.findMany.mockResolvedValue([
        { id: 'req-1', fulfilled: false, deliverables: [] },
      ]);

      const result = await service.getRequirements('task-1');
      expect(result).toHaveLength(1);
    });
  });
});
