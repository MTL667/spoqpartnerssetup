# Story 2.1: Create Onboarding from Configuration

Status: done

## Story

As a BDM, I can create a partner onboarding with integration and contract type so the correct process path starts instantly.

## Acceptance Criteria

1. **AC1 — Create Partner:** Given partner details (company name, primary contact email), when a BDM creates a partner, then a Partner record is persisted with a unique ID and lifecycle status "onboarding".

2. **AC2 — Create Onboarding:** Given a partner and configuration inputs (integration type, contract type), when a BDM creates an onboarding, then an Onboarding record is persisted linked to the partner with status "active".

3. **AC3 — Integration Types:** Given configuration options, when creating an onboarding, then the BDM can select from: Forms ERP, Partner Portal, API Integration.

4. **AC4 — Contract Types:** Given configuration options, when creating an onboarding, then the BDM can select from: Expert-Partner, Software-Partner.

5. **AC5 — Template Resolution:** Given an integration/contract combination, when the onboarding is created, then the system resolves the matching active template version (or returns an error if none exists).

6. **AC6 — Initial Phases:** Given successful onboarding creation, when completed, then the 5 standard phases are created with sequence and initial status.

7. **AC7 — BDM Only:** Given non-BDM/non-Admin users, when attempting to create onboardings, then access is denied with 403.

8. **AC8 — Audit:** Given onboarding creation, when completed, then audit events are logged for partner and onboarding creation.

## Tasks / Subtasks

- [x] **Task 1: Domain Models** (AC: #1, #2, #3, #4, #6)
  - [x] 1.1–1.6 Partner, Template, Onboarding, OnboardingPhase, Task, TaskDependency, ChecklistItem, DeliverableRequirement, Deliverable models + enums added to Prisma schema

- [x] **Task 2: Onboarding Module** (AC: #1, #2, #5, #6)
  - [x] 2.1–2.3 OnboardingService, PartnersService, TemplatesService implemented

- [x] **Task 3: Onboarding Controller** (AC: #2, #7)
  - [x] 3.1–3.4 POST/GET /api/onboardings with BDM/ADMIN role guard and partner-scoped list

- [x] **Task 4: Seed Templates** (AC: #5)
  - [x] 4.1 Seed script updated with 6 template records

- [x] **Task 5: Audit Integration** (AC: #8)
  - [x] 5.1 PARTNER_CREATED and ONBOARDING_CREATED audit events

- [x] **Task 6: DTOs and Validation** (AC: #2, #3, #4)
  - [x] 6.1 CreateOnboardingDto with class-validator

- [x] **Task 7: Tests** (AC: all)
  - [x] 7.1–7.2 OnboardingService tests (4), TemplatesService tests (2), 71 total passing

## Dev Notes

### Standard Phases (from PRD FR30)

| Sequence | Phase Name |
|---|---|
| 1 | Preparation |
| 2 | Technical Setup |
| 3 | Content & Marketing |
| 4 | Go-to-Market |
| 5 | Post-Launch |

Note: PRD says "Phase 4+5 combined as Go-to-Market" — we model all 5 but Phase 4 is labeled "Go-to-Market" (combined scope).

### Enums

```
IntegrationType: FORMS_ERP, PARTNER_PORTAL, API_INTEGRATION
ContractType: EXPERT_PARTNER, SOFTWARE_PARTNER
```

### References

- [Source: prd.md — FR1, FR2, FR6, FR30]
- [Source: architecture.md — §4 Domain Model, §5.1 New Onboarding workflow]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Completion Notes List
- Full domain model for Epic 2 added to Prisma schema (Partner, Template, Onboarding, Phase, Task, TaskDependency, ChecklistItem, DeliverableRequirement, Deliverable)
- OnboardingService creates partner + resolves template + creates onboarding with 5 standard phases in one transaction
- PartnersService and TemplatesService with CRUD operations
- Controller with BDM/ADMIN role guard and partner-scoped listing
- Seed script extended with 6 templates (3 integration x 2 contract types)
- Clean code review — no issues found

### Change Log
- 2026-05-20: Implementation of Story 2.1

### File List
- `apps/api/prisma/schema.prisma` — full Epic 2 domain model
- `apps/api/prisma/seed.ts` — template seeding added
- `apps/api/src/onboarding/onboarding.module.ts`
- `apps/api/src/onboarding/onboarding.service.ts`
- `apps/api/src/onboarding/onboarding.service.spec.ts`
- `apps/api/src/onboarding/onboarding.controller.ts`
- `apps/api/src/onboarding/dto/create-onboarding.dto.ts`
- `apps/api/src/partners/partners.module.ts`
- `apps/api/src/partners/partners.service.ts`
- `apps/api/src/templates/templates.module.ts`
- `apps/api/src/templates/templates.service.ts`
- `apps/api/src/templates/templates.service.spec.ts`
- `apps/api/src/app.module.ts` — added OnboardingModule
