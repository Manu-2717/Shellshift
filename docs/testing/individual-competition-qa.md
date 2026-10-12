# ShellShift — Individual Competition Quality Assurance (QA) Report

**Date**: 2026-10-12  
**Version**: 0.2.0 (Individual Competition Architecture)  
**Environment**: Node.js v20+, Next.js 16.4.0 (Turbopack), Vitest 5.0.3, Prisma 6.19.3, SQLite/PostgreSQL  

---

## 1. Executive Summary

The individual competition redesign transitions ShellShift from team-only play to an individual player competitive architecture featuring:
- **Hosted Games**: Configurable schedules, IANA timezones, registration windows, and lifecycle states (`DRAFT`, `PUBLISHED`, `PAUSED`, `ENDED`, `ARCHIVED`).
- **Individual Contender Flow**: Zero-team barrier to entry; players register directly with their verified OIDC identity, wait in real-time lobbies, and race on individual tracks.
- **Terminal-First Play Workspace**: High-density 7/5 desktop grid (or mobile drawer) keeping the terminal central, accompanied by cipher inspection, virtual filesystem tree, scratchpad, and command handbook.
- **Authoritative Deterministic Scoring**: Server-side timestamps, intermediate objective budgets (up to 500 pts), completion bonuses (200 pts), speed bonuses (up to 300 pts), and capped hint penalties.
- **Live Operations Console**: Real-time supervision console for event organizers with participant tracking, live command activity feeds, and guarded pause/resume/end controls.
- **Zero Host Execution & Clean Design**: Strictly in-memory virtual filesystem with sandboxed interpreters, Lucide SVG iconography (zero emojis), and developer-grade dark terminal aesthetics.

---

## 2. Test Execution & Verification

### 2.1 Automated Test Suites (Vitest)
All 19 test suites and 101 tests pass with zero failures:

```
Test Files  19 passed (19)
Tests       101 passed (101)
Duration    1.53s
```

| Test Suite | Tests | Status | Scope |
|---|---|---|---|
| `src/lib/games/e2eFlow.test.ts` | 1 | Passed | End-to-end individual competition lifecycle |
| `src/lib/games/lifecycle.test.ts` | 4 | Passed | Phase derivation, schedule rollover, pause/ended flags |
| `src/lib/games/registration.test.ts` | 1 | Passed | Individual registration windows, idempotency, user link |
| `src/lib/games/runAccess.test.ts` | 2 | Passed | Contender isolation, admin bypass, expiration & pause guards |
| `src/lib/games/service.test.ts` | 3 | Passed | Input normalization, timezone validation, publish prerequisites |
| `src/lib/games/standings.test.ts` | 1 | Passed | Best-score deduplication, tiebreaks (completions, time) |
| `src/lib/games/migration.test.ts` | 2 | Passed | Legacy run eligibility and schema backward compatibility |
| `src/components/admin/liveOperations.test.ts` | 3 | Passed | Live telemetry, activity streams, guarded action controls |
| `src/components/admin/challengeEditor.test.ts` | 1 | Passed | Structured mapping, clue, objective, and hint editing |
| `src/components/admin/adminUi.test.ts` | 1 | Passed | Admin navigation shell, games index, and challenge list |
| `src/components/play/playWorkspace.test.ts` | 5 | Passed | PlayShell, ContextPanel tabs, and completion presentation |
| `src/components/games/playerFlow.test.ts` | 1 | Passed | Lobby, countdown, action button, and standings table |
| `src/components/ui/designSystem.test.ts` | 2 | Passed | Semantic badges, dialog primitives, non-emoji rendering |
| `src/lib/auth/oidc.test.ts` | 17 | Passed | PKCE S256, JWKS verification, live discovery, session JWT |
| `src/lib/vfs/vfs.test.ts` | 20 | Passed | VFS sandbox isolation, command parsing, path traversal defense |
| `src/lib/challenges/challenges.test.ts` | 6 | Passed | Seed challenges, clue structures, objective validation |
| `src/lib/ciphers/ciphers.test.ts` | 10 | Passed | Morse, Base64, Hex, Binary, ROT13, Caesar, URL, ASCII dec |
| `src/lib/scoring/scoringEngine.test.ts` | 13 | Passed | Deterministic point budget, speed bonus, hint cap calculations |
| `src/lib/integration.test.ts` | 8 | Passed | Concurrency guards, rate limits, team backward compatibility |

### 2.2 ESLint Validation
`npm run lint` completed with **0 errors**:
- Verified TypeScript strict adherence.
- Verified React Compiler rules and pure initializers.

### 2.3 Next.js Production Build
`npm run build` executed successfully using Turbopack:
```
▲ Next.js 16.4.0 (Turbopack)
✓ Compiled successfully in 632ms
✓ Finished TypeScript in 2.8s
✓ Collecting page data using 15 workers in 1230ms
✓ Generating static pages using 15 workers (23/23) in 324ms
```

---

## 3. Route & Component Checklist

| Route | Type | Description & Access Control |
|---|---|---|
| `/` | Dynamic | Landing page with active/upcoming competition banner and hero sandbox |
| `/games` | Dynamic | Player competition directory with filter tabs (`Live & Upcoming`, `Completed`) |
| `/games/[gameId]` | Dynamic | Competition details, registration CTA, countdown timer, challenge count |
| `/games/[gameId]/lobby` | Dynamic | Pre-game waiting room; reveals challenge lineup upon event start |
| `/games/[gameId]/standings`| Dynamic | Live individual standings with best-score aggregation and viewer highlight |
| `/profile` | Dynamic | Player profile with verified OIDC identity and registered tournament history |
| `/register` | Static | Legacy team registration URL safely redirecting to individual games |
| `/play/[runId]` | Dynamic | Terminal-first competition workspace with objective rail and context panel |
| `/results/[runId]` | Dynamic | Server-verified result summary with score breakdown and standings link |
| `/admin` | Dynamic | Admin dashboard with system metrics, quick game launcher, player telemetry |
| `/admin/games` | Dynamic | Hosted competitions index with status filters and create CTA |
| `/admin/games/new` | Dynamic | Form for scheduled games (name, slug, dates, timezone, challenge lineup) |
| `/admin/games/[gameId]` | Dynamic | Editor to update metadata, modify challenges, or publish drafts |
| `/admin/games/[gameId]/live` | Dynamic | Real-time operations console: contenders, activity feed, pause/resume/end |
| `/admin/challenges` | Dynamic | Challenge authoring table with difficulty and remapping summaries |
| `/admin/challenges/new` | Dynamic | Visual builder for commands, ciphers, VFS trees, objectives, hints |
| `/admin/challenges/[id]` | Dynamic | Edit existing challenge parameters with validation error feedback |
| `/api/admin/games` | API | Admin game CRUD endpoints |
| `/api/admin/games/[id]/operations` | API | Real-time live operations telemetry endpoint (8s poll) |
| `/api/admin/games/[id]/publish` | API | Publish validation (requires scheduled dates & at least 1 challenge) |
| `/api/admin/games/[id]/status` | API | Admin status transition endpoint (`PAUSED`, `PUBLISHED`, `ENDED`) |
| `/api/games/[id]/register` | API | Contender registration with idempotency and time window checks |
| `/api/games/[id]/standings` | API | Public/restricted game standings with deterministic tiebreaks |
| `/api/runs/start` | API | Starts individual run and initializes server-authoritative deadline |
| `/api/runs/[id]/commands` | API | Executes sandboxed shell command, logs activity, evaluates objectives |
| `/api/runs/[id]/hints/[id]` | API | Reveals hint, records penalty, recalculates score breakdown |

---

## 4. Responsive & Accessibility Validation

### 4.1 Mobile Viewports (320px — 480px)
- **Play Shell**: Terminal remains fixed as the primary focus; context tabs (Clues, Filesystem, Handbook, Scratchpad) fold into an accessible tab switcher with high-contrast active states.
- **Navigation**: Clean header with compact brand glyph, session avatar, and touch-target compliant buttons (min 44x44px).
- **Forms & Tables**: Table views on `/games/[gameId]/standings` and `/admin/games/[gameId]/live` employ horizontal scroll wrappers with sticky player identification columns to prevent viewport overflow.

### 4.2 Tablet Viewports (768px — 1024px)
- **Admin Console**: Two-row layout adapting telemetry cards cleanly; activity feed and participant tables stack gracefully.
- **Game Builder**: Grid adjusts from single-column to side-by-side date pickers with clear timezone indicators.

### 4.3 Desktop Viewports (1280px — 1440px+)
- **Play Workspace**: Asymmetric 7/5 grid provides commanding 7-column terminal dominance alongside real-time 5-column context panels.
- **Admin Operations**: Three-card metric header (Registered, Active Runs, Completed Runs) paired with tabbed supervision panes (Participants, Live Activity Stream, Live Standings).

### 4.4 Accessibility & Visual Language (MASTER.md Compliance)
- **Zero Emoji Usage**: Strictly replaced all emoji indicators with semantic Lucide React icons (`CheckCircle2`, `Clock`, `ShieldAlert`, `Terminal`, `Puzzle`, `Sparkles` replaced with proper SVGs).
- **Reduced Motion**: All animations (`pulse`, `spin`) respect user motion preferences; static fallbacks ensure readability.
- **Screen Reader Support**: Live timer updates and terminal outputs employ appropriate `aria-live="polite"` regions and descriptive labels to avoid voiceover flooding.
- **Keyboard Navigation**: Full tab order traversal on dialogs, editor array rows, and scratchpad textarea with clear cyan focus rings (`focus:ring-2 focus:ring-cyan-500`).

---

## 5. End-to-End Core Path Verification

The automated verification in `src/lib/games/e2eFlow.test.ts` validates the complete competition lifecycle in a clean database:
1. **Creation**: Admin creates a tournament scheduled with challenge `operation-inversion`.
2. **Publication**: Admin publishes the event; phase transitions to `LIVE`.
3. **Registration**: Contender registers without team prerequisite.
4. **Execution**: Player enters virtual terminal, runs `cat note.txt` (remapped to `ls`), sandbox traps execution safely.
5. **Evaluation**: Intermediate objectives are evaluated against virtual filesystem state.
6. **Scoring**: Full deterministic score breakdown is computed (base score, objective points, speed bonus, completion bonus).
7. **Standings**: Real-time standings update with player rank #1 and viewer highlight.
8. **Live Operations**: Admin pauses and permanently ends the competition; run access guards reject further inputs once ended.
