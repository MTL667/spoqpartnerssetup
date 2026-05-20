# Solution Architecture - SPOQ Partner Onboarding App

**Date:** 2026-05-19  
**Source:** `_bmad-output/planning-artifacts/prd.md`

## 1. Architecture Goals

- Deliver MVP that replaces Excel workflows end-to-end for SPOQ partner onboarding.
- Enforce role-based visibility and strict partner data isolation.
- Implement dependency-driven task orchestration with automatic handoff.
- Meet PRD non-functional targets for performance, reliability, security, and growth.
- Keep design pragmatic for a single-tenant SPOQ deployment with future integrations.

## 2. System Context

### 2.1 Actors and Channels

- **Internal users:** BDM, IT, Marketing, Sales, Admin.
- **External users:** Partner contacts.
- **External systems:** Outlook (MVP), DocuSign/Circleback/SharePoint (Growth).

### 2.2 High-Level Context

1. Users access web app (desktop-first).
2. API gateway authenticates session and enforces RBAC scope.
3. Core services handle onboarding orchestration, tasks, assets, comments, notifications.
4. Notification service sends in-app and Outlook emails.
5. File service stores partner and internal deliverables.
6. Audit and event streams track changes and trigger downstream automation.

## 3. Logical Architecture

## 3.1 Frontend

- **Web SPA** (desktop-first responsive layout).
- UI modules:
  - BDM alert dashboard
  - Partner onboarding workspace
  - Task board and task detail
  - Partner portal
  - Template administration
  - User and role administration
  - Personal notification center

## 3.2 Backend Services

- **Auth & Session Service**
  - Login, session creation, timeout handling, role claims.
- **Partner Onboarding Service**
  - Create onboarding, phase progression, go-live planning.
- **Task Orchestration Service**
  - Dependency graph, status transitions, prerequisite fulfillment, auto-activation.
- **Template Service**
  - Versioned process templates by integration type and contract type.
- **Asset & Deliverable Service**
  - Upload metadata, storage references, fulfillment checks.
- **Comment & Tag Service**
  - Task comments, mentions, partner-safe visibility filtering.
- **Notification Service**
  - In-app push events and Outlook email delivery with retries.
- **User & Role Service**
  - Admin-controlled account lifecycle and role assignments.
- **Audit & Reporting Service**
  - Access/change logs and archival lookup support.

## 3.3 Data Stores

- **Relational DB** (transactional source of truth)
  - Partners, onboardings, phases, tasks, checklists, users, roles, comments, notifications.
- **Object Storage**
  - Uploaded files and generated deliverables with metadata references in DB.
- **Cache Layer**
  - Dashboard aggregates and frequently accessed read models.
- **Audit/Event Store**
  - Immutable event records for traceability and diagnostics.

## 4. Domain Model (Core Entities)

- `User` (id, role, locale, status)
- `Partner` (id, company, primaryContact, lifecycleStatus)
- `Onboarding` (id, partnerId, integrationType, contractType, targetGoLiveDate, phaseState)
- `Phase` (id, onboardingId, sequence, status)
- `Task` (id, phaseId, ownerRole, assignee, status, dueDate, isBlocked)
- `TaskDependency` (predecessorTaskId, successorTaskId)
- `ChecklistItem` (taskId, text, checkedBy, checkedAt)
- `DeliverableRequirement` (taskId, type, requiredByRole)
- `Deliverable` (requirementId, storageRef, uploadedBy, uploadedAt)
- `Comment` (taskId, authorId, visibilityScope, text)
- `Mention` (commentId, targetUserId)
- `Notification` (recipientId, channel, type, status, sentAt)
- `Template` (id, integrationType, contractType, version, active)
- `TemplateTaskBlueprint` (templateVersionId, phase, role, offsets, dependencies)
- `AuditEvent` (actorId, action, entityType, entityId, timestamp)

## 5. Key Workflows

### 5.1 New Onboarding

1. BDM creates onboarding with integration/contract type.
2. Template service selects active template version.
3. Task orchestration instantiates phases/tasks/dependencies/checklists.
4. Backward planner derives deadlines from target go-live date.
5. Invitation and first task notifications are dispatched.

### 5.2 Dependency Unblock and Auto-Handoff

1. User marks task/checklist complete or uploads required deliverable.
2. Orchestration evaluates dependent tasks.
3. Newly satisfiable tasks move to `active`.
4. Notification service alerts assigned role/users.
5. Dashboard read model refreshes partner risk status.

### 5.3 Partner Upload Flow

1. Partner portal shows required action item.
2. Partner uploads file against required deliverable.
3. Asset service validates metadata and stores object.
4. Orchestration marks prerequisite fulfilled and unblocks downstream tasks.

## 6. API Design (Representative)

- `POST /api/onboardings`
- `GET /api/onboardings/:id`
- `POST /api/onboardings/:id/go-live-date`
- `PATCH /api/tasks/:id/status`
- `POST /api/tasks/:id/comments`
- `POST /api/tasks/:id/uploads`
- `GET /api/dashboard/alerts`
- `GET /api/partner-portal/me`
- `POST /api/templates`
- `POST /api/admin/users`

All endpoints enforce server-side authorization by role and partner scope.

## 7. Security Architecture

- Session-based auth with secure cookies and configurable idle timeout.
- Server-side RBAC plus partner tenancy guard at query layer.
- Row-level data filters prevent partner cross-visibility.
- Encryption in transit (TLS) and encryption at rest for DB/object storage.
- Audit logging for sensitive reads/writes and admin actions.
- Input validation and file-upload scanning/constraints.

## 8. Non-Functional Architecture Decisions

### 8.1 Performance

- Dashboard and partner overview served from pre-aggregated read models.
- Cache hot dashboards and active onboarding summaries.
- Async notification dispatch to avoid blocking user actions.
- Target budgets aligned to PRD:
  - dashboard load <= 2s
  - status propagation <= 5s
  - upload handling up to 25MB

### 8.2 Scalability

- Stateless API instances behind load balancer.
- Queue-based background workers for notifications and projection refresh.
- DB indexing on onboarding/task state fields and partner scopes.
- Capacity plan for baseline and 3x growth without redesign.

### 8.3 Reliability

- Retry with backoff for Outlook and future external integrations.
- Dead-letter queue for failed outbound events.
- Graceful degradation: core task workflow continues if integrations fail.
- Backups plus point-in-time restore strategy for relational data.

## 9. Integration Architecture

### 9.1 MVP

- **Outlook Integration**
  - Notification service uses provider adapter abstraction.
  - Delivery status tracked per message for observability.

### 9.2 Growth Adapters

- DocuSign adapter (contract status + signed artifact references).
- Circleback adapter (meeting transcript links to partner/onboarding).
- SharePoint adapter (document sync/reference strategy).

Integration adapters are isolated behind provider interfaces to avoid coupling core domain logic.

## 10. Deployment and Environments

- Environments: `dev`, `staging`, `prod`.
- CI pipeline gates:
  - unit tests
  - integration tests
  - security/lint checks
- Infrastructure as code for consistent environment provisioning.
- Observability stack:
  - structured logs
  - API and job metrics
  - alerting on queue failure, API latency, auth failures

## 11. UX/Architecture Alignment Notes

- Dashboard first-class support through read models and alert projections.
- Partner portal has separate scoped API surface and visibility policy.
- Role-focused views supported through query filters and policy enforcement.
- Dutch/English language switching supported at presentation layer with i18n keys.

## 12. Risks and Mitigations

- **Risk:** Task dependency complexity introduces hidden deadlocks.  
  **Mitigation:** Explicit dependency graph validation and cycle detection on template publish.
- **Risk:** Notification fatigue or delivery instability.  
  **Mitigation:** Channel preferences, retries, and delivery observability.
- **Risk:** Data isolation bugs for partner users.  
  **Mitigation:** Policy tests, row-scope integration tests, and audit sampling.

## 13. Implementation Sequence Recommendation

1. Foundation: auth/session, RBAC, core entities, onboarding creation.
2. Orchestration: task graph, dependencies, status transitions.
3. User value: dashboard, task execution views, partner portal.
4. Collaboration: comments/tags, notification center, Outlook email adapter.
5. Admin and templates: template management, user management, archival/reporting.
