import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, PhaseStatus } from '@prisma/client';

export interface PhaseProgress {
  id: string;
  name: string;
  sequence: number;
  status: PhaseStatus;
  totalTasks: number;
  completedTasks: number;
  progressPercent: number;
}

export interface PartnerActionItem {
  id: string;
  type: 'deliverable' | 'checklist';
  taskTitle: string;
  taskId: string;
  title: string;
  dueDate: Date | null;
  fulfilled: boolean;
}

@Injectable()
export class PartnerPortalService {
  constructor(private prisma: PrismaService) {}

  async getProgress(partnerId: string) {
    const onboarding = await this.prisma.onboarding.findFirst({
      where: { partnerId, status: 'ACTIVE' },
      include: {
        partner: { select: { companyName: true } },
        phases: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: {
              where: { parentTaskId: null },
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!onboarding) throw new NotFoundException('No active onboarding found');

    const phases: PhaseProgress[] = onboarding.phases.map((phase) => {
      const total = phase.tasks.length;
      const completed = phase.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
      return {
        id: phase.id,
        name: phase.name,
        sequence: phase.sequence,
        status: phase.status,
        totalTasks: total,
        completedTasks: completed,
        progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });

    const totalTasks = phases.reduce((sum, p) => sum + p.totalTasks, 0);
    const totalCompleted = phases.reduce((sum, p) => sum + p.completedTasks, 0);

    return {
      onboardingId: onboarding.id,
      companyName: onboarding.partner.companyName,
      targetGoLiveDate: onboarding.targetGoLiveDate,
      overallProgress: totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0,
      phases,
    };
  }

  async getActionItems(partnerId: string): Promise<PartnerActionItem[]> {
    const deliverableReqs = await this.prisma.deliverableRequirement.findMany({
      where: {
        requiredByRole: 'PARTNER',
        task: {
          phase: { onboarding: { partnerId, status: 'ACTIVE' } },
          status: { in: [TaskStatus.ACTIVE, TaskStatus.OVERDUE] },
        },
      },
      include: {
        task: { select: { id: true, title: true, dueDate: true } },
      },
    });

    return deliverableReqs.map((dr) => ({
      id: dr.id,
      type: 'deliverable' as const,
      taskTitle: dr.task.title,
      taskId: dr.task.id,
      title: dr.title,
      dueDate: dr.task.dueDate,
      fulfilled: dr.fulfilled,
    }));
  }

  async getSchedule(partnerId: string) {
    const onboarding = await this.prisma.onboarding.findFirst({
      where: { partnerId, status: 'ACTIVE' },
      include: {
        phases: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: {
              where: { parentTaskId: null },
              select: { id: true, title: true, dueDate: true, status: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!onboarding) throw new NotFoundException('No active onboarding found');

    return {
      targetGoLiveDate: onboarding.targetGoLiveDate,
      phases: onboarding.phases.map((p) => ({
        name: p.name,
        sequence: p.sequence,
        tasks: p.tasks.map((t) => ({
          title: t.title,
          dueDate: t.dueDate,
          status: t.status,
        })),
      })),
    };
  }
}
