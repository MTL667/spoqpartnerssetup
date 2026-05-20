# Story 2.4: Task Dependency and Status Engine

Status: done

## Story

As a system, I prevent invalid task activation and track status lifecycle so execution remains predictable.

## Acceptance Criteria

1. **AC1:** Given unmet predecessor tasks, when dependent task is evaluated, then status is blocked.
2. **AC2:** Given completed predecessor tasks, when dependency is satisfied, then dependent task can become active.
3. **AC3:** Given each task lifecycle transition, when status changes, then state is one of NOT_ACTIVE, ACTIVE, BLOCKED, OVERDUE, COMPLETED.

## Tasks / Subtasks

- [x] TaskStatusEngineService with valid state machine transitions
- [x] evaluateSuccessors — auto-unblock when all predecessors completed
- [x] checkOverdue — mark tasks past due date
- [x] PATCH /api/tasks/:id/status endpoint
- [x] UpdateTaskStatusDto with validation
- [x] 11 unit tests covering all transitions, blocks, and edge cases
- [x] Clean code review

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- State machine: NOT_ACTIVE→ACTIVE, ACTIVE→COMPLETED|BLOCKED|OVERDUE, BLOCKED→ACTIVE, OVERDUE→COMPLETED|ACTIVE
- COMPLETED is terminal — no transitions out
- Activation checks predecessor completion before allowing BLOCKED→ACTIVE
- Successor evaluation also checks deliverable fulfillment (Story 2.5 ready)
- Clean review — no issues found

### File List
- `apps/api/src/tasks/task-status-engine.service.ts`
- `apps/api/src/tasks/task-status-engine.service.spec.ts`
- `apps/api/src/tasks/tasks.controller.ts` — added PATCH /:id/status
- `apps/api/src/tasks/tasks.module.ts` — added TaskStatusEngineService
- `apps/api/src/tasks/dto/update-task-status.dto.ts`
