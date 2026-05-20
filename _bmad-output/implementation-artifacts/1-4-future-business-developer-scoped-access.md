# Story 1.4: Future Business Developer Scoped Access

Status: done

## Story

As a Business Developer (future role), I can only access assigned partner portfolio data so responsibility boundaries are preserved.

## Acceptance Criteria

1. **AC1 — BD Partner List Scoped:** Given Business Developer role, when listing partners, then only assigned partners are shown.

2. **AC2 — Unassigned Partner Denied:** Given unassigned partner details URL, when accessed by a BD, then authorization is denied with 403.

3. **AC3 — Assignment CRUD:** Given admin privileges, when assigning/unassigning partners to a BD, then access scope updates without code redeploy.

4. **AC4 — Existing Roles Unaffected:** Given existing internal roles (Admin, BDM, IT, Marketing, Sales), when BD scoping is added, then their existing access patterns remain unchanged.

## Tasks / Subtasks

- [x] **Task 1: BD Role and Assignment Model** (AC: #1, #3)
  - [x] 1.1 Add `BD` to the UserRole enum in Prisma schema
  - [x] 1.2 Create `BdPartnerAssignment` model (bdUserId, partnerId, assignedAt)
  - [x] 1.3 Regenerate Prisma client

- [x] **Task 2: BD Assignment Service** (AC: #3)
  - [x] 2.1 Create `BdAssignmentService` with `assign(bdUserId, partnerId)` and `unassign(bdUserId, partnerId)`
  - [x] 2.2 Add `getAssignedPartnerIds(bdUserId)` method
  - [x] 2.3 Add `isAssigned(bdUserId, partnerId)` method

- [x] **Task 3: BD Partner Filter Integration** (AC: #1, #2)
  - [x] 3.1 Extend `PartnerFilterService.getFilter()` to handle BD role: return assigned partnerIds
  - [x] 3.2 Extend `PartnerFilterService.assertPartnerAccess()` to check BD assignment

- [x] **Task 4: Admin BD Assignment Endpoints** (AC: #3)
  - [x] 4.1 `POST /api/admin/bd-assignments` — assign partner to BD
  - [x] 4.2 `DELETE /api/admin/bd-assignments/:bdUserId/:partnerId` — unassign
  - [x] 4.3 `GET /api/admin/bd-assignments/:bdUserId` — list BD's assigned partners
  - [x] 4.4 Audit log on assign/unassign

- [x] **Task 5: Permission Matrix Update** (AC: #1, #4)
  - [x] 5.1 Add BD role to permissions map (similar to BDM but scoped to own partners)
  - [x] 5.2 Verify all existing role permissions unchanged

- [x] **Task 6: Tests** (AC: all)
  - [x] 6.1 Unit tests: BdAssignmentService, PartnerFilterService BD extension, permissions update
  - [x] 6.2 Integration tests: BD sees only assigned partners, unassigned partner returns 403, admin can assign/unassign

## Dev Notes

### BD Role Characteristics (from PRD RBAC Matrix)

| Aspect | Value |
|---|---|
| Partner Visibility | Own assigned partners only |
| Task Visibility | Tasks for own partners only |
| System Access | Limited dashboard scoped to own portfolio |

The BD role is explicitly marked "future" in the PRD. This story creates the data model and enforcement infrastructure so it's ready when needed.

### BdPartnerAssignment Model

```prisma
model BdPartnerAssignment {
  id         String   @id @default(cuid())
  bdUserId   String
  partnerId  String
  assignedAt DateTime @default(now())

  @@unique([bdUserId, partnerId])
  @@index([bdUserId])
  @@index([partnerId])
}
```

### What NOT to Build

- BD-specific dashboard UI — future story
- BD-specific task filtering logic — relies on Task entity from Epic 2
- Partner entity CRUD — Story 2.1

### References

- [Source: prd.md — FR35, RBAC Matrix (Business Developer row)]
- [Source: architecture.md — §7 Security Architecture]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- All 65 tests pass across 9 test suites

### Completion Notes List
- BD role added to UserRole enum in Prisma schema
- BdPartnerAssignment model with unique constraint on (bdUserId, partnerId)
- BdAssignmentService with assign/unassign/getAssignedPartnerIds/isAssigned methods
- PartnerFilterService extended: BD users get `{partnerId: {in: [assignedIds]}}` filter
- assertPartnerAccess throws ForbiddenException for BD accessing unassigned partners
- Admin endpoints at `/api/admin/bd-assignments` for CRUD with audit logging
- BD permissions added to RBAC matrix (read onboarding, own tasks, own-company partners)
- All 6 existing role permissions verified unchanged by test
- 14 new tests (BdAssignment: 6, PartnerFilter: 5 updated, Permissions: 6 new + 1 regression)

### Review Findings
Clean review — no issues found

### Change Log
- 2026-05-20: Implementation of Story 1.4 — BD role, assignment model, scoped access, admin endpoints

### File List
- `apps/api/prisma/schema.prisma` — added BD enum value, BdPartnerAssignment model
- `apps/api/src/rbac/bd-assignment.service.ts` — BD partner assignment service
- `apps/api/src/rbac/bd-assignment.service.spec.ts` — assignment service tests
- `apps/api/src/rbac/partner-filter.service.ts` — extended for BD scoped filtering
- `apps/api/src/rbac/partner-filter.service.spec.ts` — updated tests for BD role
- `apps/api/src/rbac/permissions.ts` — added BD role to permission matrix
- `apps/api/src/rbac/permissions.spec.ts` — added BD permission tests + regression tests
- `apps/api/src/rbac/rbac.module.ts` — exports BdAssignmentService
- `apps/api/src/admin/admin-bd-assignments.controller.ts` — admin BD assignment endpoints
- `apps/api/src/admin/admin.module.ts` — added BD assignment controller
