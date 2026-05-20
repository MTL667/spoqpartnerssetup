import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, TaskStatus } from '@prisma/client';

export interface TaskBlueprint {
  title: string;
  description?: string;
  ownerRole: UserRole;
  phaseSequence: number;
  offsetDays?: number;
  subTasks?: SubTaskBlueprint[];
  checklistItems?: string[];
  deliverables?: { title: string; requiredByRole: UserRole }[];
  dependsOn?: string[];
}

interface SubTaskBlueprint {
  title: string;
  description?: string;
  ownerRole: UserRole;
  checklistItems?: string[];
}

const DEFAULT_BLUEPRINTS: TaskBlueprint[] = [
  {
    title: 'Partner Agreement Verification',
    description: 'Verify signed partner agreement and contract terms',
    ownerRole: UserRole.BDM,
    phaseSequence: 1,
    offsetDays: -60,
    checklistItems: ['Contract signed', 'Terms verified', 'Contact details confirmed'],
    deliverables: [{ title: 'Signed Partner Agreement', requiredByRole: UserRole.PARTNER }],
  },
  {
    title: 'Partner Portal Account Setup',
    description: 'Create partner portal credentials and initial configuration',
    ownerRole: UserRole.IT,
    phaseSequence: 2,
    offsetDays: -45,
    dependsOn: ['Partner Agreement Verification'],
    subTasks: [
      { title: 'Create partner user account', ownerRole: UserRole.IT },
      { title: 'Configure partner permissions', ownerRole: UserRole.IT },
    ],
    checklistItems: ['Portal access tested', 'Welcome email sent'],
  },
  {
    title: 'Technical Integration Configuration',
    description: 'Set up integration endpoints and test connectivity',
    ownerRole: UserRole.IT,
    phaseSequence: 2,
    offsetDays: -40,
    dependsOn: ['Partner Portal Account Setup'],
    checklistItems: ['API endpoints configured', 'Test connection successful', 'Error handling verified'],
  },
  {
    title: 'Marketing Asset Collection',
    description: 'Collect logos, product images, and marketing materials from partner',
    ownerRole: UserRole.MARKETING,
    phaseSequence: 3,
    offsetDays: -30,
    deliverables: [
      { title: 'Partner Logo (high-res)', requiredByRole: UserRole.PARTNER },
      { title: 'Product Images', requiredByRole: UserRole.PARTNER },
    ],
    checklistItems: ['Logo meets brand guidelines', 'Images approved'],
  },
  {
    title: 'Partner Content Page Creation',
    description: 'Create partner landing page and product descriptions',
    ownerRole: UserRole.MARKETING,
    phaseSequence: 3,
    offsetDays: -20,
    dependsOn: ['Marketing Asset Collection'],
    checklistItems: ['Content drafted', 'Partner approved content', 'Published to staging'],
  },
  {
    title: 'Sales Enablement Setup',
    description: 'Prepare sales team with partner product knowledge and pricing',
    ownerRole: UserRole.SALES,
    phaseSequence: 4,
    offsetDays: -14,
    checklistItems: ['Pricing configured', 'Sales deck available', 'Team briefed'],
  },
  {
    title: 'Go-Live Readiness Review',
    description: 'Final review before partner goes live',
    ownerRole: UserRole.BDM,
    phaseSequence: 4,
    offsetDays: -7,
    dependsOn: ['Partner Content Page Creation', 'Sales Enablement Setup', 'Technical Integration Configuration'],
    checklistItems: ['All prerequisites met', 'Partner confirmed ready', 'Go-live date confirmed'],
  },
  {
    title: 'Post-Launch Monitoring',
    description: 'Monitor partner performance and address initial issues',
    ownerRole: UserRole.BDM,
    phaseSequence: 5,
    offsetDays: 7,
    dependsOn: ['Go-Live Readiness Review'],
    checklistItems: ['First week metrics reviewed', 'Partner feedback collected', 'Issues documented'],
  },
];

@Injectable()
export class TaskGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generateTasksForOnboarding(onboardingId: string, blueprints?: TaskBlueprint[]) {
    const onboarding = await this.prisma.onboarding.findUnique({
      where: { id: onboardingId },
      include: { phases: { orderBy: { sequence: 'asc' } } },
    });

    if (!onboarding) throw new BadRequestException('Onboarding not found');
    if (onboarding.phases.length === 0) throw new BadRequestException('No phases exist');

    const taskBlueprints = blueprints ?? DEFAULT_BLUEPRINTS;
    const phaseMap = new Map(onboarding.phases.map((p) => [p.sequence, p.id]));
    const taskTitleToId = new Map<string, string>();

    for (const bp of taskBlueprints) {
      const phaseId = phaseMap.get(bp.phaseSequence);
      if (!phaseId) {
        throw new BadRequestException(`Phase sequence ${bp.phaseSequence} not found`);
      }

      const task = await this.prisma.task.create({
        data: {
          phaseId,
          title: bp.title,
          description: bp.description,
          ownerRole: bp.ownerRole,
          offsetDays: bp.offsetDays,
          status: bp.dependsOn?.length ? TaskStatus.BLOCKED : TaskStatus.NOT_ACTIVE,
        },
      });

      taskTitleToId.set(bp.title, task.id);

      if (bp.subTasks) {
        for (const st of bp.subTasks) {
          await this.prisma.task.create({
            data: {
              phaseId,
              title: st.title,
              description: st.description,
              ownerRole: st.ownerRole,
              parentTaskId: task.id,
              status: TaskStatus.NOT_ACTIVE,
            },
          });
        }
      }

      if (bp.checklistItems) {
        for (const text of bp.checklistItems) {
          await this.prisma.checklistItem.create({
            data: { taskId: task.id, text },
          });
        }
      }

      if (bp.deliverables) {
        for (const del of bp.deliverables) {
          await this.prisma.deliverableRequirement.create({
            data: {
              taskId: task.id,
              title: del.title,
              requiredByRole: del.requiredByRole,
            },
          });
        }
      }
    }

    for (const bp of taskBlueprints) {
      if (!bp.dependsOn?.length) continue;
      const successorId = taskTitleToId.get(bp.title);
      if (!successorId) continue;

      for (const depTitle of bp.dependsOn) {
        const predecessorId = taskTitleToId.get(depTitle);
        if (!predecessorId) continue;

        await this.prisma.taskDependency.create({
          data: { predecessorTaskId: predecessorId, successorTaskId: successorId },
        });
      }
    }

    return this.prisma.task.findMany({
      where: { phase: { onboardingId } },
      include: {
        checklistItems: true,
        deliverableRequirements: true,
        subTasks: true,
        predecessors: true,
      },
      orderBy: [{ phase: { sequence: 'asc' } }, { createdAt: 'asc' }],
    });
  }
}
