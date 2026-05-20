import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { OnboardingStatus, PhaseStatus, TaskStatus } from '@prisma/client';

@Injectable()
export class LifecycleService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async advancePhase(onboardingId: string, actorId: string) {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: {
        phases: {
          orderBy: { sequence: 'asc' },
          include: {
            tasks: { where: { parentTaskId: null }, select: { status: true } },
          },
        },
      },
    });

    if (!onboarding) throw new NotFoundException('Onboarding not found');
    if (onboarding.status !== OnboardingStatus.ACTIVE) {
      throw new BadRequestException('Onboarding is not active');
    }

    const currentPhase = onboarding.phases.find((p) => p.status === PhaseStatus.IN_PROGRESS);
    if (!currentPhase) {
      const firstNotStarted = onboarding.phases.find((p) => p.status === PhaseStatus.NOT_STARTED);
      if (!firstNotStarted) throw new BadRequestException('All phases completed');

      await this.prisma.onboardingPhase.update({
        where: { id: firstNotStarted.id },
        data: { status: PhaseStatus.IN_PROGRESS },
      });

      return { phase: firstNotStarted.name, status: PhaseStatus.IN_PROGRESS };
    }

    const allTasksCompleted = currentPhase.tasks.every((t) => t.status === TaskStatus.COMPLETED);
    if (!allTasksCompleted) {
      throw new BadRequestException(`Not all tasks in phase "${currentPhase.name}" are completed`);
    }

    await this.prisma.onboardingPhase.update({
      where: { id: currentPhase.id },
      data: { status: PhaseStatus.COMPLETED },
    });

    const nextPhase = onboarding.phases.find((p) => p.sequence === currentPhase.sequence + 1);
    if (nextPhase) {
      await this.prisma.onboardingPhase.update({
        where: { id: nextPhase.id },
        data: { status: PhaseStatus.IN_PROGRESS },
      });
    }

    await this.auditService.log({
      actorId,
      action: 'PHASE_ADVANCED',
      entityType: 'OnboardingPhase',
      entityId: currentPhase.id,
      metadata: { from: currentPhase.name, to: nextPhase?.name ?? 'completed' },
    });

    return {
      completedPhase: currentPhase.name,
      nextPhase: nextPhase?.name ?? null,
      status: nextPhase ? PhaseStatus.IN_PROGRESS : 'ALL_COMPLETED',
    };
  }

  async archiveOnboarding(onboardingId: string, actorId: string) {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: { partner: true },
    });

    if (!onboarding) throw new NotFoundException('Onboarding not found');

    const updated = await this.prisma.onboarding.update({
      where: { id: onboardingId },
      data: { status: OnboardingStatus.COMPLETED },
    });

    await this.prisma.partner.update({
      where: { id: onboarding.partnerId },
      data: { lifecycleStatus: 'ACTIVE' },
    });

    await this.auditService.log({
      actorId,
      action: 'ONBOARDING_ARCHIVED',
      entityType: 'Onboarding',
      entityId: onboardingId,
    });

    return updated;
  }

  async listArchived(options: { page?: number; limit?: number } = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const [items, total] = await Promise.all([
      this.prisma.onboarding.findMany({
        where: { status: OnboardingStatus.COMPLETED },
        include: { partner: { select: { companyName: true } } },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.onboarding.count({ where: { status: OnboardingStatus.COMPLETED } }),
    ]);

    return { items, total, page, limit };
  }
}
