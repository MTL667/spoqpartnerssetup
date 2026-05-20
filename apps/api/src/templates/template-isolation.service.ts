import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationType, ContractType } from '@prisma/client';

@Injectable()
export class TemplateIsolationService {
  constructor(private prisma: PrismaService) {}

  async verifyIsolation(integrationType: IntegrationType, contractType: ContractType) {
    const activeTemplate = await this.prisma.template.findFirst({
      where: { integrationType, contractType, active: true },
    });

    const activeOnboardings = await this.prisma.onboarding.findMany({
      where: {
        integrationType,
        contractType,
        status: 'ACTIVE',
        templateVersionId: activeTemplate?.id,
      },
      select: { id: true, templateVersionId: true },
    });

    const allVersions = await this.prisma.template.findMany({
      where: { integrationType, contractType },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, active: true, createdAt: true },
    });

    return {
      activeTemplateId: activeTemplate?.id ?? null,
      activeTemplateVersion: activeTemplate?.version ?? null,
      activeOnboardingsUsingTemplate: activeOnboardings.length,
      versionHistory: allVersions,
    };
  }

  async getOnboardingTemplateSnapshot(onboardingId: string) {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: {
        template: {
          include: { blueprints: { orderBy: { sortOrder: 'asc' } } },
        },
      },
    });

    if (!onboarding) return null;

    return {
      onboardingId: onboarding.id,
      templateId: onboarding.templateVersionId,
      templateVersion: onboarding.template?.version,
      isCurrentActive: onboarding.template?.active ?? false,
      blueprintCount: onboarding.template?.blueprints.length ?? 0,
    };
  }
}
