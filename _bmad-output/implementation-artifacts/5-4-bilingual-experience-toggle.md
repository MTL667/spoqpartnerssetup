# Story 5.4: Bilingual Experience Toggle

Status: done

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes
- I18nService: translate, resolveLocale, getSupportedLocales, updateUserLocale, getTranslations
- Supported locales: nl (Dutch, default) and en (English)
- Translations for task notifications, phase names, error messages, welcome text
- Unsupported locale falls back safely to Dutch
- User locale stored in User.locale field, updateable via API
- 8 unit tests, clean review
### File List
- `apps/api/src/i18n/i18n.service.ts`
- `apps/api/src/i18n/i18n.service.spec.ts`
- `apps/api/src/i18n/i18n.controller.ts`
- `apps/api/src/i18n/i18n.module.ts`
- `apps/api/src/app.module.ts` — added I18nModule
