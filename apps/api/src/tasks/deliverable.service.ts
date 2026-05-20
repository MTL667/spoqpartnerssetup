import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskStatusEngineService } from './task-status-engine.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class DeliverableService {
  constructor(
    private prisma: PrismaService,
    private taskStatusEngine: TaskStatusEngineService,
    private auditService: AuditService,
  ) {}

  async uploadDeliverable(
    requirementId: string,
    fileName: string,
    storageRef: string,
    uploadedBy: string,
  ) {
    const requirement = await this.prisma.deliverableRequirement.findUnique({
      where: { id: requirementId },
      include: { task: true },
    });

    if (!requirement) throw new NotFoundException('Deliverable requirement not found');
    if (requirement.fulfilled) throw new BadRequestException('Requirement already fulfilled');

    const deliverable = await this.prisma.deliverable.create({
      data: {
        requirementId,
        fileName,
        storageRef,
        uploadedBy,
      },
    });

    await this.prisma.deliverableRequirement.update({
      where: { id: requirementId },
      data: { fulfilled: true },
    });

    await this.auditService.log({
      actorId: uploadedBy,
      action: 'DELIVERABLE_UPLOADED',
      entityType: 'DeliverableRequirement',
      entityId: requirementId,
      metadata: { fileName, taskId: requirement.taskId },
    });

    await this.evaluateTaskUnblock(requirement.taskId);

    return deliverable;
  }

  async evaluateTaskUnblock(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        successors: {
          include: {
            successorTask: {
              include: {
                predecessors: { include: { predecessorTask: true } },
                deliverableRequirements: true,
              },
            },
          },
        },
      },
    });

    if (!task) return [];

    const unblocked: any[] = [];
    for (const dep of task.successors) {
      const successor = dep.successorTask;
      if (successor.status !== 'BLOCKED') continue;

      const allPredCompleted = successor.predecessors.every(
        (d) => d.predecessorTask.status === 'COMPLETED',
      );
      const allDeliverablesFulfilled = successor.deliverableRequirements.every(
        (dr) => dr.fulfilled,
      );

      if (allPredCompleted && allDeliverablesFulfilled) {
        const activated = await this.prisma.task.update({
          where: { id: successor.id },
          data: { status: 'ACTIVE' },
        });
        unblocked.push(activated);
      }
    }

    return unblocked;
  }

  async getRequirements(taskId: string) {
    return this.prisma.deliverableRequirement.findMany({
      where: { taskId },
      include: { deliverables: true },
    });
  }
}
