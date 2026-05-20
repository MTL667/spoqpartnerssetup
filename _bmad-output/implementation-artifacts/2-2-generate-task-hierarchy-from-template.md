# Story 2.2: Generate Task Hierarchy from Template

Status: done

## Story

As a system, I generate phases, main tasks, subtasks, checklists, and deliverable requirements so onboarding structure is standardized.

## Acceptance Criteria

1. **AC1 — Full hierarchy generated:** Given a template version, when onboarding is initialized, then full hierarchy (tasks, subtasks, checklists, deliverables) is generated.

2. **AC2 — Role ownership and metadata:** Given generated tasks, when viewed, then role ownership and prerequisite metadata are present.

3. **AC3 — Validation:** Given missing template components, when generation runs, then validation errors prevent incomplete onboarding creation.

## Tasks / Subtasks

- [x] **Task 1:** TaskGeneratorService with blueprint-based task generation
- [x] **Task 2:** Default blueprints with 8 tasks across 5 phases, subtasks, checklists, deliverables, and dependencies
- [x] **Task 3:** TasksService with findById and findByOnboarding
- [x] **Task 4:** TasksController with GET/POST endpoints
- [x] **Task 5:** Integration with OnboardingService (auto-generate on create)
- [x] **Task 6:** Unit tests (8 tests for TaskGeneratorService)
- [x] **Task 7:** Fix OnboardingService tests for new dependency

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- TaskGeneratorService generates full hierarchy from blueprints: main tasks, subtasks, checklist items, deliverable requirements, task dependencies
- Tasks with dependencies start as BLOCKED; others as NOT_ACTIVE
- Default blueprints provide 8 standard tasks across all 5 phases
- OnboardingService auto-calls task generation after creating onboarding
- Clean code review — no issues found

### File List
- `apps/api/src/tasks/task-generator.service.ts`
- `apps/api/src/tasks/task-generator.service.spec.ts`
- `apps/api/src/tasks/tasks.service.ts`
- `apps/api/src/tasks/tasks.controller.ts`
- `apps/api/src/tasks/tasks.module.ts`
- `apps/api/src/onboarding/onboarding.service.ts` — added TaskGenerator integration
- `apps/api/src/onboarding/onboarding.module.ts` — added TasksModule import
- `apps/api/src/onboarding/onboarding.service.spec.ts` — added TaskGenerator mock
- `apps/api/src/app.module.ts` — added TasksModule
