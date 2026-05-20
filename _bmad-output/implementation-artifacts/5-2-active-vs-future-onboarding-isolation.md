# Story 5.2: Active vs Future Onboarding Isolation

Status: done

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes
- TemplateIsolationService: verifyIsolation (shows active template, count of onboardings using it, version history), getOnboardingTemplateSnapshot
- Onboarding records store templateVersionId at creation — immutable binding
- Template publish deactivates previous version; active onboardings retain their original template reference
- New onboardings always use latest active template version
- 4 unit tests, clean review
### File List
- `apps/api/src/templates/template-isolation.service.ts`
- `apps/api/src/templates/template-isolation.service.spec.ts`
- `apps/api/src/templates/templates.module.ts` — added TemplateIsolationService
