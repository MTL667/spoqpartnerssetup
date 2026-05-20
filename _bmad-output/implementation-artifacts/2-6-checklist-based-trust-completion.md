# Story 2.6: Checklist-Based Trust Completion

Status: done

## Story

As an assigned user, I can complete checklist items and tasks so work progresses without unnecessary approvals.

## Acceptance Criteria

1. **AC1:** Given an assigned task, when checklist items are marked complete, then completion metadata is stored (who, when).
2. **AC2:** Given all required completion conditions met (checklist + deliverables), when user marks task complete, then task transitions successfully.
3. **AC3:** Given completion events, when processed, then downstream tasks are evaluated for activation.

## Tasks / Subtasks

- [x] ChecklistService — toggleItem, completeTask, getChecklist
- [x] PATCH /api/tasks/checklist/:itemId/toggle endpoint
- [x] POST /api/tasks/:id/complete endpoint
- [x] GET /api/tasks/:id/checklist endpoint
- [x] Trust-based toggle: stores checkedBy and checkedAt
- [x] Completion guards: all checklist checked + all deliverables fulfilled
- [x] Delegates to TaskStatusEngine for state transition + successor evaluation
- [x] 10 unit tests
- [x] Clean code review

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Toggle is idempotent: check/uncheck with metadata (who/when)
- completeTask validates ALL checklist items checked AND all deliverables fulfilled before transitioning
- Works on both ACTIVE and OVERDUE tasks
- Downstream auto-unblock happens via TaskStatusEngine.transitionTask → evaluateSuccessors
- Clean review — no issues found

### File List
- `apps/api/src/tasks/checklist.service.ts`
- `apps/api/src/tasks/checklist.service.spec.ts`
- `apps/api/src/tasks/tasks.controller.ts` — added checklist toggle and complete endpoints
- `apps/api/src/tasks/tasks.module.ts` — added ChecklistService
