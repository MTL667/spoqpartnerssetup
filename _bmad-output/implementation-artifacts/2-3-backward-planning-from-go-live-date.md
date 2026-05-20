# Story 2.3: Backward Planning from Go-Live Date

Status: done

## Story

As a BDM, I can set a target go-live date so deadlines are auto-calculated and visible for all tasks.

## Acceptance Criteria

1. **AC1:** Given a target go-live date, when planning runs, then all deadlines are calculated backwards using configured offsets.
2. **AC2:** Given a deadline exception, when BDM edits a task due date, then override is stored with audit trail.
3. **AC3:** Given changed go-live date, when recalculation is requested, then updated schedule is applied consistently (preserving overrides).

## Tasks / Subtasks

- [x] DeadlinePlannerService — setGoLiveDate, calculateDeadlines, overrideTaskDueDate, recalculate
- [x] POST /api/onboardings/:id/go-live-date endpoint
- [x] POST /api/onboardings/:id/recalculate endpoint
- [x] PATCH /api/onboardings/tasks/:taskId/due-date endpoint
- [x] SetGoLiveDateDto and OverrideDueDateDto with validation
- [x] Audit logging for GO_LIVE_DATE_SET, TASK_DUE_DATE_OVERRIDE, DEADLINES_RECALCULATED
- [x] Unit tests (8 tests)
- [x] Clean code review

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Backward planning calculates task.dueDate = goLiveDate + offsetDays (offsets are negative for pre-launch tasks)
- Manual due date overrides are preserved during recalculation (dueDateOverride flag)
- All deadline mutations are audit-logged
- Clean review — no issues found

### File List
- `apps/api/src/onboarding/deadline-planner.service.ts`
- `apps/api/src/onboarding/deadline-planner.service.spec.ts`
- `apps/api/src/onboarding/onboarding.controller.ts` — added 3 endpoints
- `apps/api/src/onboarding/onboarding.module.ts` — added DeadlinePlannerService
- `apps/api/src/onboarding/dto/set-go-live-date.dto.ts`
- `apps/api/src/onboarding/dto/override-due-date.dto.ts`
