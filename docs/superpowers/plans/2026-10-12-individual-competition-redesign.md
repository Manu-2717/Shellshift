# ShellShift Individual Competition Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace team-oriented competition with individually registered, scheduled games and deliver a polished, responsive player and admin experience.

**Architecture:** Extend the Prisma domain with game-scoped challenge and registration records, move run ownership and standings to users, and centralize lifecycle decisions in a server-side game-state module. Build the new experience as focused App Router pages and small client components over reusable design-system primitives, preserving the existing virtual shell and scoring engines.

**Tech Stack:** Next.js 16.4 App Router, React 19.3, TypeScript, Prisma 6 with SQLite, Tailwind CSS 4, Lucide React, Vitest, Browser/IAB visual QA.

**Spec:** `docs/superpowers/specs/2026-10-12-individual-competition-redesign.md`

## Global Constraints

- Preserve the virtual filesystem, command remapping, cipher, objective-validation, hint, timer, and scoring behavior.
- Rankings, registrations, attempts, and scores belong to individual users, never teams.
- Use additive database migrations; do not delete legacy users, teams, runs, or scores.
- Server timestamps and lifecycle validation are authoritative.
- New UI must work at 320px mobile width, tablet widths, and 1440px desktop without accidental horizontal scrolling.
- Meet WCAG AA contrast, visible focus, keyboard navigation, persistent form labels, 44px primary touch targets, and reduced-motion behavior.
- Use monospace only for commands, paths, codes, timers, and operational data; use a legible sans-serif for interface copy.
- Keep the terminal as the dominant play surface at every breakpoint.
- Read the relevant Next.js 16 guides in `node_modules/next/dist/docs/01-app/` before each App Router implementation task.
- Preserve unrelated existing working-tree changes and stage only task-owned files in commits.

## Review Focus

- Boundary timestamps: registration and play actions at the exact open/close/start/end millisecond must resolve consistently on server and client; Task 1 pins these cases.
- Multiple tabs: two simultaneous run-start requests must produce one active user run for the game challenge; Task 4 pins transactional idempotency.
- Mid-session state changes: pause or end during command execution must reject mutation safely and show a recoverable player state; Tasks 5 and 9 pin this.
- Migration ambiguity: legacy team-owned runs without one provable user owner must remain preserved but excluded from individual standings; Task 2 pins this.
- Timezones and DST: admin-entered local schedules must round-trip to UTC and display in the chosen IANA timezone without reordering; Tasks 3 and 7 pin this.

---

### Task 1: Game lifecycle domain

**Files:**
- Create: `src/lib/games/types.ts`
- Create: `src/lib/games/lifecycle.ts`
- Create: `src/lib/games/lifecycle.test.ts`

**Interfaces:**
- Produces: `deriveGamePhase(game: GameSchedule, now: Date): GamePhase`
- Produces: `validateGameSchedule(input: GameScheduleInput): ScheduleValidation`
- Produces: `canTransitionGame(from: StoredGameStatus, to: StoredGameStatus): boolean`

- [ ] **Step 1: Write failing lifecycle tests** for draft, published, registration-open, scheduled, live, paused, ended, and archived states, including exact boundary instants and invalid timestamp order.
- [ ] **Step 2: Run `npm test -- src/lib/games/lifecycle.test.ts`** and verify failures reference missing lifecycle exports.
- [ ] **Step 3: Implement the lifecycle types and pure functions** with UTC `Date` comparison and explicit manual-status precedence.
- [ ] **Step 4: Run `npm test -- src/lib/games/lifecycle.test.ts`** and verify all lifecycle cases pass.
- [ ] **Step 5: Commit** `src/lib/games/*` with message `feat: add authoritative game lifecycle`.

### Task 2: Individual competition data model and migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/<timestamp>_individual_competitions/migration.sql`
- Create: `src/lib/games/migration.test.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: lifecycle enum strings from Task 1.
- Produces: Prisma models `GameChallenge`, `GameRegistration`; user/game relations on `Run`; game schedule fields.

- [ ] **Step 1: Write failing integration tests** asserting unique `(gameId, userId)` registrations, unique game-challenge membership, user-owned runs, and exclusion metadata for ambiguous legacy runs.
- [ ] **Step 2: Run `npm test -- src/lib/games/migration.test.ts`** and verify schema-related failure.
- [ ] **Step 3: Extend the Prisma schema additively** with relations, indexes, lifecycle fields, `legacyTeamId`, and `legacyIndividualEligible` while retaining the existing team records.
- [ ] **Step 4: Generate and inspect the SQL migration** so it adds and backfills data without dropping legacy tables or records.
- [ ] **Step 5: Update the seed** to create one scheduled sample game, its ordered challenge lineup, and individual sample registrations.
- [ ] **Step 6: Run `npx prisma generate`, `npx prisma migrate deploy`, and the migration test**; verify all pass against an isolated temporary SQLite database.
- [ ] **Step 7: Commit** schema, migration, seed, and tests with message `feat: model individual competitions`.

### Task 3: Game service, scheduling, and admin APIs

**Files:**
- Create: `src/lib/games/service.ts`
- Create: `src/lib/games/service.test.ts`
- Create: `src/app/api/admin/games/route.ts`
- Create: `src/app/api/admin/games/[gameId]/route.ts`
- Create: `src/app/api/admin/games/[gameId]/status/route.ts`
- Create: `src/app/api/admin/games/[gameId]/publish/route.ts`

**Interfaces:**
- Consumes: Task 1 lifecycle functions and Task 2 Prisma models.
- Produces: `createGameDraft`, `updateGameDraft`, `publishGame`, `transitionGameStatus`, and serialized admin-game DTOs.

- [ ] **Step 1: Write failing service tests** for draft saving, IANA timezone validation, DST-safe UTC persistence, lineup validation, publish rejection, permitted transitions, and audit logging.
- [ ] **Step 2: Run `npm test -- src/lib/games/service.test.ts`** and verify missing-service failures.
- [ ] **Step 3: Implement the game service** with transactions for lineup updates, publish validation, and lifecycle changes.
- [ ] **Step 4: Implement admin route handlers** that require `ADMIN`, validate JSON bodies, return field-addressable errors, and call only the service layer.
- [ ] **Step 5: Run the service tests and `npm run lint`**; verify both pass.
- [ ] **Step 6: Commit** the service and routes with message `feat: add scheduled game administration APIs`.

### Task 4: Registration, individual run start, and standings services

**Files:**
- Create: `src/lib/games/registration.ts`
- Create: `src/lib/games/registration.test.ts`
- Create: `src/lib/games/standings.ts`
- Create: `src/lib/games/standings.test.ts`
- Create: `src/app/api/games/[gameId]/register/route.ts`
- Create: `src/app/api/games/[gameId]/standings/route.ts`
- Modify: `src/app/api/runs/start/route.ts`
- Modify: `src/app/api/leaderboard/route.ts`

**Interfaces:**
- Produces: `registerUserForGame(gameId, userId, now)` and `getGameStandings(gameId, viewerId)`.
- Produces: idempotent user-owned run start scoped by `(gameId, challengeId, userId)`.

- [ ] **Step 1: Write failing registration and standings tests** for window eligibility, uniqueness, disqualification, hidden/live/final policies, score ordering, tie breaks, and ambiguous legacy exclusion.
- [ ] **Step 2: Add a concurrent-start integration test** asserting two requests create or return the same single active run.
- [ ] **Step 3: Run the focused tests** and verify they fail before implementation.
- [ ] **Step 4: Implement registration and standings services** with explicit authorization and game scoping.
- [ ] **Step 5: Update run-start and compatibility leaderboard routes** so team identity is never used for new competition behavior.
- [ ] **Step 6: Run focused tests plus `npm test`** and verify the entire suite passes.
- [ ] **Step 7: Commit** with message `feat: add individual registration runs and standings`.

### Task 5: Command and result authorization

**Files:**
- Modify: `src/app/api/runs/[runId]/commands/route.ts`
- Modify: `src/app/api/runs/[runId]/hints/[hintId]/route.ts`
- Modify: `src/app/api/runs/[runId]/route.ts`
- Modify: `src/app/results/[runId]/page.tsx`
- Create: `src/lib/games/runAccess.test.ts`

**Interfaces:**
- Consumes: user-owned runs and authoritative lifecycle from Tasks 1–4.
- Produces: consistent `GAME_PAUSED`, `GAME_ENDED`, `RUN_FORBIDDEN`, and `RUN_EXPIRED` API errors.

- [ ] **Step 1: Write failing access tests** for cross-user reads/mutations, pause during play, end during execution, expiry, and registered-owner success.
- [ ] **Step 2: Run the focused test** and verify current team-based authorization fails expectations.
- [ ] **Step 3: Replace team checks with user-and-game ownership checks** and lifecycle gates in run, command, and hint handlers.
- [ ] **Step 4: Update result loading** to require the owning user or an administrator and expose an individual result DTO.
- [ ] **Step 5: Run the access test and full suite**; verify all pass.
- [ ] **Step 6: Commit** with message `fix: enforce individual run ownership`.

### Task 6: Visual concepts and design-system foundation

**Files:**
- Create: `design-system/shellshift/MASTER.md`
- Create: `docs/design/concepts/` image assets
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/StatusBadge.tsx`
- Create: `src/components/ui/Field.tsx`
- Create: `src/components/ui/Notice.tsx`
- Create: `src/components/ui/Dialog.tsx`
- Create: `src/components/ui/Tabs.tsx`

**Interfaces:**
- Produces: accepted screen concepts, CSS tokens, typography, focus/motion rules, and reusable UI primitives.

- [ ] **Step 1: Use the UI/UX search tool** to generate and persist the ShellShift design system with balanced variance, standard motion, and medium admin density.
- [ ] **Step 2: Generate complete visual concepts** for games discovery/detail, live lobby, desktop/mobile play, admin overview, game builder, live operations, and individual standings.
- [ ] **Step 3: Inspect every concept with `view_image`** and regenerate any unreadable, incomplete, or inconsistent surface.
- [ ] **Step 4: Extract exact tokens, typography, component variants, responsive rules, copy inventory, and allowed icon treatment** into `MASTER.md`.
- [ ] **Step 5: Implement global tokens and accessible primitives**, including visible focus, 44px controls, disabled/loading states, reduced motion, dialog focus behavior, and field error linkage.
- [ ] **Step 6: Add component tests** for keyboard activation, dialog focus restoration, tab semantics, and field error associations.
- [ ] **Step 7: Run component tests, lint, and build**; verify all pass.
- [ ] **Step 8: Commit** concepts and foundations with message `feat: establish shellshift design system`.

### Task 7: Admin shell and game builder

**Files:**
- Replace: `src/app/admin/page.tsx`
- Replace: `src/app/admin/AdminClient.tsx`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/games/page.tsx`
- Create: `src/app/admin/games/new/page.tsx`
- Create: `src/app/admin/games/[gameId]/page.tsx`
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/components/admin/GameBuilder.tsx`
- Create: `src/components/admin/ScheduleStep.tsx`
- Create: `src/components/admin/ChallengeLineupStep.tsx`
- Create: `src/components/admin/PublishReview.tsx`

**Interfaces:**
- Consumes: Task 3 APIs and Task 6 primitives.
- Produces: draft-saving four-step game builder and responsive admin navigation.

- [ ] **Step 1: Write failing UI tests** for admin authorization, step navigation, draft persistence, UTC/IANA timezone round-trip including DST, inline validation, and publish confirmation.
- [ ] **Step 2: Implement the responsive admin shell and overview** matching the accepted concept.
- [ ] **Step 3: Implement the four-step builder** with structured fields, searchable challenge ordering, review summary, and accessible errors.
- [ ] **Step 4: Run focused UI tests and lint**; verify all pass.
- [ ] **Step 5: Render desktop, tablet, and mobile screenshots** and compare them to accepted admin concepts; record and fix every mismatch.
- [ ] **Step 6: Commit** with message `feat: build admin game hosting experience`.

### Task 8: Challenge library and structured authoring

**Files:**
- Create: `src/app/admin/challenges/page.tsx`
- Create: `src/app/admin/challenges/new/page.tsx`
- Create: `src/app/admin/challenges/[challengeId]/page.tsx`
- Create: `src/components/admin/ChallengeEditor.tsx`
- Create: `src/components/admin/MappingEditor.tsx`
- Create: `src/components/admin/ClueEditor.tsx`
- Create: `src/components/admin/ObjectiveEditor.tsx`
- Modify: `src/app/api/admin/challenges/route.ts`
- Create: `src/app/api/admin/challenges/[challengeId]/route.ts`

**Interfaces:**
- Consumes: existing validator and Task 6 primitives.
- Produces: structured challenge CRUD while preserving an opt-in advanced JSON view.

- [ ] **Step 1: Write failing editor tests** for structured mapping, clue, filesystem, objective, hint, timing, scoring, validation-error placement, and preview authorization.
- [ ] **Step 2: Implement challenge list and editor components** with array row controls and no required raw JSON entry.
- [ ] **Step 3: Add update/read APIs** with admin authorization and existing validator reuse.
- [ ] **Step 4: Run focused tests, full tests, and lint**; verify all pass.
- [ ] **Step 5: Render responsive screenshots and fix concept mismatches**.
- [ ] **Step 6: Commit** with message `feat: add structured challenge authoring`.

### Task 9: Player discovery, registration, lobby, and profile

**Files:**
- Redesign: `src/app/page.tsx`
- Create: `src/app/games/page.tsx`
- Create: `src/app/games/[gameId]/page.tsx`
- Create: `src/app/games/[gameId]/lobby/page.tsx`
- Create: `src/app/games/[gameId]/standings/page.tsx`
- Create: `src/app/profile/page.tsx`
- Replace: `src/app/register/page.tsx` with redirect/legacy notice
- Modify: `src/components/Navbar.tsx`
- Create: `src/components/games/GameAction.tsx`
- Create: `src/components/games/GameCountdown.tsx`
- Create: `src/components/games/GameLobby.tsx`
- Create: `src/components/games/StandingsTable.tsx`

**Interfaces:**
- Consumes: Task 4 APIs and Task 6 primitives.
- Produces: complete individual player journey through pre-game and live lobby states.

- [ ] **Step 1: Write failing UI tests** for every context-aware action, registration success/error, exact boundary rollover, waiting room, lineup privacy before start, and signed-in player highlighting.
- [ ] **Step 2: Implement home, games index, and detail pages** with server-rendered state and one primary action.
- [ ] **Step 3: Implement registration, waiting room, live lobby, standings, and profile** with server-corrected countdowns and accessible live updates.
- [ ] **Step 4: Retire team registration from navigation and redirect legacy entry points safely**.
- [ ] **Step 5: Run focused tests, full tests, lint, and build**.
- [ ] **Step 6: Capture responsive screenshots and repair every visual mismatch** against accepted player concepts.
- [ ] **Step 7: Commit** with message `feat: deliver individual player competition flow`.

### Task 10: Terminal-first play workspace and completion flow

**Files:**
- Redesign: `src/app/play/[runId]/page.tsx`
- Modify: `src/components/Terminal.tsx`
- Modify: `src/components/ObjectiveBar.tsx`
- Modify: `src/components/CipherWorkspace.tsx`
- Modify: `src/components/FilesystemTree.tsx`
- Modify: `src/components/LiveTimer.tsx`
- Redesign: `src/app/results/[runId]/page.tsx`
- Create: `src/components/play/PlayShell.tsx`
- Create: `src/components/play/ContextPanel.tsx`
- Create: `src/components/play/CompletionSummary.tsx`

**Interfaces:**
- Consumes: Tasks 5–6 APIs and primitives.
- Produces: responsive terminal-first workspace and individual result summary.

- [ ] **Step 1: Write failing interaction tests** for command focus/history, accessible output, objective updates, context tabs/sheets, mobile keyboard layout, network recovery, pause/end state, and completion transition.
- [ ] **Step 2: Implement desktop play shell** with stable top status, objective rail, dominant terminal, and tabbed context panel.
- [ ] **Step 3: Implement mobile play shell** with terminal-first flow, safe-area controls, and accessible sheets/tabs.
- [ ] **Step 4: Replace emoji status output with semantic icon/text presentation** and prevent screen-reader flooding from timer/output updates.
- [ ] **Step 5: Implement completion summary** with score breakdown, duration, penalties, personal rank, and next action.
- [ ] **Step 6: Run interaction tests, full tests, lint, and build**.
- [ ] **Step 7: Capture native-size desktop and mobile screenshots and repair every visual mismatch**.
- [ ] **Step 8: Commit** with message `feat: redesign terminal competition workspace`.

### Task 11: Live admin operations console

**Files:**
- Create: `src/app/admin/games/[gameId]/live/page.tsx`
- Create: `src/components/admin/LiveOperations.tsx`
- Create: `src/components/admin/ParticipantTable.tsx`
- Create: `src/components/admin/ActivityFeed.tsx`
- Create: `src/app/api/admin/games/[gameId]/operations/route.ts`
- Modify: `src/app/api/admin/runs/route.ts`

**Interfaces:**
- Consumes: Task 3 status actions, Task 4 standings, and Task 6 components.
- Produces: live operational DTO and pause/resume/end command surface.

- [ ] **Step 1: Write failing tests** for registered/active/completed counts, filtered activity, pause/resume/end confirmations, action audit records, and empty states.
- [ ] **Step 2: Implement the operations query and admin-only route** with bounded recent activity.
- [ ] **Step 3: Implement the live console** with server time, health notices, participant status, standings, activity, and guarded controls.
- [ ] **Step 4: Run focused tests, full tests, lint, and build**.
- [ ] **Step 5: Capture desktop and mobile screenshots and repair every visual mismatch**.
- [ ] **Step 6: Commit** with message `feat: add live competition operations console`.

### Task 12: End-to-end verification and cleanup

**Files:**
- Modify: `README.md`
- Modify: `docs/oidc-setup.md` only if routes or setup references are stale
- Create: `docs/testing/individual-competition-qa.md`
- Remove: temporary QA screenshots and debug artifacts only

**Interfaces:**
- Consumes: all previous tasks.
- Produces: verified release candidate and reproducible QA record.

- [ ] **Step 1: Run `npm test`, `npm run lint`, and `npm run build`** and fix all regressions without weakening tests.
- [ ] **Step 2: Seed a clean database and complete the core browser path**: admin creates/publishes a scheduled game; player registers; game becomes live; player starts and completes a challenge; individual standings update; admin ends the game.
- [ ] **Step 3: Repeat critical flows at 320px, tablet, and 1440px**, including keyboard-only and reduced-motion checks.
- [ ] **Step 4: Inspect the accepted concept images and latest browser screenshots with `view_image`**, comparing at least hierarchy, copy, color, typography, spacing, icon treatment, and responsive composition.
- [ ] **Step 5: Record and repair every material mismatch** until agency-signoff fidelity is reached and no fixable deviations remain.
- [ ] **Step 6: Update documentation** for individual games, routes, admin hosting, lifecycle, and migration behavior.
- [ ] **Step 7: Run final tests, lint, and build again** and record exact results in the QA document.
- [ ] **Step 8: Commit** documentation and final repairs with message `docs: finalize individual competition rollout`.

