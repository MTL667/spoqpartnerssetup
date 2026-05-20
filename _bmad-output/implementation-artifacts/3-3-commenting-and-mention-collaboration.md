# Story 3.3: Commenting and Mention Collaboration

Status: done

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes
- CommentsService: create with mentions, getByTask (partner-filtered), delete (own only)
- Visibility: INTERNAL (default) vs ALL — PARTNER role only sees ALL visibility
- Mentions trigger MENTION notifications via NotificationsService
- Author-only deletion with cascade mention cleanup
- 8 unit tests, clean review
### File List
- `apps/api/src/comments/comments.service.ts`
- `apps/api/src/comments/comments.service.spec.ts`
- `apps/api/src/comments/comments.controller.ts`
- `apps/api/src/comments/dto/create-comment.dto.ts`
- `apps/api/src/comments/comments.module.ts`
