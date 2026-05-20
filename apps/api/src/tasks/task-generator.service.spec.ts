import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TaskGeneratorService, TaskBlueprint } from './task-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TaskStatus } from '@prisma/client';

describe('TaskGeneratorService', () => {
  let service: TaskGeneratorService;
  let prisma: any;

  const mockPhases = [
    { id: 'ph-1', sequence: 1 },
    { id: 'ph-2', sequence: 2 },
    { id: 'ph-3', sequence: 3 },
    { id: 'ph-4', sequence: 4 },
    { id: 'ph-5', sequence: 5 },
  ];

  const mockOnboarding = {
    id: 'onb-1',
    phases: mockPhases,
  };

  let taskCounter = 0;

  beforeEach(async () => {
    taskCounter = 0;

    prisma = {
      onboarding: {
        findUnique: jest.fn().mockResolvedValue(mockOnboarding),
      },
      task: {
        create: jest.fn().mockImplementation(() => {
          taskCounter++;
          return Promise.resolve({ id: `task-${taskCounter}`, title: `Task ${taskCounter}` });
        }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      checklistItem: { create: jest.fn().mockResolvedValue({}) },
      deliverableRequirement: { create: jest.fn().mockResolvedValue({}) },
      taskDependency: { create: jest.fn().mockResolvedValue({}) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskGeneratorService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TaskGeneratorService>(TaskGeneratorService);
  });

  it('generates tasks from default blueprints', async () => {
    await service.generateTasksForOnboarding('onb-1');
    expect(prisma.task.create).toHaveBeenCalled();
    expect(prisma.task.findMany).toHaveBeenCalled();
  });

  it('creates checklist items for tasks with checklists', async () => {
    const blueprints: TaskBlueprint[] = [
      {
        title: 'Test Task',
        ownerRole: UserRole.BDM,
        phaseSequence: 1,
        checklistItems: ['Item 1', 'Item 2'],
      },
    ];

    await service.generateTasksForOnboarding('onb-1', blueprints);
    expect(prisma.checklistItem.create).toHaveBeenCalledTimes(2);
  });

  it('creates deliverable requirements', async () => {
    const blueprints: TaskBlueprint[] = [
      {
        title: 'Test Task',
        ownerRole: UserRole.BDM,
        phaseSequence: 1,
        deliverables: [{ title: 'Doc', requiredByRole: UserRole.PARTNER }],
      },
    ];

    await service.generateTasksForOnboarding('onb-1', blueprints);
    expect(prisma.deliverableRequirement.create).toHaveBeenCalledTimes(1);
  });

  it('creates subtasks as child tasks', async () => {
    const blueprints: TaskBlueprint[] = [
      {
        title: 'Parent',
        ownerRole: UserRole.IT,
        phaseSequence: 2,
        subTasks: [
          { title: 'Child 1', ownerRole: UserRole.IT },
          { title: 'Child 2', ownerRole: UserRole.IT },
        ],
      },
    ];

    await service.generateTasksForOnboarding('onb-1', blueprints);
    expect(prisma.task.create).toHaveBeenCalledTimes(3);
  });

  it('creates task dependencies', async () => {
    const blueprints: TaskBlueprint[] = [
      { title: 'First', ownerRole: UserRole.BDM, phaseSequence: 1 },
      { title: 'Second', ownerRole: UserRole.IT, phaseSequence: 2, dependsOn: ['First'] },
    ];

    await service.generateTasksForOnboarding('onb-1', blueprints);
    expect(prisma.taskDependency.create).toHaveBeenCalledTimes(1);
  });

  it('sets BLOCKED status when task has dependencies', async () => {
    const blueprints: TaskBlueprint[] = [
      { title: 'First', ownerRole: UserRole.BDM, phaseSequence: 1 },
      { title: 'Second', ownerRole: UserRole.IT, phaseSequence: 2, dependsOn: ['First'] },
    ];

    await service.generateTasksForOnboarding('onb-1', blueprints);

    const secondTaskCall = prisma.task.create.mock.calls[1][0];
    expect(secondTaskCall.data.status).toBe(TaskStatus.BLOCKED);
  });

  it('throws when onboarding not found', async () => {
    prisma.onboarding.findUnique.mockResolvedValue(null);
    await expect(service.generateTasksForOnboarding('invalid')).rejects.toThrow(BadRequestException);
  });

  it('throws when phase not found for blueprint', async () => {
    const blueprints: TaskBlueprint[] = [
      { title: 'Task', ownerRole: UserRole.BDM, phaseSequence: 99 },
    ];

    await expect(service.generateTasksForOnboarding('onb-1', blueprints)).rejects.toThrow(BadRequestException);
  });
});
