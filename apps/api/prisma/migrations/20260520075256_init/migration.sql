-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'BDM', 'BD', 'IT', 'MARKETING', 'SALES', 'PARTNER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('FORMS_ERP', 'PARTNER_PORTAL', 'API_INTEGRATION');

-- CreateEnum
CREATE TYPE "ContractType" AS ENUM ('EXPERT_PARTNER', 'SOFTWARE_PARTNER');

-- CreateEnum
CREATE TYPE "PartnerLifecycleStatus" AS ENUM ('ONBOARDING', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "OnboardingStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('NOT_ACTIVE', 'ACTIVE', 'BLOCKED', 'OVERDUE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('TASK_ACTIVATED', 'TASK_OVERDUE', 'DEADLINE_APPROACHING', 'PREREQUISITE_FULFILLED', 'MENTION', 'DELIVERABLE_UPLOADED');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "CommentVisibility" AS ENUM ('INTERNAL', 'ALL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'nl',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "partnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "primaryContactEmail" TEXT NOT NULL,
    "lifecycleStatus" "PartnerLifecycleStatus" NOT NULL DEFAULT 'ONBOARDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "integrationType" "IntegrationType" NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateTaskBlueprint" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "phaseSequence" INTEGER NOT NULL,
    "ownerRole" "UserRole" NOT NULL,
    "offsetDays" INTEGER,
    "parentKey" TEXT,
    "dependsOnKeys" TEXT[],
    "checklistItems" TEXT[],
    "deliverables" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TemplateTaskBlueprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Onboarding" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "integrationType" "IntegrationType" NOT NULL,
    "contractType" "ContractType" NOT NULL,
    "templateVersionId" TEXT,
    "targetGoLiveDate" TIMESTAMP(3),
    "status" "OnboardingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Onboarding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingPhase" (
    "id" TEXT NOT NULL,
    "onboardingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "OnboardingPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ownerRole" "UserRole" NOT NULL,
    "assigneeId" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'NOT_ACTIVE',
    "dueDate" TIMESTAMP(3),
    "dueDateOverride" BOOLEAN NOT NULL DEFAULT false,
    "offsetDays" INTEGER,
    "parentTaskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "predecessorTaskId" TEXT NOT NULL,
    "successorTaskId" TEXT NOT NULL,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "checked" BOOLEAN NOT NULL DEFAULT false,
    "checkedBy" TEXT,
    "checkedAt" TIMESTAMP(3),

    CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeliverableRequirement" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "requiredByRole" "UserRole" NOT NULL,
    "fulfilled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DeliverableRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Deliverable" (
    "id" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storageRef" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Deliverable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BdPartnerAssignment" (
    "id" TEXT NOT NULL,
    "bdUserId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BdPartnerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "type" "NotificationType" NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "visibilityScope" "CommentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_partnerId_idx" ON "User"("partnerId");

-- CreateIndex
CREATE INDEX "Partner_lifecycleStatus_idx" ON "Partner"("lifecycleStatus");

-- CreateIndex
CREATE INDEX "Template_integrationType_contractType_active_idx" ON "Template"("integrationType", "contractType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "Template_integrationType_contractType_version_key" ON "Template"("integrationType", "contractType", "version");

-- CreateIndex
CREATE INDEX "TemplateTaskBlueprint_templateId_idx" ON "TemplateTaskBlueprint"("templateId");

-- CreateIndex
CREATE INDEX "Onboarding_partnerId_idx" ON "Onboarding"("partnerId");

-- CreateIndex
CREATE INDEX "Onboarding_status_idx" ON "Onboarding"("status");

-- CreateIndex
CREATE INDEX "OnboardingPhase_onboardingId_idx" ON "OnboardingPhase"("onboardingId");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingPhase_onboardingId_sequence_key" ON "OnboardingPhase"("onboardingId", "sequence");

-- CreateIndex
CREATE INDEX "Task_phaseId_idx" ON "Task"("phaseId");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");

-- CreateIndex
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- CreateIndex
CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_predecessorTaskId_successorTaskId_key" ON "TaskDependency"("predecessorTaskId", "successorTaskId");

-- CreateIndex
CREATE INDEX "ChecklistItem_taskId_idx" ON "ChecklistItem"("taskId");

-- CreateIndex
CREATE INDEX "DeliverableRequirement_taskId_idx" ON "DeliverableRequirement"("taskId");

-- CreateIndex
CREATE INDEX "Deliverable_requirementId_idx" ON "Deliverable"("requirementId");

-- CreateIndex
CREATE INDEX "BdPartnerAssignment_bdUserId_idx" ON "BdPartnerAssignment"("bdUserId");

-- CreateIndex
CREATE INDEX "BdPartnerAssignment_partnerId_idx" ON "BdPartnerAssignment"("partnerId");

-- CreateIndex
CREATE UNIQUE INDEX "BdPartnerAssignment_bdUserId_partnerId_key" ON "BdPartnerAssignment"("bdUserId", "partnerId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_status_idx" ON "Notification"("recipientId", "status");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_taskId_idx" ON "Comment"("taskId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");

-- CreateIndex
CREATE INDEX "Mention_commentId_idx" ON "Mention"("commentId");

-- CreateIndex
CREATE INDEX "Mention_targetUserId_idx" ON "Mention"("targetUserId");

-- CreateIndex
CREATE INDEX "AuditEvent_actorId_idx" ON "AuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_createdAt_idx" ON "AuditEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "TemplateTaskBlueprint" ADD CONSTRAINT "TemplateTaskBlueprint_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onboarding" ADD CONSTRAINT "Onboarding_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onboarding" ADD CONSTRAINT "Onboarding_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "Template"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingPhase" ADD CONSTRAINT "OnboardingPhase_onboardingId_fkey" FOREIGN KEY ("onboardingId") REFERENCES "Onboarding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "OnboardingPhase"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_predecessorTaskId_fkey" FOREIGN KEY ("predecessorTaskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_successorTaskId_fkey" FOREIGN KEY ("successorTaskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeliverableRequirement" ADD CONSTRAINT "DeliverableRequirement_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Deliverable" ADD CONSTRAINT "Deliverable_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "DeliverableRequirement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
