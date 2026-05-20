import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: {
        checklistItems: true,
        deliverableRequirements: { include: { deliverables: true } },
        subTasks: { include: { checklistItems: true } },
        predecessors: { include: { predecessorTask: { select: { id: true, title: true, status: true } } } },
        successors: { include: { successorTask: { select: { id: true, title: true, status: true } } } },
      },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async findByOnboarding(onboardingId: string) {
    return this.prisma.task.findMany({
      where: { phase: { onboardingId }, parentTaskId: null },
      include: {
        phase: { select: { name: true, sequence: true } },
        checklistItems: true,
        deliverableRequirements: true,
        subTasks: true,
      },
      orderBy: [{ phase: { sequence: 'asc' } }, { createdAt: 'asc' }],
    });
  }
}
