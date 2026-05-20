import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  IntegrationType, ContractType, TaskStatus, PhaseStatus,
  OnboardingStatus, PartnerLifecycleStatus, UserRole,
} from '@prisma/client';
import * as XLSX from 'xlsx';

const PHASE_MAP: Record<string, number> = {
  'Fase 1': 1, 'Fase 2': 1,
  'Fase 3': 2, 'Fase 4': 3,
  'Fase 5': 4, 'Fase 6': 5,
};

const PHASE_NAMES: Record<number, string> = {
  1: 'Preparation', 2: 'Technical Setup', 3: 'Content & Marketing',
  4: 'Go-to-Market', 5: 'Post-Launch',
};

const INTEGRATION_MAP: Record<string, IntegrationType> = {
  'Forms ERP': IntegrationType.FORMS_ERP,
  'Partner Portaal': IntegrationType.PARTNER_PORTAL,
  'API Integratie': IntegrationType.API_INTEGRATION,
  'API Integration': IntegrationType.API_INTEGRATION,
};

const STATUS_MAP: Record<string, TaskStatus> = {
  'Niet gestart': TaskStatus.NOT_ACTIVE,
  'Lopend': TaskStatus.ACTIVE,
  'On hold': TaskStatus.BLOCKED,
  'Klaar': TaskStatus.COMPLETED,
  'Afgerond': TaskStatus.COMPLETED,
};

const ROLE_MAP: Record<string, UserRole> = {
  'BDM': UserRole.BDM, 'BDM / Sales': UserRole.SALES,
  'BDM / Management': UserRole.BDM, 'BDM / Legal': UserRole.BDM,
  'BDM + Partner': UserRole.BDM, 'BDM + SPOQ IT + Partner IT': UserRole.IT,
  'BDM + SPOQ IT + Partner': UserRole.IT, 'BDM + BAM': UserRole.BDM,
  'BDM / Marketing': UserRole.MARKETING, 'SPOQ IT': UserRole.IT,
  'Marketing': UserRole.MARKETING, 'Sales': UserRole.SALES,
  'SPOQ team': UserRole.BDM, 'SPOQ team + Partner': UserRole.BDM,
  'BDM + Sales + Partner': UserRole.SALES,
};

const TASK_RANGES = [
  { start: 4, end: 6 }, { start: 11, end: 15 }, { start: 20, end: 28 },
  { start: 32, end: 34 }, { start: 40, end: 42 }, { start: 48, end: 50 },
];

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  details: { name: string; tasks: number; progress: number }[];
}

@Injectable()
export class ExcelImportService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async importExcel(buffer: Buffer, actorId: string): Promise<ImportResult> {
    const wb = XLSX.read(buffer, { type: 'buffer' });

    const partnerSheets = wb.SheetNames.filter((n) => /^Partner \d{3}$/.test(n));
    if (partnerSheets.length === 0) {
      throw new BadRequestException('Geen partner sheets gevonden in het Excel bestand. Verwacht: "Partner 001", "Partner 002", etc.');
    }

    const defaultTemplate = await this.prisma.template.findFirst({
      where: { active: true, integrationType: IntegrationType.FORMS_ERP, contractType: ContractType.EXPERT_PARTNER },
    });

    const result: ImportResult = { imported: 0, skipped: 0, errors: [], details: [] };

    for (const sheetName of partnerSheets) {
      const ws = wb.Sheets[sheetName];
      const name = (ws['B2']?.v as string)?.trim();
      if (!name) { result.skipped++; continue; }

      const existing = await this.prisma.partner.findFirst({ where: { companyName: name } });
      if (existing) {
        result.skipped++;
        result.errors.push(`"${name}" bestaat al — overgeslagen`);
        continue;
      }

      try {
        const { tasks, progress } = await this.importPartnerSheet(ws, name, defaultTemplate?.id || null);
        result.imported++;
        result.details.push({ name, tasks, progress: Math.round(progress * 100) });
      } catch (e: any) {
        result.errors.push(`"${name}": ${e.message}`);
      }
    }

    await this.auditService.log({
      actorId,
      action: 'EXCEL_IMPORT',
      entityType: 'Import',
      entityId: 'excel',
      metadata: { imported: result.imported, skipped: result.skipped },
    });

    return result;
  }

  private async importPartnerSheet(ws: XLSX.WorkSheet, name: string, defaultTemplateId: string | null) {
    const integration = (ws['C2']?.v as string)?.trim() || 'Forms ERP';
    const integrationType = INTEGRATION_MAP[integration] || IntegrationType.FORMS_ERP;

    const tasks = this.parseTasks(ws);
    const allProgress = tasks.map((t) => t.progress);
    const overallProgress = allProgress.length > 0
      ? allProgress.reduce((a, b) => a + b, 0) / allProgress.length : 0;
    const isCompleted = overallProgress >= 0.99;

    const template = await this.prisma.template.findFirst({
      where: { active: true, integrationType, contractType: ContractType.EXPERT_PARTNER },
    });

    const partner = await this.prisma.partner.create({
      data: {
        companyName: name,
        primaryContactEmail: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        lifecycleStatus: isCompleted ? PartnerLifecycleStatus.ACTIVE : PartnerLifecycleStatus.ONBOARDING,
      },
    });

    const onboarding = await this.prisma.onboarding.create({
      data: {
        partner: { connect: { id: partner.id } },
        integrationType,
        contractType: ContractType.EXPERT_PARTNER,
        template: (template || defaultTemplateId) ? { connect: { id: template?.id || defaultTemplateId! } } : undefined,
        status: isCompleted ? OnboardingStatus.COMPLETED : OnboardingStatus.ACTIVE,
        phases: {
          create: [1, 2, 3, 4, 5].map((seq) => {
            const phaseTasks = tasks.filter((t) => this.phaseSeq(t.phase) === seq);
            const pp = phaseTasks.length > 0
              ? phaseTasks.reduce((a, t) => a + t.progress, 0) / phaseTasks.length : 0;
            return {
              sequence: seq,
              name: PHASE_NAMES[seq],
              status: pp >= 0.99 ? PhaseStatus.COMPLETED : pp > 0 ? PhaseStatus.IN_PROGRESS : PhaseStatus.NOT_STARTED,
            };
          }),
        },
      },
      include: { phases: { orderBy: { sequence: 'asc' } } },
    });

    for (const task of tasks) {
      const phase = onboarding.phases.find((p: { sequence: number }) => p.sequence === this.phaseSeq(task.phase));
      if (!phase) continue;

      await this.prisma.task.create({
        data: {
          phase: { connect: { id: phase.id } },
          title: task.title,
          description: [task.notes, task.deliverable ? `Deliverable: ${task.deliverable}` : null]
            .filter(Boolean).join(' | ') || null,
          ownerRole: ROLE_MAP[task.responsible] || UserRole.BDM,
          status: STATUS_MAP[task.status] || TaskStatus.NOT_ACTIVE,
        },
      });
    }

    return { tasks: tasks.length, progress: overallProgress };
  }

  private parseTasks(ws: XLSX.WorkSheet) {
    const tasks: { phase: string; title: string; responsible: string; deliverable: string | null; status: string; notes: string | null; progress: number }[] = [];
    for (const range of TASK_RANGES) {
      for (let r = range.start; r <= range.end; r++) {
        const phase = ws[`A${r}`]?.v as string;
        const title = ws[`B${r}`]?.v as string;
        if (!phase || !title) continue;
        tasks.push({
          phase: phase.trim(), title: title.trim(),
          responsible: (ws[`C${r}`]?.v as string)?.trim() || 'BDM',
          deliverable: (ws[`D${r}`]?.v as string)?.trim() || null,
          status: (ws[`E${r}`]?.v as string)?.trim() || 'Niet gestart',
          notes: (ws[`G${r}`]?.v as string)?.trim() || null,
          progress: (ws[`H${r}`]?.v as number) || 0,
        });
      }
    }
    return tasks;
  }

  private phaseSeq(phaseName: string): number {
    for (const [key, seq] of Object.entries(PHASE_MAP)) {
      if (phaseName.startsWith(key)) return seq;
    }
    return 1;
  }
}
