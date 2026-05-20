# Story 2.5: Deliverable Chain and Auto-Unblock

Status: done

## Story

As a system, I treat uploaded or produced deliverables as prerequisites so downstream work is unlocked automatically.

## Acceptance Criteria

1. **AC1:** Given a required deliverable upload, when file is accepted, then prerequisite is marked fulfilled.
2. **AC2:** Given fulfilled prerequisites, when dependency checks execute, then blocked downstream tasks become active.
3. **AC3:** Given task detail view, when opened, then fulfilled and missing prerequisites are clearly listed.

## Tasks / Subtasks

- [x] DeliverableService — upload, fulfill, evaluate unblock
- [x] POST /api/tasks/:id/upload endpoint
- [x] GET /api/tasks/:id/deliverables endpoint
- [x] UploadDeliverableDto with validation
- [x] Auto-unblock: on upload, evaluate successors for activation
- [x] Audit logging for DELIVERABLE_UPLOADED
- [x] 7 unit tests
- [x] Clean code review

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Deliverable upload marks DeliverableRequirement as fulfilled
- After upload, evaluateTaskUnblock checks all successor tasks for activation (both predecessor completion AND deliverable fulfillment)
- Task detail view includes deliverableRequirements with fulfillment status and uploaded deliverables
- Duplicate upload prevention (BadRequestException if already fulfilled)
- Clean review — no issues found

### File List
- `apps/api/src/tasks/deliverable.service.ts`
- `apps/api/src/tasks/deliverable.service.spec.ts`
- `apps/api/src/tasks/dto/upload-deliverable.dto.ts`
- `apps/api/src/tasks/tasks.controller.ts` — added upload and deliverables endpoints
- `apps/api/src/tasks/tasks.module.ts` — added DeliverableService
