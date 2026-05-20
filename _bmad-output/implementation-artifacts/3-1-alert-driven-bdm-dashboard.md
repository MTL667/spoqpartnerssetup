# Story 3.1: Alert-Driven BDM Dashboard

Status: done

## Dev Agent Record
### Agent Model Used
Claude Opus 4.6
### Completion Notes
- DashboardService with getAlerts() (severity-sorted: red/orange/green) and getDrillDown() (blocking reasons)
- Color coding: red = blocked/overdue, orange = due within 3 days, green = on track
- Drill-down shows blocking predecessors and missing deliverables
- Partner-scoped via PartnerFilterService
- 7 unit tests, clean review
### File List
- `apps/api/src/dashboard/dashboard.service.ts`
- `apps/api/src/dashboard/dashboard.service.spec.ts`
- `apps/api/src/dashboard/dashboard.controller.ts`
- `apps/api/src/dashboard/dashboard.module.ts`
