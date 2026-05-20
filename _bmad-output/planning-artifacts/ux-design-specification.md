# UX Design Specification - SPOQ Partner Onboarding App

**Date:** 2026-05-19  
**Source Inputs:** `prd.md`, `architecture.md`, `epics-and-stories.md`

## 1. UX Objectives

- Help BDMs identify and resolve onboarding risk quickly.
- Make cross-role task execution unambiguous and low-friction.
- Give partners transparent progress and simple self-service actions.
- Preserve strict visibility boundaries while keeping collaboration contextual.
- Support Dutch-first usage with English fallback.

## 2. Primary Personas

- **BDM (Primary):** Needs risk-first overview across all partners.
- **Internal Specialist (IT/Marketing/Sales):** Needs clear assigned work with prerequisites.
- **Partner Contact (External):** Needs clear status, required actions, and upload flow.
- **Admin:** Needs user/role management and system configuration controls.

## 3. Information Architecture

## 3.1 Internal App Navigation

1. Dashboard
2. Partners
3. Tasks
4. Notifications
5. Templates (BDM)
6. Admin (Admin role)
7. Settings (profile/language)

## 3.2 Partner Portal Navigation

1. Progress Overview
2. Action Items
3. Files
4. Comments/Mentions
5. Help and Contact

## 4. Core Screens and Behaviors

### 4.1 BDM Alert Dashboard

**Purpose:** Immediate triage of blocked/overdue/at-risk onboardings.

**Key UI Blocks**
- Risk summary cards (red/orange/green counts).
- Prioritized partner risk list.
- "Why blocked" panel: blocker task, owner, elapsed delay.
- Quick actions: reassign, comment/tag, adjust deadline.

**Interaction Rules**
- Default sort: severity, then deadline urgency.
- Drill-down from partner row opens blocker-first detail view.
- Color labels supplemented by icons/text for accessibility.

### 4.2 Partner Workspace (Internal)

**Purpose:** Full onboarding context for one partner.

**Key UI Blocks**
- Phase timeline with current phase highlight.
- Task hierarchy (phase > main task > subtasks).
- Prerequisite and deliverable indicators.
- Activity stream with comments and mentions.

**Interaction Rules**
- Blocked tasks show explicit blocking reason and missing prerequisite.
- Overdue tasks show delay duration and owner.
- Completing tasks/checklist items immediately updates local state and queues sync.

### 4.3 Personal Notification Center

**Purpose:** User-level actionable feed.

**Key UI Blocks**
- "Needs action today" list.
- Event tabs: assigned, due soon, mentions, completed handoffs.
- Filter by partner and due date.

**Interaction Rules**
- New events pinned at top until acknowledged.
- Clicking event deep-links to exact task context.

### 4.4 Partner Portal Overview

**Purpose:** Transparent, safe external experience.

**Key UI Blocks**
- Progress bar by onboarding phases.
- Current phase description and expected timeline.
- Action item list with upload/respond controls.
- Mention alerts requiring partner response.

**Interaction Rules**
- No internal comments, internal assignees, or other-partner data exposed.
- Upload confirmations include immediate status feedback.
- Partner can only see their own company onboarding scope.

### 4.5 Template Management (BDM)

**Purpose:** Maintain reusable onboarding blueprints.

**Key UI Blocks**
- Template list by integration/contract type.
- Template editor: phases, tasks, dependencies, checklist items, default roles.
- Version history and publish controls.

**Interaction Rules**
- Dependency cycle checks run before publish.
- Publish warning clarifies "future onboardings only."

### 4.6 User and Role Administration (Admin)

**Purpose:** Manage access lifecycle.

**Key UI Blocks**
- User table with status and role.
- Create/edit/deactivate user modal.
- Access policy summary view.

## 5. Role-Based UX Rules

- **Admin:** Full visibility and management controls.
- **BDM:** Full partner and process visibility; template controls.
- **IT/Sales:** Task-centric views for assigned work and prerequisites.
- **Marketing:** Full context visible but non-assigned tasks visually de-emphasized (blur/dim pattern).
- **Partner:** Only own-company, high-level progress and own action items.

## 6. Key User Flows

### Flow A - Monday BDM Triage

1. Open dashboard.
2. Review top red partners.
3. Open blocker detail.
4. Reassign/tag and adjust deadline.
5. Confirm risk state updates.

### Flow B - New Partner Setup

1. Start onboarding.
2. Choose integration + contract type.
3. Set go-live target date.
4. Review generated tasks and deadlines.
5. Activate onboarding and trigger invitations/notifications.

### Flow C - Partner Upload Completion

1. Partner opens action item.
2. Uploads required asset(s).
3. Sees confirmation and progress update.
4. Internal dependent tasks become unblocked.

### Flow D - Internal Task Execution

1. User opens notification center.
2. Selects assigned task.
3. Completes checklist and task.
4. System hands off to downstream role.

## 7. UX States and Feedback

- **Task states:** not active, active, blocked, overdue, completed.
- **Feedback patterns:**
  - Success toasts for completion/upload.
  - Inline errors with remediation guidance.
  - Persistent warning banners for blocked/overdue items.
- **Empty states:** instructional prompts for no tasks, no alerts, no action items.

## 8. Accessibility and Localization

- Keyboard navigable primary workflows (dashboard triage, task updates, uploads).
- Color is never the only status indicator.
- Text contrast follows WCAG AA targets.
- Form inputs and uploads use clear labels and validation hints.
- Locale support:
  - Default: Dutch (`nl-NL`)
  - Secondary: English (`en`)

## 9. UX-to-PRD Alignment

- Dashboard alerting aligns with FR15-FR17.
- Personal task panel aligns with FR18-FR19.
- Partner portal transparency and boundaries align with FR21-FR26 and FR23/FR34.
- Template and configuration flows align with FR27-FR30.
- Admin lifecycle controls align with FR31-FR33.
- Bilingual UX aligns with FR42.

## 10. UX-to-Architecture Alignment

- Requires low-latency dashboard read models and event-driven updates.
- Depends on server-side RBAC and partner scope filtering.
- Upload UX depends on resilient file + prerequisite orchestration services.
- Notification UX depends on in-app event feed plus Outlook adapter.

## 11. Open UX Decisions (for iteration)

- Exact visualization style for risk trend over time (table-first vs chart-first).
- Mobile breakpoint behavior (view-only vs full interaction subset).
- Notification digest preferences (real-time only vs optional batching).
