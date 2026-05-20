# Story 1.1: User Authentication and Session Timeout

Status: done

## Story

As an internal or partner user,
I want to sign in with my credentials and be automatically logged out after inactivity,
so that account access remains secure and unauthorized use is prevented.

## Acceptance Criteria

1. **AC1 — Successful Login:** Given valid credentials (email + password), when the user signs in, then a secure authenticated session is created with a session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`), and the user is redirected to their role-appropriate landing page.

2. **AC2 — Invalid Login:** Given invalid credentials, when the user attempts to sign in, then authentication fails with a generic error message (no credential-type leak), and no session is created.

3. **AC3 — Session Timeout:** Given an inactive session beyond the configured timeout (default: 30 minutes, configurable via `SESSION_TIMEOUT_MINUTES` env var), when no activity occurs, then the session expires server-side, and the next API request returns 401 requiring re-authentication.

4. **AC4 — Unauthenticated Access Denied:** Given an unauthenticated request to any protected API endpoint, when access is attempted, then the API returns 401 Unauthorized.

5. **AC5 — Logout:** Given an authenticated user, when they log out, then the session is destroyed server-side, the session cookie is cleared, and subsequent requests with the old cookie return 401.

6. **AC6 — Session Shared Across Instances:** Given stateless API instances behind a load balancer, when a user authenticates on one instance, then their session is valid on all instances (centralized session store).

7. **AC7 — Role Claims in Session:** Given an authenticated session, when any API request is processed, then the user's role and (for partner users) partner scope are available from the session for downstream authorization checks.

## Tasks / Subtasks

- [x] **Task 1: Project Scaffolding** (AC: all)
  - [x] 1.1 Initialize monorepo with `apps/api` (NestJS) and `apps/web` (React + Vite)
  - [x] 1.2 Configure TypeScript, ESLint, Prettier across workspaces
  - [x] 1.3 Set up PostgreSQL schema with Prisma ORM — initial `User` model
  - [x] 1.4 Set up Redis connection for session store
  - [x] 1.5 Create `Dockerfile` and `docker-compose.yml` for local dev (API + DB + Redis)
  - [x] 1.6 Create production `Dockerfile` for EasyPanel deployment
  - [x] 1.7 Add `.env.example` with all required environment variables

- [x] **Task 2: User Database Model** (AC: #1, #7)
  - [x] 2.1 Create Prisma schema: `User` table with `id`, `email`, `passwordHash`, `role` (enum: Admin, BDM, IT, Marketing, Sales, Partner), `locale` (nl/en), `status` (active/deactivated), `partnerId` (nullable FK), `createdAt`, `updatedAt`
  - [x] 2.2 Create seed script with initial Admin user and test users per role
  - [x] 2.3 Run migration and verify schema

- [x] **Task 3: Auth & Session Service** (AC: #1, #2, #3, #5, #6)
  - [x] 3.1 Install and configure `express-session` + `connect-redis` as session store
  - [x] 3.2 Configure secure cookie settings: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `maxAge` from `SESSION_TIMEOUT_MINUTES`
  - [x] 3.3 Install and configure Passport.js with `passport-local` strategy
  - [x] 3.4 Implement `POST /api/auth/login` — validate email + bcrypt password, create session, return user profile (without sensitive fields)
  - [x] 3.5 Implement `POST /api/auth/logout` — destroy session, clear cookie
  - [x] 3.6 Implement `GET /api/auth/me` — return current authenticated user or 401
  - [x] 3.7 Implement session timeout: Redis TTL = `SESSION_TIMEOUT_MINUTES`, session touch on activity to extend idle timeout

- [x] **Task 4: Auth Guards & Middleware** (AC: #4, #7)
  - [x] 4.1 Create `AuthenticatedGuard` — rejects with 401 if no valid session
  - [x] 4.2 Apply `AuthenticatedGuard` globally (except auth routes)
  - [x] 4.3 Create session serializer that stores `userId` + `role` + `partnerId` in session
  - [x] 4.4 Create `CurrentUser` decorator to extract user from session in controllers

- [x] **Task 5: Login UI** (AC: #1, #2)
  - [x] 5.1 Create minimal login page: email + password form, error display, SPOQ branding
  - [x] 5.2 Implement API client with axios, cookie-based session handling (`withCredentials: true`)
  - [x] 5.3 Add auth context provider: check `GET /api/auth/me` on app load, redirect to login if 401
  - [x] 5.4 Add logout button in app shell
  - [x] 5.5 Handle session expiry: intercept 401 responses globally, redirect to login

- [x] **Task 6: Tests** (AC: all)
  - [x] 6.1 Unit tests: password hashing, session serialization, guard logic
  - [x] 6.2 Integration tests: login flow (valid/invalid), logout, session timeout, unauthenticated access denied
  - [x] 6.3 Verify session works across simulated multiple API instances (same Redis store)

### Review Findings

- [x] [Review][Patch] Missing `rolling: true` in session config — AC3 session idle timeout requires TTL reset on activity [apps/api/src/main.ts:20] — FIXED
- [x] [Review][Patch] `/api/auth/me` returns 200 with `{statusCode: 401}` body instead of throwing UnauthorizedException [apps/api/src/auth/auth.controller.ts:48] — FIXED
- [x] [Review][Patch] Missing Express/Passport type augmentation for `Request.user` [apps/api/src/types/express.d.ts] — FIXED

## Dev Notes

### This Is the Foundation Story

This story sets up the entire project structure. Every subsequent story builds on what is established here. Get the patterns right — they will be replicated 20+ times.

### Tech Stack Decisions (Architecture Left Open)

The architecture doc is technology-agnostic. These choices align with the architecture requirements (SPA, stateless API, relational DB, cache layer, session-based auth):

| Layer | Technology | Why |
|---|---|---|
| **Backend** | NestJS (Node.js, TypeScript) | Enterprise-grade, modular, built-in guards/decorators/DI, strong Passport.js integration |
| **Frontend** | React 19 + Vite | Fast SPA dev, large ecosystem, good i18n support for future bilingual requirement |
| **Database** | PostgreSQL 16 | Robust relational DB, row-level security support, excellent for complex queries |
| **ORM** | Prisma | Type-safe, auto-generated client, clean migration system |
| **Session Store** | Redis 7 | Required for stateless API instances sharing sessions across load balancer |
| **Auth** | Passport.js + express-session + connect-redis | Proven session-based auth stack for NestJS |
| **Password Hashing** | bcrypt (cost factor 12) | Industry standard |
| **Package Manager** | pnpm | Fast, disk-efficient monorepo support |

### Architecture Constraints to Follow

- **Server-side RBAC mandatory** — UI filtering is never sufficient (Security NFR). Every API endpoint must validate role + partner scope server-side.
- **Stateless API** — No in-memory session state. All session data in Redis.
- **Partner tenancy guard at query layer** — Not implemented in this story, but the `partnerId` in session and User model lays the foundation for Story 1.3.
- **Audit logging** — AuditEvent entity for sensitive operations. Implement login/logout audit events now; the pattern expands in later stories.

### Session Configuration

```
SESSION_SECRET=<generate-strong-random-secret>
SESSION_TIMEOUT_MINUTES=30
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://spoq:spoq@db:5432/spoq_onboarding
NODE_ENV=development
```

Session idle timeout works via Redis TTL: each request touches the session, resetting the TTL. If no requests arrive within `SESSION_TIMEOUT_MINUTES`, Redis evicts the session, and the next request gets 401.

### Cookie Security Settings

| Flag | Value | Reason |
|---|---|---|
| `httpOnly` | `true` | Prevent XSS access to session cookie |
| `secure` | `true` in production | Cookie only sent over HTTPS |
| `sameSite` | `lax` | CSRF protection while allowing normal navigation |
| `maxAge` | `SESSION_TIMEOUT_MINUTES * 60 * 1000` | Align cookie expiry with server-side TTL |

### API Endpoints (This Story)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Email + password login |
| `POST` | `/api/auth/logout` | Authenticated | Destroy session |
| `GET` | `/api/auth/me` | Authenticated | Current user profile |

All other endpoints return 401 if not authenticated. RBAC (role-based filtering) is not enforced in this story — that's Story 1.3.

### User Model (Prisma Schema)

```prisma
enum UserRole {
  ADMIN
  BDM
  IT
  MARKETING
  SALES
  PARTNER
}

enum UserStatus {
  ACTIVE
  DEACTIVATED
}

model User {
  id           String     @id @default(cuid())
  email        String     @unique
  passwordHash String
  role         UserRole
  locale       String     @default("nl")
  status       UserStatus @default(ACTIVE)
  partnerId    String?
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@index([email])
  @@index([partnerId])
}
```

### Seed Data

Create these test users for development:

| Email | Password | Role | Notes |
|---|---|---|---|
| admin@spoq.nl | Admin123! | ADMIN | System administrator |
| sarah@spoq.nl | Sarah123! | BDM | Primary BDM user |
| tom@spoq.nl | Tom123! | IT | IT specialist |
| lisa@spoq.nl | Lisa123! | MARKETING | Marketing role |
| pieter@spoq.nl | Pieter123! | SALES | Sales role |
| marc@techflow.be | Marc123! | PARTNER | Partner user (partnerId links to partner record) |

### Deployment: Docker & EasyPanel

**Local development** (`docker-compose.yml`):
- `api` service: NestJS app on port 3000
- `db` service: PostgreSQL 16 on port 5432
- `redis` service: Redis 7 on port 6379
- Volume mounts for hot-reload

**Production** (EasyPanel):
- Single `Dockerfile` multi-stage build: install deps → build → run
- EasyPanel manages PostgreSQL and Redis as separate services
- Environment variables injected via EasyPanel config
- GitHub repo connected to EasyPanel for auto-deploy on push

### Monorepo Structure

```
/
├── apps/
│   ├── api/                    # NestJS backend
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── auth/           # Auth module (this story)
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   ├── session.serializer.ts
│   │   │   │   ├── guards/
│   │   │   │   │   └── authenticated.guard.ts
│   │   │   │   └── decorators/
│   │   │   │       └── current-user.decorator.ts
│   │   │   ├── users/          # User module (this story)
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   └── dto/
│   │   │   └── prisma/         # Prisma module
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── test/
│   │   └── Dockerfile
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   └── Login.tsx
│       │   ├── contexts/
│       │   │   └── AuthContext.tsx
│       │   ├── api/
│       │   │   └── client.ts
│       │   └── components/
│       │       └── AppShell.tsx
│       ├── index.html
│       └── vite.config.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── pnpm-workspace.yaml
├── package.json
└── tsconfig.base.json
```

### What NOT to Build in This Story

- RBAC enforcement beyond basic authentication → Story 1.3
- Admin user CRUD UI → Story 1.2
- Partner invitation flow → Story 4.1
- Password reset / forgot password → Not in MVP scope
- MFA / SSO → Deferred (PRD Appendix #6)
- Partner self-registration → Phase 3 Vision

### Error Response Contract

All auth errors should follow a consistent shape for the frontend:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Invalid credentials"
}
```

Never leak whether the email exists — always return the same generic message for invalid email vs wrong password.

### Project Structure Notes

- Monorepo pattern allows shared TypeScript types between API and Web
- Prisma client is generated in the API workspace and can be shared
- The `apps/api/src/auth/` module is self-contained — future stories add modules alongside it
- Docker Compose mirrors production topology (separate DB, Redis, API containers)

### References

- [Source: _bmad-output/planning-artifacts/prd.md — FR20, FR31-FR34, Security NFRs, Appendix §Auth]
- [Source: _bmad-output/planning-artifacts/architecture.md — §3.2 Auth & Session Service, §7 Security Architecture, §4 Domain Model: User entity]
- [Source: _bmad-output/planning-artifacts/architecture.md — §8 Performance: stateless API, §13 Implementation Sequence: Foundation first]
- [Source: _bmad-output/planning-artifacts/epics-and-stories.md — Story 1.1 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — §8 Accessibility, §3 Navigation]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6

### Debug Log References
- pnpm unavailable due to system permissions — switched to npm workspaces (functionally equivalent)
- All 10 unit tests pass (AuthService: 7, AuthenticatedGuard: 3)

### Completion Notes List
- Monorepo scaffolded with npm workspaces (`apps/api` + `apps/web`)
- Prisma schema with User model (6 roles, status, partnerId) and seed data (6 test users)
- Full NestJS auth module: LocalStrategy, SessionSerializer, AuthService with bcrypt (cost 12)
- express-session + connect-redis with configurable timeout via SESSION_TIMEOUT_MINUTES
- Secure cookie config: httpOnly, secure (prod), sameSite=lax, maxAge from env
- AuthenticatedGuard applied globally with @Public() decorator for exemptions
- CurrentUser decorator extracts user from session
- passwordHash never exposed in API responses (SafeUser type)
- Generic "Invalid credentials" error for both unknown email and wrong password (no credential leak)
- React login page with SPOQ branding, AuthContext, axios client with 401 intercept
- AppShell with sidebar, user info display, logout button
- Docker Compose for local dev (API + PostgreSQL 16 + Redis 7)
- Multi-stage Dockerfile for production EasyPanel deployment

### Change Log
- 2026-05-20: Initial implementation of Story 1.1 — all tasks and subtasks completed
- 2026-05-20: Code review — 3 patch findings identified and fixed (rolling session, /me endpoint, type augmentation)

### File List
- `package.json` — root workspace config (npm workspaces)
- `tsconfig.base.json` — shared TypeScript config
- `.env.example` — environment variable template
- `.gitignore` — git ignore rules
- `docker-compose.yml` — local dev services (API, PostgreSQL, Redis)
- `Dockerfile` — multi-stage production build
- `apps/api/package.json` — API dependencies and scripts
- `apps/api/tsconfig.json` — API TypeScript config
- `apps/api/nest-cli.json` — NestJS CLI config
- `apps/api/prisma/schema.prisma` — User model with enums
- `apps/api/prisma/seed.ts` — seed script with 6 test users
- `apps/api/src/main.ts` — NestJS bootstrap with session/passport/CORS
- `apps/api/src/app.module.ts` — root module with global AuthenticatedGuard
- `apps/api/src/prisma/prisma.module.ts` — global Prisma module
- `apps/api/src/prisma/prisma.service.ts` — Prisma client lifecycle
- `apps/api/src/users/users.module.ts` — Users module
- `apps/api/src/users/users.service.ts` — User lookup service
- `apps/api/src/auth/auth.module.ts` — Auth module (Passport session mode)
- `apps/api/src/auth/auth.service.ts` — credential validation, profile retrieval
- `apps/api/src/auth/auth.controller.ts` — login/logout/me endpoints
- `apps/api/src/auth/local.strategy.ts` — Passport local strategy (email field)
- `apps/api/src/auth/session.serializer.ts` — session serialize/deserialize (userId, role, partnerId)
- `apps/api/src/auth/guards/authenticated.guard.ts` — global auth guard with @Public() support
- `apps/api/src/auth/guards/local-auth.guard.ts` — Passport local guard with session login
- `apps/api/src/auth/decorators/current-user.decorator.ts` — extract user from request
- `apps/api/src/auth/decorators/public.decorator.ts` — mark routes as public
- `apps/api/src/auth/auth.service.spec.ts` — AuthService unit tests (7 tests)
- `apps/api/src/auth/guards/authenticated.guard.spec.ts` — Guard unit tests (3 tests)
- `apps/api/test/jest-e2e.json` — e2e test config
- `apps/api/test/auth.e2e-spec.ts` — auth e2e tests
- `apps/web/package.json` — web app dependencies
- `apps/web/tsconfig.json` — web TypeScript config
- `apps/web/vite.config.ts` — Vite config with API proxy
- `apps/web/index.html` — HTML entry point
- `apps/web/src/main.tsx` — React entry with providers
- `apps/web/src/App.tsx` — root component (auth routing)
- `apps/web/src/index.css` — global styles
- `apps/web/src/api/client.ts` — axios with credentials and 401 intercept
- `apps/web/src/contexts/AuthContext.tsx` — auth state management
- `apps/web/src/pages/Login.tsx` — login form with error handling
- `apps/web/src/components/AppShell.tsx` — app layout with sidebar and logout
- `apps/api/src/types/express.d.ts` — Passport type augmentation for Request.user
