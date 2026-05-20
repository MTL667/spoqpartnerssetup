import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatus } from '@prisma/client';

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.NOT_ACTIVE]: [TaskStatus.ACTIVE],
  [TaskStatus.ACTIVE]: [TaskStatus.COMPLETED, TaskStatus.BLOCKED, TaskStatus.OVERDUE],
  [TaskStatus.BLOCKED]: [TaskStatus.ACTIVE],
  [TaskStatus.OVERDUE]: [TaskStatus.COMPLETED, TaskStatus.ACTIVE],
  [TaskStatus.COMPLETED]: [],
};

@Injectable()
export class TaskStatusEngineService {
  constructor(private prisma: PrismaService) {}

  async transitionTask(taskId: string, targetStatus: TaskStatus): Promise<{ task: any; unblocked: any[] }> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { predecessors: { include: { predecessorTask: true } } },
    });

    if (!task) throw new NotFoundException('Task not found');

    const allowed = VALID_TRANSITIONS[task.status];
    if (!allowed.includes(targetStatus)) {
      throw new BadRequestException(
        `Cannot transition from ${task.status} to ${targetStatus}`,
      );
    }

    if (targetStatus === TaskStatus.ACTIVE && task.predecessors.length > 0) {
      const allPredecessorsCompleted = task.predecessors.every(
        (dep) => dep.predecessorTask.status === TaskStatus.COMPLETED,
      );
      if (!allPredecessorsCompleted) {
        throw new BadRequestException(
          'Cannot activate task: predecessor tasks are not completed',
        );
      }
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { status: targetStatus },
    });

    let unblockedTasks: any[] = [];
    if (targetStatus === TaskStatus.COMPLETED) {
      unblockedTasks = await this.evaluateSuccessors(taskId);
    }

    return { task: updated, unblocked: unblockedTasks };
  }

  async evaluateSuccessors(completedTaskId: string) {
    const successorDeps = await this.prisma.taskDependency.findMany({
      where: { predecessorTaskId: completedTaskId },
      include: {
        successorTask: {
          include: {
            predecessors: { include: { predecessorTask: true } },
            deliverableRequirements: true,
          },
        },
      },
    });

    const unblocked: any[] = [];

    for (const dep of successorDeps) {
      const successor = dep.successorTask;

      if (successor.status !== TaskStatus.BLOCKED) continue;

      const allPredecessorsCompleted = successor.predecessors.every(
        (d) => d.predecessorTask.status === TaskStatus.COMPLETED,
      );

      const allDeliverablesFullfilled = successor.deliverableRequirements.every(
        (dr) => dr.fulfilled,
      );

      if (allPredecessorsCompleted && allDeliverablesFullfilled) {
        const activated = await this.prisma.task.update({
          where: { id: successor.id },
          data: { status: TaskStatus.ACTIVE },
        });
        unblocked.push(activated);
      }
    }

    return unblocked;
  }

  async checkOverdue() {
    const now = new Date();
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        status: { in: [TaskStatus.ACTIVE, TaskStatus.NOT_ACTIVE] },
        dueDate: { lt: now },
      },
    });

    for (const task of overdueTasks) {
      await this.prisma.task.update({
        where: { id: task.id },
        data: { status: TaskStatus.OVERDUE },
      });
    }

    return overdueTasks.length;
  }
}
