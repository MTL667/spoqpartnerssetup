---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation-skipped, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
releaseMode: phased
inputDocuments:
  - _bmad-output/brainstorming/brainstorming-session-2026-05-19-2121.md
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
  projectContext: 0
classification:
  projectType: saas_b2b
  domain: partner_relationship_management
  complexity: medium
  projectContext: greenfield
notes:
  - "User is non-technical; all technical decisions must be listed for later dev handoff"
---

# Product Requirements Document — SPOQ Partner Onboarding App

**Author:** Kevin
**Date:** 2026-05-19

## Executive Summary

SPOQ Partner Onboarding App is a dedicated B2B platform that replaces three Excel workbooks currently managing partner onboarding at SPOQ. As the company scales internationally, partner onboarding involves multiple internal roles (BDM, IT, Marketing, Sales) and external partners — creating coordination complexity that spreadsheets cannot handle. The BDM loses oversight when tasks are distributed across people with no shared system of record.

The platform provides a structured, alert-driven process engine for partner onboarding — from first contact through go-live. It is not a generic project management tool. Tasks, subtasks, checklists, and deliverables are intrinsic to the onboarding process: a document is not an attachment but a required output of a specific task. The system proactively surfaces blockers and deadlines, so the BDM always knows which partner needs attention and why.

Partners are active participants with their own login, self-service asset uploads, and transparent status visibility. The onboarding path adapts based on two configuration variables: integration type (Forms ERP / Partner Portal / API Integration) and contract type (Expert-Partner vs Software-Partner).

**Target users:** BDMs (primary), SPOQ IT, Marketing, Sales (internal roles), Partners (external role with limited portal access).

**Core problem:** International scaling has made Excel-based partner onboarding unmanageable. Tasks are spread across multiple people per partner, and the BDM — who owns the relationship — has no central overview.

### What Makes This Special

1. **Process-native task architecture** — Tasks are predefined, carry dependencies, produce deliverables that downstream tasks consume, and include standard checklists. The structure is the process.
2. **Alert-driven, not status-driven** — The dashboard shows what is broken, blocked, or at risk. The system chases; the human decides.
3. **Partner as collaborator** — Partners have their own login, upload their own assets (which automatically unblock dependent tasks), and see their onboarding status transparently.

## Project Classification

| Attribute | Value |
|---|---|
| Project Type | SaaS B2B Platform |
| Domain | Partner Relationship Management / Channel Operations |
| Complexity | Medium — multiple user roles, three configurable integration paths, task dependencies, external portal; no heavy regulatory requirements |
| Project Context | Greenfield — new product, replacing Excel-based workflows |
| Tenant Model | Single-tenant, SPOQ only. Internal operations tool, not a SaaS product for resale |
| Baseline Capacity | 35 internal users, 50 active partner onboardings |

## Success Criteria

### User Success

- **BDM:** Opens the app and immediately sees which partners need attention, why, and who is responsible — without clicking through multiple views. Time spent on coordination and status-chasing is measurably reduced.
- **BDM:** Onboarding steps that previously required manual follow-up (chasing Marketing for assets, checking if IT completed setup) are handled by the system through automated task handoff and notifications.
- **Partner:** Knows where they are in the onboarding process at any time. Can upload required assets without email back-and-forth. Feels like a participant, not a bystander.
- **Internal roles (IT, Marketing, Sales):** Receive clear, actionable tasks with context and prerequisites — no ambiguity about what to do or when.

### Business Success

- Average onboarding lead time decreases compared to current Excel-based process (baseline to be measured before launch).
- The platform supports international scaling without adding proportional coordination overhead per partner.
- Completed onboarding records are retained as historical data, enabling pattern analysis and process improvement over time.
- No fixed partner volume target — the system must handle fluctuating onboarding volumes gracefully.

### Measurable Outcomes

| Metric | Current State | Target |
|---|---|---|
| Time BDM spends on status coordination per partner | Manual (Excel + email + calls) | Reduced by system-driven alerts and task handoff |
| Average onboarding lead time | To be baselined | Measurable reduction |
| Partner self-service completion rate | 0% (no portal exists) | Partners independently upload required assets |
| Tasks requiring manual follow-up between roles | ~100% (all via email/calls) | Majority handled through system notifications |

## Phased Development Scope

### MVP (Phase 1) — Core Platform

**Strategy:** Problem-solving MVP — deliver the core platform that replaces Excel immediately. Usable for real partner onboarding from day one with all three integration paths available.

**All 6 user journeys supported from launch.**

*Theme 1 — Intelligent Dashboard & Alerting:*
- Alert-driven BDM dashboard showing blocked, overdue, and at-risk partners
- Blockage-first partner view with problem, owner, and evidence
- Deadline-driven backward planning from target go-live date
- Color-coded status indicators (green/orange/red)

*Theme 2 — Smart Task Architecture:*
- Main tasks with assignable subtasks per responsible role
- Task dependencies and automatic handoff between roles
- Deliverable chain: tasks produce assets that downstream tasks consume
- Standard checklists embedded in tasks
- Trust-based checkbox completion
- Push notifications on task activation

*Theme 3 — Partner as Active Participant:*
- Partner login with filtered high-level view (no internal data visible)
- Transparent phase progress and scheduled dates
- Self-service asset upload that unblocks downstream tasks
- Tagged notifications for partner-relevant comments

*Theme 4 — Configuration & Process Paths:*
- Three integration paths: Forms ERP / Partner Portal / API Integration
- Two contract types: Expert-Partner / Software-Partner
- Combined Phase 4+5 as "Go-to-Market" (5 phases total)
- The proven phase model as process backbone

*Platform Essentials:*
- Role-based access control (BDM, IT, Marketing, Sales, Partner, Admin)
- Blurred/dimmed view for unassigned tasks (Marketing pattern)
- User management and role assignment (Admin)
- Template management by BDM
- Bilingual UI (Dutch primary, English secondary)
- Completed onboarding archival and retention
- Outlook integration for email notifications

### Growth (Phase 2) — Context Integration

*Theme 5 — Context Integration & Information Flow:*
- DocuSign integration (contract status, signed document retrieval)
- Circleback integration (meeting transcript linking)
- SharePoint integration (document storage and retrieval)
- Prerequisite asset visibility improvements
- Business Developer role (scoped to own partner portfolio)

### Vision (Phase 3) — Extended Capabilities

*Theme 6 — Activity Logging & Personal Task Management:*
- Activity log per task with assignee and deadline
- Personal "today" widget (Odoo-style)

*Theme 7 — Self-Service Intake:*
- Partner self-registration flow as system front door

### Risk Mitigation

**Adoption Risks:** Low — the team is motivated and the current Excel process is a clear pain point. Speed of delivery is the primary success factor.

**Contingency:** If resources are constrained, Outlook integration and bilingual UI could shift to Phase 2 without breaking core functionality.

## User Journeys

### Journey 1: Sarah (BDM) — Monday Morning Overview

Sarah is a Business Development Manager responsible for 14 active partner onboardings across three countries. She opens the app on Monday morning.

**Opening Scene:** Sarah's dashboard loads with an alert-driven overview. Three partners are flagged red — one has a blocked IT task overdue by 3 days, another is missing marketing assets with a go-live deadline in 2 weeks, and a third has an unresponsive partner contact. Sarah didn't have to dig for this — the system surfaced it.

**Rising Action:** She clicks into the blocked IT task. The system shows: task "Configure Partner Portal Access" assigned to Tom (IT), due 3 days ago, blocking 2 downstream tasks. Sarah adds a comment tagging Tom and sets a new deadline. She then checks her personal notification panel (Odoo-style) — it shows 4 tasks that need her attention today: approve a contract deviation, review uploaded partner assets, confirm a go-live date, and check a completed checklist.

**Climax:** Sarah completes her 4 tasks in 20 minutes. Each completion automatically triggers the next step: the contract approval unblocks Legal review, the asset review unblocks Marketing's campaign preparation, the go-live confirmation triggers backward deadline planning for all remaining tasks.

**Resolution:** By 9:30 AM, Sarah has full clarity on all 14 partners. She knows exactly which ones are on track, which need intervention, and who is responsible. No emails sent, no Excel files opened, no status meetings needed.

*Capabilities revealed: alert dashboard, task notifications, task reassignment, comment/tag system, automatic task handoff, backward deadline planning, personal task widget.*

### Journey 2: Sarah (BDM) — New Partner Setup

A new Expert-Partner contract has been signed. Sarah needs to kick off onboarding.

**Opening Scene:** Sarah creates a new partner onboarding in the system. She selects the integration type (Partner Portal) and contract type (Expert-Partner). The system generates the full task structure: 5 phases with predefined main tasks, subtasks, checklists, and deliverable requirements — all pre-configured from the templates Sarah maintains.

**Rising Action:** Sarah sets the target go-live date. The system calculates backward deadlines for every task across all phases. She assigns the partner contact, which triggers an automatic invitation email. She reviews the generated task list, adjusts one deadline for a known holiday period, and activates the onboarding.

**Climax:** Within minutes, IT receives their first task notifications, the partner receives their login credentials, and the system begins tracking progress from day one.

**Resolution:** What used to take Sarah an hour of Excel setup and multiple emails is now a 5-minute configuration. The process is standardized but flexible where it matters.

*Capabilities revealed: partner creation, integration/contract type selection, template-based task generation, backward planning from go-live date, partner invitation, task assignment, deadline adjustment.*

### Journey 3: Marc (Partner Contact) — Onboarding Experience

Marc is the main contact at a new Expert-Partner company. He just received his login credentials.

**Opening Scene:** Marc logs into the partner portal. He sees a clean, high-level overview: 5 phases displayed as a progress bar, his company's current phase highlighted, and a list of items that need his attention. He cannot see internal SPOQ comments, task assignments between SPOQ employees, or any internal process details.

**Rising Action:** Marc's first task: upload company logo, product photos, and a signed data processing agreement. He uploads the files directly in the system. Each upload is confirmed, and the progress bar updates. He sees that "Marketing Materials Preparation" is the next phase and its estimated start date.

**Climax:** Marc uploads the last required photo set. The system immediately notifies the Marketing team that all partner assets are available — a task that previously required 3 email follow-ups over 2 weeks.

**Resolution:** Marc can check his onboarding status anytime. When someone at SPOQ tags him in a comment, he receives a notification and can respond in-context. He feels informed and in control, not left in the dark wondering "where are we?"

*Capabilities revealed: partner portal, high-level status view, filtered visibility (no internal data), file upload, automatic downstream unblocking, tagged notifications, progress tracking.*

### Journey 4: Tom (SPOQ IT) — Task Execution

Tom handles the technical integration tasks for partner onboarding.

**Opening Scene:** Tom opens his notification panel. He has 3 new tasks across different partners — all activated because their predecessors were completed. Each task shows: what to do, which partner, deadline, and any prerequisite deliverables (e.g., signed DPA from the partner, configuration details from the BDM).

**Rising Action:** Tom opens the first task: "Configure ERP Forms Integration for Partner X." The checklist shows 6 subtasks. He completes them one by one, checking each off. When he finishes, the system shows the next task for this partner is assigned to Marketing — his part is done.

**Climax:** Tom completes all 3 tasks before lunch. He didn't need to ask anyone what to do, when it was due, or what information he needed — it was all in the task.

**Resolution:** Tom's work automatically triggers the next phase for each partner. The BDMs see green status updates on their dashboards. No "hey Tom, is it done yet?" messages needed.

*Capabilities revealed: role-based task view, push notifications, prerequisite visibility, checklist completion, automatic handoff on completion.*

### Journey 5: Lisa (Marketing) — Asset-Dependent Tasks

Lisa prepares marketing materials and partner pages for new partners.

**Opening Scene:** Lisa's tasks are blocked — she needs partner logos, product photos, and approved copy before she can create the partner page. The system shows these prerequisites clearly: 2 of 3 items uploaded by the partner, 1 still missing.

**Rising Action:** The partner uploads the final photo set. Lisa receives a notification: "All prerequisites for 'Create Partner Page' are now available." She opens the task and finds all assets linked directly — no searching through email attachments or shared drives.

**Climax:** Lisa completes the partner page and checks it off. The system automatically advances to the next Go-to-Market task.

**Resolution:** Lisa no longer chases partners or BDMs for missing materials. The system tracks what's needed, notifies when it arrives, and keeps everything in one place.

*Capabilities revealed: prerequisite asset tracking, blocked task visibility, automatic notification on prerequisite completion, deliverable linking.*

### Journey 6: Admin — System Configuration

The system administrator manages user accounts, role assignments, and system-level configuration.

**Opening Scene:** A new employee joins the Sales team. The admin creates their user account, assigns the Sales role, and the new user immediately sees only the tasks and views relevant to their role.

**Rising Action:** The admin also needs to update the standard onboarding template — a new compliance step has been added to Phase 3. They edit the master template, and the change applies to all future onboardings (existing active onboardings are not affected).

**Resolution:** The admin ensures the system stays current with organizational changes without disrupting active processes.

*Note: Template creation and task configuration is managed by BDMs. The admin role handles user management, role assignments, and system-level settings.*

*Capabilities revealed: user management, role assignment, role-based access control, template versioning.*

### Journey Requirements Summary

| Capability Area | Revealed By Journeys |
|---|---|
| Alert-driven dashboard | 1 |
| Personal task notifications (Odoo-style) | 1, 4, 5 |
| Partner creation & configuration | 2 |
| Template-based task generation | 2 |
| Backward deadline planning | 1, 2 |
| Partner portal (filtered high-level view) | 3 |
| File upload & deliverable chain | 3, 5 |
| Automatic task handoff | 1, 4, 5 |
| Checklist completion | 4 |
| Prerequisite tracking & notification | 5 |
| Comment/tag system (cross-role) | 1, 3 |
| User & role management | 6 |
| Template management (by BDM) | 2, 6 |

## Domain & Platform Requirements

### Compliance & Data

- **GDPR/AVG:** Fully addressed through existing partner contracts. No additional in-app consent flow required, but the system must handle personal data (partner contacts, uploaded documents) in accordance with GDPR principles (data minimization, secure storage, access logging).
- **Data retention on termination:** When a partner relationship ends, all onboarding data and uploaded assets remain property of SPOQ and are retained in the system.

### Localization

- **Primary language:** Dutch (NL) — all UI, notifications, and system messages.
- **Secondary language:** English — available as user-selectable alternative.

### Role-Based Access Control (RBAC)

| Role | Partner Visibility | Task Visibility | System Access |
|---|---|---|---|
| **Admin** | All | All | Full system configuration, user management |
| **BDM** | All partners | All tasks across all partners | Template management, partner creation, full dashboard |
| **Business Developer** (future) | Own assigned partners only | Tasks for own partners only | Limited dashboard scoped to own portfolio |
| **SPOQ IT** | All partners (task context) | Own assigned tasks + prerequisites | Task execution view |
| **Marketing** | All partners | Own tasks prominent; unassigned tasks visible but blurred/dimmed | Task execution view with full partner context |
| **Sales** | All partners (task context) | Own assigned tasks + prerequisites | Task execution view |
| **Partner** (external) | Own company only | High-level phase progress; own action items only | Partner portal — no internal comments, no other partner data, no SPOQ task details |

**Key access rules:**
- Partners are fully isolated from each other — zero cross-partner visibility.
- Internal roles see all partners but with emphasis on their own responsibilities.
- The "blurred" pattern for Marketing: tasks not assigned to you are visible but visually de-emphasized, keeping focus on actionable items while maintaining context.

### Integration Roadmap

| System | Purpose | Phase |
|---|---|---|
| **Outlook** | Email notifications, calendar integration for deadlines | MVP |
| **DocuSign** | Contract status tracking, signed document retrieval | Growth |
| **Circleback** | Meeting transcript linking to partner records | Growth |
| **SharePoint** | Document storage and retrieval, asset management | Growth |

### Platform Constraints

- Desktop-focused work tool. Responsive design is nice-to-have but not critical for MVP.
- No subscription tiers or billing infrastructure required.

## Functional Requirements

### Partner Onboarding Management

- **FR1:** BDM can create a new partner onboarding by providing partner details, selecting an integration type (Forms ERP / Partner Portal / API Integration), and selecting a contract type (Expert-Partner / Software-Partner).
- **FR2:** System generates the complete task structure (phases, main tasks, subtasks, checklists, deliverable requirements) based on the selected integration type and contract type.
- **FR3:** BDM can set a target go-live date, triggering automatic backward deadline calculation for all tasks across all phases.
- **FR4:** BDM can manually adjust individual task deadlines after generation.
- **FR5:** System retains completed onboarding records as archived historical data accessible for reference.
- **FR6:** BDM can view all partners across all onboarding phases with their current status.

### Task & Process Engine

- **FR7:** System supports a hierarchical task structure: phases contain main tasks, main tasks contain subtasks.
- **FR8:** Tasks can have dependencies on other tasks — a dependent task cannot be activated until its predecessor is completed.
- **FR9:** When a task is completed, the system automatically activates the next dependent task(s) and notifies the assigned role.
- **FR10:** Tasks can produce deliverables (files, approvals) that downstream tasks require as prerequisites.
- **FR11:** Tasks contain embedded checklists with items that can be checked off individually.
- **FR12:** Any assigned user can mark a task or checklist item as complete via trust-based checkbox completion.
- **FR13:** Conditional tasks can be included or excluded based on the partner's configuration (e.g., lawyer review only on contract deviation).
- **FR14:** System tracks task status: not yet active, active, blocked (waiting for prerequisite), overdue, completed.

### Dashboard & Alerting

- **FR15:** BDM can view an alert-driven dashboard that surfaces blocked, overdue, and at-risk partners — prioritized by severity.
- **FR16:** Dashboard displays color-coded status indicators (green/orange/red) based on deadline proximity and task completion.
- **FR17:** BDM can drill down from a partner overview to see the specific blocked task, its owner, and the blocking reason.
- **FR18:** Each internal user can view a personal notification panel showing tasks assigned to them with their deadlines.
- **FR19:** System sends push notifications to users when a task assigned to them is activated, a deadline approaches, or a prerequisite is fulfilled.

### Partner Portal

- **FR20:** Partner contact receives login credentials when invited by BDM.
- **FR21:** Partner can view a high-level overview of their onboarding progress by phase (progress bar and current phase indicator).
- **FR22:** Partner can see items that require their action (uploads, responses).
- **FR23:** Partner cannot see internal SPOQ comments, task assignments between SPOQ employees, or other partners' data.
- **FR24:** Partner can upload files (logos, photos, documents) directly in the system against specific requests.
- **FR25:** Partner receives notifications when tagged in a comment by an internal user, and can respond in-context.
- **FR26:** Partner can view scheduled dates and estimated phase timelines.

### Template & Configuration Management

- **FR27:** BDM can create and edit onboarding templates that define the standard task structure per integration type and contract type combination.
- **FR28:** Templates define: phases, main tasks per phase, subtasks per main task, checklist items, required deliverables, default role assignments, and relative deadline offsets.
- **FR29:** Changes to templates apply only to future onboardings — active onboardings are not affected.
- **FR30:** System supports 5 onboarding phases, with Phase 4+5 combined as "Go-to-Market."

### User & Access Management

- **FR31:** Admin can create, edit, and deactivate user accounts.
- **FR32:** Admin can assign roles to users (BDM, IT, Marketing, Sales, Partner, Admin).
- **FR33:** System enforces role-based visibility as defined in the RBAC matrix.
- **FR34:** Partners are fully isolated — zero visibility of other partners' data.
- **FR35:** System supports a future Business Developer role scoped to own assigned partners only.

### Document & Asset Management

- **FR36:** Users can upload files to tasks as deliverables.
- **FR37:** When a partner uploads a required asset, the system automatically marks the prerequisite as fulfilled and unblocks dependent downstream tasks.
- **FR38:** Task view displays linked deliverables and prerequisite assets, showing which are fulfilled and which are still missing.

### Communication & Notifications

- **FR39:** Internal users can add comments to tasks.
- **FR40:** Users can tag other users (including partners) in comments, triggering a notification to the tagged person.
- **FR41:** System sends email notifications via Outlook integration for task activations, approaching deadlines, and tag mentions.
- **FR42:** Users can switch the UI language between Dutch (primary) and English (secondary).

## Non-Functional Requirements

### Performance

- Dashboard and partner overview pages load within 2 seconds under normal usage (35 concurrent internal users, 50 active partner onboardings).
- Task completion and status updates reflect on other users' views within 5 seconds.
- File uploads (partner assets) up to 25 MB complete without timeout.

### Security

- Partner accounts are fully isolated — no data leakage between partners, no access to internal SPOQ data beyond their filtered view.
- All user sessions require authentication; inactive sessions expire after a configurable timeout.
- Role-based access control is enforced server-side — UI filtering alone is not sufficient.
- GDPR-compliant data handling: personal data minimization, secure storage, right to access upon request.

### Scalability

- System supports 35 internal users and 50 active partner onboardings as baseline.
- System must handle 3x growth (100 internal users, 150 active onboardings) without architecture changes.
- Completed onboarding archival must not degrade system performance as historical data accumulates over years.

### Integration Resilience

- Outlook email integration must support sending notifications without manual intervention (MVP).
- Integration failures (email delivery, external API downtime) must not block core task completion workflows — graceful degradation required.

## Appendix: Technical Decisions for Developer

*All items below require developer expertise and are deferred to the technical architecture phase. They are collected here as a single handoff list.*

### Architecture & Infrastructure

1. Hosting and infrastructure approach (cloud provider, scaling strategy)
2. SPA (Single Page Application) vs MPA (Multi-Page Application) approach
3. Real-time updates (WebSockets) vs polling for dashboard refresh and notifications
4. Database strategy for archival vs active data separation
5. Backup and disaster recovery requirements

### Authentication & Security

6. Authentication mechanism (email/password, SSO with existing SPOQ systems, MFA)
7. Session management and timeout configuration
8. Encryption at rest and in transit standards (TLS version, database encryption)
9. Audit logging scope (who accessed what, when) and retention period

### Integration Architecture

10. Outlook integration approach: native SMTP/IMAP, Microsoft Graph API, or webhook-based
11. DocuSign integration: full API integration or link-only (Growth phase)
12. Circleback integration: API availability and data format (Growth phase)
13. SharePoint integration: direct integration or file sync (Growth phase)
14. Retry and error handling strategy for external integrations
15. API design for future Growth-phase integrations

### UI & Localization

16. Localization approach: full i18n framework from the start, or hardcoded NL with English as secondary
17. Implementation of "blurred" UI pattern for Marketing role (opacity, collapsed state, filter toggle)

### Data & Storage

18. File storage approach for partner uploads (size limits, allowed formats, retention policy)
19. Performance benchmarks and load testing approach

### Team & Timeline

20. Minimum team composition and estimated timeline
21. Identification and early prototyping of highest-risk component (likely: task dependency engine with automatic handoff and backward deadline planning)
22. Validation of Outlook integration feasibility early in development
