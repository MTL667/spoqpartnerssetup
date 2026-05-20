import { PrismaClient, IntegrationType, ContractType, TaskStatus, PhaseStatus, OnboardingStatus, PartnerLifecycleStatus, UserRole } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const EXCEL_PATH = process.argv[2] || path.resolve(__dirname, '../../../../Downloads/Partner overview and onboarding V20260119.xlsx');

// Excel 6 phases → App 5 phases
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
};

const STATUS_MAP: Record<string, TaskStatus> = {
  'Niet gestart': TaskStatus.NOT_ACTIVE,
  'Lopend': TaskStatus.ACTIVE,
  'On hold': TaskStatus.BLOCKED,
  'Klaar': TaskStatus.COMPLETED,
  'Afgerond': TaskStatus.COMPLETED,
};

const ROLE_MAP: Record<string, UserRole> = {
  'BDM': UserRole.BDM,
  'BDM / Sales': UserRole.SALES,
  'BDM / Management': UserRole.BDM,
  'BDM / Legal': UserRole.BDM,
  'BDM + Partner': UserRole.BDM,
  'BDM + SPOQ IT + Partner IT': UserRole.IT,
  'BDM + SPOQ IT + Partner': UserRole.IT,
  'BDM + BAM': UserRole.BDM,
  'BDM / Marketing': UserRole.MARKETING,
  'SPOQ IT': UserRole.IT,
  'Marketing': UserRole.MARKETING,
  'Sales': UserRole.SALES,
  'SPOQ team': UserRole.BDM,
  'SPOQ team + Partner': UserRole.BDM,
  'BDM + Sales + Partner': UserRole.SALES,
};

interface ExcelTask {
  phase: string;
  title: string;
  responsible: string;
  deliverable: string | null;
  status: string;
  notes: string | null;
  progress: number;
}

function parsePartnerSheet(ws: XLSX.WorkSheet): { name: string; integration: string; tasks: ExcelTask[] } {
  const name = (ws['B2']?.v as string)?.trim() || '';
  const integration = (ws['C2']?.v as string)?.trim() || 'Forms ERP';
  const tasks: ExcelTask[] = [];

  const taskRanges = [
    { start: 4, end: 6 },
    { start: 11, end: 15 },
    { start: 20, end: 28 },
    { start: 32, end: 34 },
    { start: 40, end: 42 },
    { start: 48, end: 50 },
  ];

  for (const range of taskRanges) {
    for (let r = range.start; r <= range.end; r++) {
      const phase = ws[`A${r}`]?.v as string;
      const title = ws[`B${r}`]?.v as string;
      if (!phase || !title) continue;

      tasks.push({
        phase: phase.trim(),
        title: title.trim(),
        responsible: (ws[`C${r}`]?.v as string)?.trim() || 'BDM',
        deliverable: (ws[`D${r}`]?.v as string)?.trim() || null,
        status: (ws[`E${r}`]?.v as string)?.trim() || 'Niet gestart',
        notes: (ws[`G${r}`]?.v as string)?.trim() || null,
        progress: (ws[`H${r}`]?.v as number) || 0,
      });
    }
  }

  return { name, integration, tasks };
}

function resolvePhaseSequence(phaseName: string): number {
  for (const [key, seq] of Object.entries(PHASE_MAP)) {
    if (phaseName.startsWith(key)) return seq;
  }
  return 1;
}

async function importExcel() {
  console.log(`Reading Excel: ${EXCEL_PATH}`);
  const wb = XLSX.readFile(EXCEL_PATH);

  const partnerSheets = wb.SheetNames.filter((n) => n.match(/^Partner \d{3}$/));
  console.log(`Found ${partnerSheets.length} partner sheets`);

  const defaultTemplate = await prisma.template.findFirst({
    where: { active: true, integrationType: IntegrationType.FORMS_ERP, contractType: ContractType.EXPERT_PARTNER },
  });

  let imported = 0;
  let skipped = 0;

  for (const sheetName of partnerSheets) {
    const ws = wb.Sheets[sheetName];
    const { name, integration, tasks } = parsePartnerSheet(ws);

    if (!name) { skipped++; continue; }

    const existing = await prisma.partner.findFirst({ where: { companyName: name } });
    if (existing) {
      console.log(`  SKIP: "${name}" already exists`);
      skipped++;
      continue;
    }

    const integrationType = INTEGRATION_MAP[integration] || IntegrationType.FORMS_ERP;

    const template = await prisma.template.findFirst({
      where: { active: true, integrationType, contractType: ContractType.EXPERT_PARTNER },
    }) || defaultTemplate;

    const allProgress = tasks.map((t) => t.progress);
    const overallProgress = allProgress.length > 0
      ? allProgress.reduce((a, b) => a + b, 0) / allProgress.length
      : 0;

    const isCompleted = overallProgress >= 0.99;

    const partner = await prisma.partner.create({
      data: {
        companyName: name,
        primaryContactEmail: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        lifecycleStatus: isCompleted
          ? PartnerLifecycleStatus.ACTIVE
          : PartnerLifecycleStatus.ONBOARDING,
      },
    });

    const onboarding = await prisma.onboarding.create({
      data: {
        partner: { connect: { id: partner.id } },
        integrationType,
        contractType: ContractType.EXPERT_PARTNER,
        template: template ? { connect: { id: template.id } } : undefined,
        status: isCompleted ? OnboardingStatus.COMPLETED : OnboardingStatus.ACTIVE,
        phases: {
          create: [1, 2, 3, 4, 5].map((seq) => {
            const phaseTasks = tasks.filter((t) => resolvePhaseSequence(t.phase) === seq);
            const phaseProgress = phaseTasks.length > 0
              ? phaseTasks.reduce((a, t) => a + t.progress, 0) / phaseTasks.length
              : 0;

            let status: PhaseStatus;
            if (phaseProgress >= 0.99) status = PhaseStatus.COMPLETED;
            else if (phaseProgress > 0) status = PhaseStatus.IN_PROGRESS;
            else status = PhaseStatus.NOT_STARTED;

            return { sequence: seq, name: PHASE_NAMES[seq], status };
          }),
        },
      },
      include: { phases: { orderBy: { sequence: 'asc' } } },
    });

    for (const task of tasks) {
      const phaseSeq = resolvePhaseSequence(task.phase);
      const phase = onboarding.phases.find((p: { sequence: number }) => p.sequence === phaseSeq);
      if (!phase) continue;

      const taskStatus = STATUS_MAP[task.status] || TaskStatus.NOT_ACTIVE;
      const ownerRole = ROLE_MAP[task.responsible] || UserRole.BDM;

      await prisma.task.create({
        data: {
          phase: { connect: { id: phase.id } },
          title: task.title,
          description: [task.notes, task.deliverable ? `Deliverable: ${task.deliverable}` : null]
            .filter(Boolean).join(' | ') || null,
          ownerRole,
          status: taskStatus,
        },
      });
    }

    imported++;
    console.log(`  OK: "${name}" (${integration}) — ${tasks.length} taken, ${Math.round(overallProgress * 100)}%`);
  }

  console.log(`\nKlaar! ${imported} partners geïmporteerd, ${skipped} overgeslagen.`);
}

importExcel()
  .catch((e) => { console.error('Import failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
