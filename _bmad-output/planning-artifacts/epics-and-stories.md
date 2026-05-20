# Epics and Stories - SPOQ Partner Onboarding App

**Date:** 2026-05-19  
**Source Inputs:** `prd.md`, `architecture.md`

## Epic Overview

1. **Epic 1 - Secure Foundation and Access Control**  
   Deliver role-based secure access and account governance so every actor can safely use the platform.
2. **Epic 2 - Onboarding Process Engine**  
   Deliver template-driven onboarding creation, dependency-aware tasks, and deliverable orchestration.
3. **Epic 3 - Operational Visibility and Collaboration**  
   Deliver BDM alerting, role-focused execution, comments/tags, and notification flow.
4. **Epic 4 - Partner Portal Experience**  
   Deliver partner self-service visibility and upload participation with strict visibility boundaries.
5. **Epic 5 - Lifecycle and Configuration Governance**  
   Deliver template lifecycle rules, phase model, archival integrity, and language switching.

## Story Breakdown

## Epic 1 - Secure Foundation and Access Control

### Story 1.1 - User Authentication and Session Timeout
As an internal or partner user, I can sign in and be automatically logged out after inactivity so account access remains secure.

**Acceptance Criteria**
- Given valid credentials, when the user signs in, then a secure authenticated session is created.
- Given an inactive session beyond configured timeout, when no activity occurs, then the session expires and re-authentication is required.
- Given an unauthenticated request to protected endpoints, when access is attempted, then the API returns authorization failure.

### Story 1.2 - Admin User Lifecycle Management
As an Admin, I can create, update, and deactivate user accounts so operational access can be controlled.

**Acceptance Criteria**
- Given admin privileges, when creating a user, then role and locale can be assigned.
- Given an active user, when deactivated, then login is blocked immediately.
- Given user updates, when changes are saved, then an audit event is recorded.

### Story 1.3 - Role-Based Access Matrix Enforcement
As a system, I enforce role-specific capabilities and partner data boundaries so users only see allowed data.

**Acceptance Criteria**
- Given any API call, when role policy is evaluated, then unauthorized actions are denied server-side.
- Given partner users, when requesting data, then only own-company records are returned.
- Given internal users, when requesting data, then results follow role-specific visibility rules from PRD.

### Story 1.4 - Future Business Developer Scoped Access
As a Business Developer (future role), I can only access assigned partner portfolio data so responsibility boundaries are preserved.

**Acceptance Criteria**
- Given Business Developer role, when listing partners, then only assigned partners are shown.
- Given unassigned partner details URL, when accessed, then authorization is denied.
- Given assignment change, when saved, then access scope updates without code redeploy.

## Epic 2 - Onboarding Process Engine

### Story 2.1 - Create Onboarding from Configuration
As a BDM, I can create a partner onboarding with integration and contract type so the correct process path starts instantly.

**Acceptance Criteria**
- Given partner details and configuration inputs, when onboarding is created, then a unique onboarding record is persisted.
- Given selected integration/contract combination, when saved, then matching template version is resolved.
- Given successful creation, when completed, then initial phase and task context exists.

### Story 2.2 - Generate Task Hierarchy from Template
As a system, I generate phases, main tasks, subtasks, checklists, and deliverable requirements so onboarding structure is standardized.

**Acceptance Criteria**
- Given a template version, when onboarding is initialized, then full hierarchy is generated.
- Given generated tasks, when viewed, then role ownership and prerequisite metadata are present.
- Given missing template components, when generation runs, then validation errors prevent incomplete onboarding creation.

### Story 2.3 - Backward Planning from Go-Live Date
As a BDM, I can set a target go-live date so deadlines are auto-calculated and visible for all tasks.

**Acceptance Criteria**
- Given a target go-live date, when planning runs, then all deadlines are calculated backwards using configured offsets.
- Given a deadline exception, when BDM edits a task due date, then override is stored with audit trail.
- Given changed go-live date, when recalculation is requested, then updated schedule is applied consistently.

### Story 2.4 - Task Dependency and Status Engine
As a system, I prevent invalid task activation and track status lifecycle so execution remains predictable.

**Acceptance Criteria**
- Given unmet predecessor tasks, when dependent task is evaluated, then status is blocked.
- Given completed predecessor tasks, when dependency is satisfied, then dependent task can become active.
- Given each task lifecycle transition, when status changes, then state is one of not-active, active, blocked, overdue, completed.

### Story 2.5 - Deliverable Chain and Auto-Unblock
As a system, I treat uploaded or produced deliverables as prerequisites so downstream work is unlocked automatically.

**Acceptance Criteria**
- Given a required deliverable upload, when file is accepted, then prerequisite is marked fulfilled.
- Given fulfilled prerequisites, when dependency checks execute, then blocked downstream tasks become active.
- Given task detail view, when opened, then fulfilled and missing prerequisites are clearly listed.

### Story 2.6 - Checklist-Based Trust Completion
As an assigned user, I can complete checklist items and tasks so work progresses without unnecessary approvals.

**Acceptance Criteria**
- Given an assigned task, when checklist items are marked complete, then completion metadata is stored.
- Given all required completion conditions met, when user marks task complete, then task transitions successfully.
- Given completion events, when processed, then downstream notifications are triggered.

## Epic 3 - Operational Visibility and Collaboration

### Story 3.1 - Alert-Driven BDM Dashboard
As a BDM, I see blocked, overdue, and at-risk partners prioritized by severity so I can intervene quickly.

**Acceptance Criteria**
- Given active onboardings, when dashboard loads, then prioritized risk list is returned within target SLA.
- Given risk state changes, when data refresh occurs, then color-coded indicators update.
- Given partner selection, when drill-down is opened, then blocked task, owner, and reason are visible.

### Story 3.2 - Personal Task Notification Center
As an internal user, I can view my assigned tasks and deadlines in one place so I know what requires action today.

**Acceptance Criteria**
- Given assigned tasks, when notification center opens, then relevant items are listed with due dates.
- Given activation or prerequisite fulfillment events, when processed, then new notification entries appear.
- Given acknowledged items, when marked read, then status is persisted per user.

### Story 3.3 - Commenting and Mention Collaboration
As an internal user, I can comment on tasks and tag colleagues or partner contacts so issue resolution stays in context.

**Acceptance Criteria**
- Given a task, when a comment is posted, then it is visible according to role/partner scope rules.
- Given a tag mention, when comment is saved, then target user receives a notification event.
- Given partner visibility restrictions, when internal-only comments exist, then partner users cannot access them.

### Story 3.4 - Outlook Email Notification Delivery
As a system, I send email notifications for key events through Outlook so users are informed without manual follow-up.

**Acceptance Criteria**
- Given activation/deadline/tag events, when notification routing runs, then Outlook email jobs are created.
- Given temporary provider failure, when send attempts fail, then retries execute without blocking core workflows.
- Given permanent failure, when retry limit is reached, then failure is logged and observable.

## Epic 4 - Partner Portal Experience

### Story 4.1 - Partner Invitation and Login
As a BDM, I can invite partner contacts and provide portal access so partners can participate directly.

**Acceptance Criteria**
- Given partner contact details, when invitation is sent, then credentials/onboarding link are delivered.
- Given partner first login, when authenticated, then only own-company portal context is available.
- Given disabled partner account, when login attempted, then access is denied.

### Story 4.2 - Partner Progress and Action View
As a partner contact, I can view phase progress, timelines, and required actions so I know exactly what to do next.

**Acceptance Criteria**
- Given active onboarding, when partner portal loads, then current phase and progress bar are visible.
- Given pending partner obligations, when viewing action list, then required uploads/responses are listed.
- Given schedule updates, when data refreshes, then planned dates are updated in portal.

### Story 4.3 - Partner Upload and Response Loop
As a partner contact, I can upload requested files and respond to tagged comments so collaboration is frictionless.

**Acceptance Criteria**
- Given requested assets, when partner uploads files, then deliverables are linked to corresponding requests.
- Given partner upload completion, when prerequisite checks run, then dependent internal tasks are unblocked.
- Given tagged partner mention, when notification is delivered, then partner can respond in-context.

## Epic 5 - Lifecycle and Configuration Governance

### Story 5.1 - Template Management by BDM
As a BDM, I can create and edit onboarding templates by integration/contract combination so future onboardings follow updated standards.

**Acceptance Criteria**
- Given BDM permissions, when template is created/edited, then phase/task/checklist/dependency blueprint is saved.
- Given template publish action, when validated, then new version becomes active for future onboardings.
- Given invalid dependency graph, when publish attempted, then system blocks publish with actionable errors.

### Story 5.2 - Active vs Future Onboarding Isolation
As a system, I apply template changes only to future onboardings so active onboardings remain stable.

**Acceptance Criteria**
- Given active onboarding instances, when template changes are published, then existing instances remain unchanged.
- Given new onboarding creation after publish, when generated, then latest active template version is used.
- Given template version history, when queried, then change lineage is available for audit/reference.

### Story 5.3 - Phase Model and Archival Integrity
As a BDM, I can track 5-phase onboarding (including combined Go-to-Market) and retain completed records for historical analysis.

**Acceptance Criteria**
- Given onboarding lifecycle progression, when phases advance, then configured 5-phase model is enforced.
- Given completion, when onboarding is archived, then records remain searchable and readable.
- Given historical dataset growth, when archive queries run, then active workflow performance remains within targets.

### Story 5.4 - Bilingual Experience Toggle
As a user, I can switch between Dutch and English UI so I can work in preferred language.

**Acceptance Criteria**
- Given supported locales, when user switches language, then UI labels and system messages update.
- Given notification templates, when language is configured, then user receives localized messages.
- Given unsupported locale fallback, when selected accidentally, then system defaults safely to Dutch.

## FR Coverage Map

| FR | Covered By |
| --- | --- |
| FR1 | Story 2.1 |
| FR2 | Story 2.2 |
| FR3 | Story 2.3 |
| FR4 | Story 2.3 |
| FR5 | Story 5.3 |
| FR6 | Story 3.1 |
| FR7 | Story 2.2 |
| FR8 | Story 2.4 |
| FR9 | Story 2.4, Story 3.2 |
| FR10 | Story 2.5 |
| FR11 | Story 2.2, Story 2.6 |
| FR12 | Story 2.6 |
| FR13 | Story 5.1 |
| FR14 | Story 2.4 |
| FR15 | Story 3.1 |
| FR16 | Story 3.1 |
| FR17 | Story 3.1 |
| FR18 | Story 3.2 |
| FR19 | Story 3.2, Story 3.4 |
| FR20 | Story 4.1 |
| FR21 | Story 4.2 |
| FR22 | Story 4.2 |
| FR23 | Story 1.3, Story 4.1 |
| FR24 | Story 4.3 |
| FR25 | Story 3.3, Story 4.3 |
| FR26 | Story 4.2 |
| FR27 | Story 5.1 |
| FR28 | Story 5.1 |
| FR29 | Story 5.2 |
| FR30 | Story 5.3 |
| FR31 | Story 1.2 |
| FR32 | Story 1.2 |
| FR33 | Story 1.3 |
| FR34 | Story 1.3 |
| FR35 | Story 1.4 |
| FR36 | Story 2.5, Story 4.3 |
| FR37 | Story 2.5 |
| FR38 | Story 2.5 |
| FR39 | Story 3.3 |
| FR40 | Story 3.3 |
| FR41 | Story 3.4 |
| FR42 | Story 5.4 |

## Dependency Rules

- Epics are ordered for value delivery and implementation safety.
- No epic depends on a future epic for baseline function.
- Story dependencies flow forward only within each epic.
- Cross-epic references are limited to previously delivered foundation capabilities.
