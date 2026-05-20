import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationType, ContractType, UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

export interface BlueprintInput {
  title: string;
  description?: string;
  phaseSequence: number;
  ownerRole: UserRole;
  offsetDays?: number;
  parentKey?: string;
  dependsOnKeys?: string[];
  checklistItems?: string[];
  deliverables?: { title: string; requiredByRole: UserRole }[];
  sortOrder?: number;
}

@Injectable()
export class TemplateManagementService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createTemplate(
    integrationType: IntegrationType,
    contractType: ContractType,
    blueprints: BlueprintInput[],
    actorId: string,
  ) {
    const existing = await this.prisma.template.findFirst({
      where: { integrationType, contractType },
      orderBy: { version: 'desc' },
    });

    const nextVersion = existing ? existing.version + 1 : 1;

    const template = await this.prisma.template.create({
      data: {
        integrationType,
        contractType,
        version: nextVersion,
        active: false,
        blueprints: {
          create: blueprints.map((bp, idx) => ({
            title: bp.title,
            description: bp.description,
            phaseSequence: bp.phaseSequence,
            ownerRole: bp.ownerRole,
            offsetDays: bp.offsetDays,
            parentKey: bp.parentKey,
            dependsOnKeys: bp.dependsOnKeys ?? [],
            checklistItems: bp.checklistItems ?? [],
            deliverables: bp.deliverables ? (bp.deliverables as any) : undefined,
            sortOrder: bp.sortOrder ?? idx,
          })),
        },
      },
      include: { blueprints: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditService.log({
      actorId,
      action: 'TEMPLATE_CREATED',
      entityType: 'Template',
      entityId: template.id,
      metadata: { integrationType, contractType, version: nextVersion },
    });

    return template;
  }

  async publishTemplate(templateId: string, actorId: string) {
    const template = await this.prisma.template.findUnique({
      where: { id: templateId },
      include: { blueprints: true },
    });

    if (!template) throw new NotFoundException('Template not found');
    if (template.active) throw new BadRequestException('Template is already active');
    if (template.blueprints.length === 0) {
      throw new BadRequestException('Cannot publish template with no task blueprints');
    }

    const validationErrors = this.validateDependencyGraph(template.blueprints);
    if (validationErrors.length > 0) {
      throw new BadRequestException({
        message: 'Invalid dependency graph',
        errors: validationErrors,
      });
    }

    await this.prisma.template.updateMany({
      where: {
        integrationType: template.integrationType,
        contractType: template.contractType,
        active: true,
      },
      data: { active: false },
    });

    const published = await this.prisma.template.update({
      where: { id: templateId },
      data: { active: true },
    });

    await this.auditService.log({
      actorId,
      action: 'TEMPLATE_PUBLISHED',
      entityType: 'Template',
      entityId: templateId,
      metadata: { version: template.version },
    });

    return published;
  }

  private validateDependencyGraph(blueprints: any[]): string[] {
    const errors: string[] = [];
    const titles = new Set(blueprints.map((b) => b.title));

    for (const bp of blueprints) {
      if (bp.phaseSequence < 1 || bp.phaseSequence > 5) {
        errors.push(`Task "${bp.title}": phase sequence must be 1-5`);
      }

      for (const depKey of bp.dependsOnKeys ?? []) {
        if (!titles.has(depKey)) {
          errors.push(`Task "${bp.title}": depends on unknown task "${depKey}"`);
        }
      }

      if (bp.dependsOnKeys?.includes(bp.title)) {
        errors.push(`Task "${bp.title}": cannot depend on itself`);
      }
    }

    return errors;
  }

  async getVersionHistory(integrationType: IntegrationType, contractType: ContractType) {
    return this.prisma.template.findMany({
      where: { integrationType, contractType },
      include: { blueprints: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { version: 'desc' },
    });
  }

  async getById(id: string) {
    const template = await this.prisma.template.findUnique({
      where: { id },
      include: { blueprints: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async updateBlueprints(templateId: string, blueprints: BlueprintInput[], actorId: string) {
    const template = await this.prisma.template.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Template not found');
    if (template.active) throw new BadRequestException('Cannot edit active template — create a new version');

    await this.prisma.templateTaskBlueprint.deleteMany({ where: { templateId } });

    const updated = await this.prisma.template.update({
      where: { id: templateId },
      data: {
        blueprints: {
          create: blueprints.map((bp, idx) => ({
            title: bp.title,
            description: bp.description,
            phaseSequence: bp.phaseSequence,
            ownerRole: bp.ownerRole,
            offsetDays: bp.offsetDays,
            parentKey: bp.parentKey,
            dependsOnKeys: bp.dependsOnKeys ?? [],
            checklistItems: bp.checklistItems ?? [],
            deliverables: bp.deliverables ? (bp.deliverables as any) : undefined,
            sortOrder: bp.sortOrder ?? idx,
          })),
        },
      },
      include: { blueprints: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.auditService.log({
      actorId,
      action: 'TEMPLATE_UPDATED',
      entityType: 'Template',
      entityId: templateId,
    });

    return updated;
  }
}
