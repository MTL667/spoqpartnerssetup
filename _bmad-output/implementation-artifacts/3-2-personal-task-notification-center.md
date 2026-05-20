# Story 3.2: Personal Task Notification Center

Status: done

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes
- NotificationsService: create, getForUser, markRead, markAllRead, getUnreadCount
- Notification types: TASK_ACTIVATED, TASK_OVERDUE, DEADLINE_APPROACHING, PREREQUISITE_FULFILLED, MENTION, DELIVERABLE_UPLOADED
- User-scoped: only own notifications visible, mark-read requires ownership
- Domain models: Notification, Comment, Mention added to Prisma schema
- 10 unit tests, clean review
### File List
- `apps/api/prisma/schema.prisma` — Notification, Comment, Mention models + enums
- `apps/api/src/notifications/notifications.service.ts`
- `apps/api/src/notifications/notifications.service.spec.ts`
- `apps/api/src/notifications/notifications.controller.ts`
- `apps/api/src/notifications/notifications.module.ts`
