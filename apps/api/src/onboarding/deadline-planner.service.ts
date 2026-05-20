import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeadlinePlannerService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async setGoLiveDate(onboardingId: string, targetGoLiveDate: Date, actorId: string) {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
    });

    if (!onboarding) throw new NotFoundException('Onboarding not found');

    await this.prisma.onboarding.update({
      where: { id: onboardingId },
      data: { targetGoLiveDate },
    });

    await this.calculateDeadlines(onboardingId, targetGoLiveDate);

    await this.auditService.log({
      actorId,
      action: 'GO_LIVE_DATE_SET',
      entityType: 'Onboarding',
      entityId: onboardingId,
      metadata: { targetGoLiveDate: targetGoLiveDate.toISOString() },
    });

    return this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: {
        phases: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: {
              where: { parentTaskId: null },
              orderBy: { createdAt: 'asc' },
              select: { id: true, title: true, dueDate: true, dueDateOverride: true, offsetDays: true },
            },
          },
        },
      },
    });
  }

  async calculateDeadlines(onboardingId: string, targetGoLiveDate: Date) {
    const tasks = await this.prisma.task.findMany({
      where: {
        phase: { onboardingId },
        dueDateOverride: false,
        offsetDays: { not: null },
      },
    });

    for (const task of tasks) {
      if (task.offsetDays === null) continue;
      const dueDate = new Date(targetGoLiveDate);
      dueDate.setDate(dueDate.getDate() + task.offsetDays);

      await this.prisma.task.update({
        where: { id: task.id },
        data: { dueDate },
      });
    }
  }

  async overrideTaskDueDate(taskId: string, dueDate: Date, actorId: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.update({
      where: { id: taskId },
      data: { dueDate, dueDateOverride: true },
    });

    await this.auditService.log({
      actorId,
      action: 'TASK_DUE_DATE_OVERRIDE',
      entityType: 'Task',
      entityId: taskId,
      metadata: { dueDate: dueDate.toISOString(), previousDueDate: task.dueDate?.toISOString() },
    });

    return this.prisma.task.findUnique({ where: { id: taskId } });
  }

  async recalculate(onboardingId: string, actorId: string) {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
    });

    if (!onboarding) throw new NotFoundException('Onboarding not found');
    if (!onboarding.targetGoLiveDate) {
      throw new BadRequestException('No go-live date set');
    }

    await this.calculateDeadlines(onboardingId, onboarding.targetGoLiveDate);

    await this.auditService.log({
      actorId,
      action: 'DEADLINES_RECALCULATED',
      entityType: 'Onboarding',
      entityId: onboardingId,
    });

    return this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: {
        phases: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: {
              where: { parentTaskId: null },
              orderBy: { createdAt: 'asc' },
              select: { id: true, title: true, dueDate: true, dueDateOverride: true },
            },
          },
        },
      },
    });
  }
}
