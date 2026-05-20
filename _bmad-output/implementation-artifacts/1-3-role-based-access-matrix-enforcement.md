# Story 1.3: Role-Based Access Matrix Enforcement

Status: done

## Story

As a system, I enforce role-specific capabilities and partner data boundaries so users only see allowed data.

## Acceptance Criteria

1. **AC1 — Server-Side RBAC:** Given any API call, when role policy is evaluated, then unauthorized actions are denied server-side with 403 Forbidden.

2. **AC2 — Partner Isolation:** Given partner users, when requesting any data, then only own-company records are returned (zero cross-partner visibility).

3. **AC3 — Internal Visibility:** Given internal users (BDM, IT, Marketing, Sales, Admin), when requesting partner data, then all partners are visible (task context varies by role).

4. **AC4 — Role Policy Configuration:** Given the RBAC matrix, when role policies are defined, then they match the PRD visibility rules per role.

5. **AC5 — Partner Tenancy Guard:** Given any data query involving partner-scoped entities, when executed by a partner user, then a query-level filter restricts results to that user's partnerId.

6. **AC6 — Audit on Access Denial:** Given an unauthorized access attempt, when denied, then an audit event is logged with actor, attempted action, and target resource.

## Tasks / Subtasks

- [x] **Task 1: Role Policy Configuration** (AC: #1, #4)
  - [x] 1.1 Define role-permission map as a constant: which roles can access which resource groups
  - [x] 1.2 Resource groups: `admin` (user management), `onboarding` (CRUD), `tasks` (execution), `partners` (view), `templates` (management), `portal` (partner self-service)

- [x] **Task 2: Enhanced RolesGuard with Resource Policies** (AC: #1, #4)
  - [x] 2.1 Extend `@Roles()` decorator to support resource-action pairs (e.g., `@Roles(UserRole.ADMIN)` or `@RequirePermission('admin:manage')`)
  - [x] 2.2 Update RolesGuard to check permissions from the role-permission map
  - [x] 2.3 Return 403 with consistent error format on denial

- [x] **Task 3: Partner Tenancy Guard** (AC: #2, #5)
  - [x] 3.1 Create `PartnerGuard` middleware that adds `partnerId` filter to request context
  - [x] 3.2 For PARTNER role: inject `partnerId` from session into query context
  - [x] 3.3 For internal roles: no filter applied (all partners visible)
  - [x] 3.4 Create `@PartnerScoped()` decorator for controllers that need partner filtering

- [x] **Task 4: Partner Filter Service** (AC: #2, #5)
  - [x] 4.1 Create `PartnerFilterService` that provides `getPartnerFilter(user)` returning `{ partnerId }` or `{}`
  - [x] 4.2 All future data queries use this filter for partner-scoped entities

- [x] **Task 5: Audit Access Denials** (AC: #6)
  - [x] 5.1 Log `ACCESS_DENIED` audit event when RolesGuard or PartnerGuard rejects a request
  - [x] 5.2 Include actorId, attempted action, target resource in audit metadata

- [x] **Task 6: Tests** (AC: all)
  - [x] 6.1 Unit tests: role-permission map, RolesGuard enhanced logic, PartnerFilterService
  - [x] 6.2 Integration tests: partner user sees only own data, internal user sees all, non-permitted role gets 403

## Dev Notes

### RBAC Matrix (from PRD)

| Role | admin | onboarding | tasks | partners | templates | portal |
|---|---|---|---|---|---|---|
| ADMIN | full | read | read | all | read | none |
| BDM | none | full | full | all | full | none |
| IT | none | none | own | all (context) | none | none |
| MARKETING | none | none | own+visible | all | none | none |
| SALES | none | none | own | all (context) | none | none |
| PARTNER | none | none | own-actions | own-company | none | full |

### Partner Tenancy at Query Layer

The architecture mandates: "Row-level data filters prevent partner cross-visibility." This means every query for partner-scoped data must include a WHERE clause filtering on partnerId when the requesting user is a PARTNER role.

### What NOT to Build

- Full partner data endpoints (no Partner entity yet) — Story 2.1 creates onboardings
- Task filtering by role — Story 2.4 handles task orchestration
- BD-specific scoping — Story 1.4

### References

- [Source: prd.md — FR33, FR34, FR23, RBAC Matrix]
- [Source: architecture.md — §7 Security Architecture, §3.2 Auth & Session Service]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- All 51 tests pass across 8 test suites

### Completion Notes List
- RBAC permission matrix implemented matching PRD role-visibility table (6 roles x 6 resource groups)
- `getPermission()`, `hasAccess()`, `hasFullAccess()` utility functions for policy checks
- PermissionGuard with `@RequirePermission()` decorator for resource-level access control
- PartnerFilterService for query-level partner isolation (returns `{partnerId}` for PARTNER, `{}` for internal)
- `assertPartnerAccess()` for explicit cross-partner access violation checks
- ACCESS_DENIED audit events logged on every permission denial with actor, resource, method, path
- RbacModule registered globally for app-wide availability
- 28 new unit tests (permissions: 12, partner-filter: 7, permission-guard: 5, existing: 4)

### Review Findings
Clean review — no issues found

### Change Log
- 2026-05-20: Implementation of Story 1.3 — RBAC enforcement, partner isolation, audit denial logging

### File List
- `apps/api/src/rbac/permissions.ts` — role-permission matrix and access check functions
- `apps/api/src/rbac/rbac.module.ts` — global RBAC module
- `apps/api/src/rbac/partner-filter.service.ts` — partner tenancy filter service
- `apps/api/src/rbac/partner-filter.service.spec.ts` — partner filter tests
- `apps/api/src/rbac/permissions.spec.ts` — permission matrix tests
- `apps/api/src/rbac/decorators/require-permission.decorator.ts` — @RequirePermission decorator
- `apps/api/src/rbac/guards/permission.guard.ts` — resource permission guard with audit
- `apps/api/src/rbac/guards/permission.guard.spec.ts` — permission guard tests
- `apps/api/src/app.module.ts` — updated with RbacModule
