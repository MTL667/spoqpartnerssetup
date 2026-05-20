import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus, OnboardingStatus } from '@prisma/client';

export interface PartnerAlert {
  partnerId: string;
  companyName: string;
  onboardingId: string;
  severity: 'red' | 'orange' | 'green';
  blockedTasks: number;
  overdueTasks: number;
  atRiskTasks: number;
  totalTasks: number;
  completedTasks: number;
}

export interface TaskDetail {
  id: string;
  title: string;
  status: TaskStatus;
  ownerRole: string;
  dueDate: Date | null;
  blockingReason?: string;
  assigneeId: string | null;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getAlerts(filter: { partnerId?: string | { in: string[] } } = {}): Promise<PartnerAlert[]> {
    const onboardings = await this.prisma.onboarding.findMany({
      where: {
        status: OnboardingStatus.ACTIVE,
        ...(filter.partnerId ? { partnerId: filter.partnerId as any } : {}),
      },
      include: {
        partner: { select: { id: true, companyName: true } },
        phases: {
          include: {
            tasks: {
              where: { parentTaskId: null },
              select: { id: true, status: true, dueDate: true },
            },
          },
        },
      },
    });

    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    return onboardings.map((onb) => {
      const allTasks = onb.phases.flatMap((p) => p.tasks);
      const blocked = allTasks.filter((t) => t.status === TaskStatus.BLOCKED).length;
      const overdue = allTasks.filter((t) => t.status === TaskStatus.OVERDUE).length;
      const atRisk = allTasks.filter(
        (t) =>
          t.status === TaskStatus.ACTIVE &&
          t.dueDate &&
          t.dueDate <= threeDaysFromNow &&
          t.dueDate > now,
      ).length;
      const completed = allTasks.filter((t) => t.status === TaskStatus.COMPLETED).length;

      let severity: 'red' | 'orange' | 'green' = 'green';
      if (blocked > 0 || overdue > 0) severity = 'red';
      else if (atRisk > 0) severity = 'orange';

      return {
        partnerId: onb.partner.id,
        companyName: onb.partner.companyName,
        onboardingId: onb.id,
        severity,
        blockedTasks: blocked,
        overdueTasks: overdue,
        atRiskTasks: atRisk,
        totalTasks: allTasks.length,
        completedTasks: completed,
      };
    }).sort((a, b) => {
      const order = { red: 0, orange: 1, green: 2 };
      return order[a.severity] - order[b.severity];
    });
  }

  async getDrillDown(onboardingId: string): Promise<TaskDetail[]> {
    const tasks = await this.prisma.task.findMany({
      where: {
        phase: { onboardingId },
        parentTaskId: null,
        status: { in: [TaskStatus.BLOCKED, TaskStatus.OVERDUE, TaskStatus.ACTIVE] },
      },
      include: {
        predecessors: {
          include: {
            predecessorTask: { select: { id: true, title: true, status: true } },
          },
        },
        deliverableRequirements: { where: { fulfilled: false } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return tasks.map((task) => {
      const blockingReasons: string[] = [];

      const incompletePreds = task.predecessors
        .filter((d) => d.predecessorTask.status !== TaskStatus.COMPLETED)
        .map((d) => d.predecessorTask.title);
      if (incompletePreds.length > 0) {
        blockingReasons.push(`Waiting for: ${incompletePreds.join(', ')}`);
      }

      const missingDeliverables = task.deliverableRequirements.map((dr) => dr.title);
      if (missingDeliverables.length > 0) {
        blockingReasons.push(`Missing deliverables: ${missingDeliverables.join(', ')}`);
      }

      return {
        id: task.id,
        title: task.title,
        status: task.status,
        ownerRole: task.ownerRole,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        blockingReason: blockingReasons.length > 0 ? blockingReasons.join('; ') : undefined,
      };
    });
  }
}
