# Story 5.1: Template Management by BDM

Status: done

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes
- TemplateManagementService: create (auto-version), publishTemplate (deactivate previous, activate new), updateBlueprints, getVersionHistory, getById
- TemplateTaskBlueprint model for persistent blueprints (title, phase, role, offsets, dependencies, checklists, deliverables)
- Dependency graph validation on publish (unknown refs, self-references)
- Cannot edit active template — must create new version
- Templates created as draft (active: false), published explicitly
- 11 unit tests, clean review
### File List
- `apps/api/prisma/schema.prisma` — TemplateTaskBlueprint model
- `apps/api/src/templates/template-management.service.ts`
- `apps/api/src/templates/template-management.service.spec.ts`
- `apps/api/src/templates/templates.controller.ts`
- `apps/api/src/templates/dto/create-template.dto.ts`
- `apps/api/src/templates/dto/update-blueprints.dto.ts`
- `apps/api/src/templates/templates.module.ts`
