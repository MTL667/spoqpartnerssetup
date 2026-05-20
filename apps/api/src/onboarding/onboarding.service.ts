import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationType, ContractType } from '@prisma/client';
import { PartnersService } from '../partners/partners.service';
import { TemplatesService } from '../templates/templates.service';
import { AuditService } from '../audit/audit.service';
import { TaskGeneratorService } from '../tasks/task-generator.service';

const STANDARD_PHASES = [
  { sequence: 1, name: 'Preparation' },
  { sequence: 2, name: 'Technical Setup' },
  { sequence: 3, name: 'Content & Marketing' },
  { sequence: 4, name: 'Go-to-Market' },
  { sequence: 5, name: 'Post-Launch' },
];

interface CreateOnboardingParams {
  companyName: string;
  contactEmail: string;
  integrationType: IntegrationType;
  contractType: ContractType;
  actorId: string;
}

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private partnersService: PartnersService,
    private templatesService: TemplatesService,
    private auditService: AuditService,
    @Inject(forwardRef(() => TaskGeneratorService))
    private taskGenerator: TaskGeneratorService,
  ) {}

  async createOnboarding(params: CreateOnboardingParams) {
    const template = await this.templatesService.findActiveTemplate(
      params.integrationType,
      params.contractType,
    );

    const partner = await this.partnersService.create(
      params.companyName,
      params.contactEmail,
    );

    const onboarding = await this.prisma.onboarding.create({
      data: {
        partnerId: partner.id,
        integrationType: params.integrationType,
        contractType: params.contractType,
        templateVersionId: template.id,
        phases: {
          create: STANDARD_PHASES.map((p) => ({
            name: p.name,
            sequence: p.sequence,
          })),
        },
      },
      include: { phases: { orderBy: { sequence: 'asc' } }, partner: true },
    });

    await this.auditService.log({
      actorId: params.actorId,
      action: 'PARTNER_CREATED',
      entityType: 'Partner',
      entityId: partner.id,
      metadata: { companyName: params.companyName },
    });

    await this.auditService.log({
      actorId: params.actorId,
      action: 'ONBOARDING_CREATED',
      entityType: 'Onboarding',
      entityId: onboarding.id,
      metadata: {
        partnerId: partner.id,
        integrationType: params.integrationType,
        contractType: params.contractType,
        templateId: template.id,
      },
    });

    await this.taskGenerator.generateTasksForOnboarding(onboarding.id);

    return this.findById(onboarding.id);
  }

  async findById(id: string) {
    return this.prisma.onboarding.findUnique({
      where: { id },
      include: {
        partner: true,
        phases: { orderBy: { sequence: 'asc' } },
        template: true,
      },
    });
  }

  async list(filter: { partnerId?: string | { in: string[] } } = {}) {
    return this.prisma.onboarding.findMany({
      where: filter.partnerId ? { partnerId: filter.partnerId as any } : {},
      include: {
        partner: { select: { id: true, companyName: true } },
        phases: { select: { id: true, name: true, sequence: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
