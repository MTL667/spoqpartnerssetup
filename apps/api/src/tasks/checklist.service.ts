import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatusEngineService } from './task-status-engine.service';
import { TaskStatus } from '@prisma/client';

@Injectable()
export class ChecklistService {
  constructor(
    private prisma: PrismaService,
    private taskStatusEngine: TaskStatusEngineService,
  ) {}

  async toggleItem(itemId: string, userId: string) {
    const item = await this.prisma.checklistItem.findUnique({
      where: { id: itemId },
      include: { task: true },
    });

    if (!item) throw new NotFoundException('Checklist item not found');

    if (item.task.status !== TaskStatus.ACTIVE && item.task.status !== TaskStatus.OVERDUE) {
      throw new BadRequestException(
        `Cannot modify checklist on task with status ${item.task.status}`,
      );
    }

    const newChecked = !item.checked;

    return this.prisma.checklistItem.update({
      where: { id: itemId },
      data: {
        checked: newChecked,
        checkedBy: newChecked ? userId : null,
        checkedAt: newChecked ? new Date() : null,
      },
    });
  }

  async completeTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        checklistItems: true,
        deliverableRequirements: true,
      },
    });

    if (!task) throw new NotFoundException('Task not found');

    if (task.status !== TaskStatus.ACTIVE && task.status !== TaskStatus.OVERDUE) {
      throw new BadRequestException(
        `Cannot complete task with status ${task.status}`,
      );
    }

    const allChecked = task.checklistItems.every((item) => item.checked);
    if (!allChecked) {
      throw new BadRequestException('Not all checklist items are completed');
    }

    const allDelivered = task.deliverableRequirements.every((dr) => dr.fulfilled);
    if (!allDelivered) {
      throw new BadRequestException('Not all deliverable requirements are fulfilled');
    }

    return this.taskStatusEngine.transitionTask(taskId, TaskStatus.COMPLETED);
  }

  async getChecklist(taskId: string) {
    return this.prisma.checklistItem.findMany({
      where: { taskId },
      orderBy: { id: 'asc' },
    });
  }
}
