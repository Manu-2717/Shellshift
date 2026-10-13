# Curated Challenge Catalog and Admin Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a verified 50-challenge catalog, a beginner-safe metadata-only challenge admin experience, an improved game lineup selector, and protected game deletion and archival.

**Architecture:** Challenge mechanics stay in typed source definitions and a typed solution registry; database seeding synchronizes protected mechanics while preserving admin-edited presentation fields. Admin APIs expose narrow metadata and lifecycle operations, while focused client components provide safe editing, selection, confirmation, and plain-language feedback.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Prisma/PostgreSQL, Vitest, Tailwind CSS.

**Spec:** `docs/superpowers/specs/2026-10-13-curated-challenge-catalog-admin-safety-design.md`

## Global Constraints

- The catalog must contain exactly 50 challenges: 20 Easy, 20 Medium, and 10 Hard.
- Preserve the original 20 challenge slugs, orders, mechanics, and historical compatibility.
- Challenge mechanics remain developer-authored; the admin UI never edits raw JSON, mappings, filesystem state, clues, objectives, scoring, or solutions.
- Player-facing text uses short sentences, familiar words, and progressive hints.
- Permanent game deletion is limited to unused drafts; historical games are archived.
- Preserve existing unrelated working-tree changes, including local OIDC-derived admin work.
- Do not push changes or expose secrets.

## Review Focus

- A seed rerun after an admin edits presentation fields must preserve those edits while updating protected mechanics; Task 4 adds the regression test.
- A hidden challenge already attached to a game must remain visible in that existing lineup but unavailable for a new lineup; Task 7 adds the test.
- Duplicate challenge IDs, slugs, orders, or solution-registry entries must fail with the offending slug named; Tasks 1 and 3 add tests.
- Concurrent registration or run creation must prevent a stale deletion request from deleting a now-used draft; Task 8 tests transactional rechecking.
- An administrator submitting protected challenge fields alongside valid metadata must receive a clear rejection with no partial update; Task 5 adds the test.

---

### Task 1: Typed Catalog and Solution Contracts

**Files:**
- Create: `src/lib/challenges/catalogTypes.ts`
- Create: `src/lib/challenges/solutions.ts`
- Modify: `src/lib/challenges/seedData.ts`
- Modify: `src/lib/challenges/challenges.test.ts`

**Interfaces:**
- Produces: `SeedChallengeDef`, `ChallengeSolution`, `CHALLENGE_SOLUTIONS: Record<string, ChallengeSolution>`, and `validateCatalogIntegrity(challenges, solutions)`.
- Consumes: existing VFS execution, objective evaluation, cipher decoding, and scoring functions.

- [ ] **Step 1: Write failing catalog-contract tests**

Add tests asserting the current catalog has a solution entry for every slug, rejects duplicate slugs/orders, rejects a missing solution, and reports the offending slug.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: FAIL because the typed solution registry and integrity validator do not exist.

- [ ] **Step 3: Extract shared types and solution registry**

Move `SeedChallengeDef` to `catalogTypes.ts`. Move the existing positive and negative walkthrough data from the test into `solutions.ts` as `ChallengeSolution { negativeCmd: string; steps: string[] }`. Export `validateCatalogIntegrity` with deterministic error messages.

- [ ] **Step 4: Update tests to execute the registry and verify GREEN**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: the original 20 challenges pass contract, solution, decoding, VFS, and scoring tests.

- [ ] **Step 5: Commit locally**

```bash
git add src/lib/challenges/catalogTypes.ts src/lib/challenges/solutions.ts src/lib/challenges/seedData.ts src/lib/challenges/challenges.test.ts
git commit -m "refactor(challenges): add typed catalog verification"
```

### Task 2: Audit the Original Twenty Challenges

**Files:**
- Modify: `src/lib/challenges/seedData.ts`
- Modify: `src/lib/challenges/solutions.ts`
- Modify: `src/lib/challenges/challenges.test.ts`

**Interfaces:**
- Consumes: `SeedChallengeDef`, `ChallengeSolution`, and catalog validation from Task 1.
- Produces: beginner-friendly content for original orders 1–20 without changing their slugs, orders, mappings, initial filesystems, objectives, or solutions.

- [ ] **Step 1: Write failing beginner-content tests**

Add tests for non-empty concise titles/descriptions, bounded time limits, at least two progressive hints, non-empty objective descriptions, and absence of unexplained internal terminology in player-facing copy.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: FAIL naming original challenges whose copy or hint progression violates the standard.

- [ ] **Step 3: Rewrite only player-facing content**

Update titles, descriptions, clue phrasing, file copy, objective descriptions, and hints as needed. Preserve mechanics and verify every existing walkthrough remains unchanged.

- [ ] **Step 4: Run focused tests and verify GREEN**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

- [ ] **Step 5: Commit locally**

```bash
git add src/lib/challenges/seedData.ts src/lib/challenges/solutions.ts src/lib/challenges/challenges.test.ts
git commit -m "refactor(challenges): clarify beginner challenge content"
```

### Task 3: Expand the Catalog to Fifty Challenges

**Files:**
- Create: `src/lib/challenges/additionalSeedData.ts`
- Modify: `src/lib/challenges/seedData.ts`
- Modify: `src/lib/challenges/solutions.ts`
- Modify: `src/lib/challenges/challenges.test.ts`

**Interfaces:**
- Consumes: catalog contracts from Task 1 and beginner-content rules from Task 2.
- Produces: `ADDITIONAL_CHALLENGES` for orders 21–50 and combined `SEED_CHALLENGES` with distribution 20 Easy, 20 Medium, 10 Hard.

- [ ] **Step 1: Change count/distribution tests to the approved values**

Assert exactly 50 challenges, 20 Easy, 20 Medium, 10 Hard, continuous orders 1–50, unique slugs, and a solution for every challenge.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: FAIL with 20 actual challenges and the old distribution.

- [ ] **Step 3: Add twelve Easy challenges (orders 21–32)**

Use one- or two-action mechanics, shallow paths, direct clues, two progressive hints, and typed positive/negative walkthroughs.

- [ ] **Step 4: Run focused tests for orders 21–32**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: count remains RED, but every newly added Easy challenge passes its individual validation and walkthrough assertions.

- [ ] **Step 5: Add eleven Medium challenges (orders 33–43)**

Use two to four dependent actions, nested paths, combined mappings, log inspection, or two-step cipher reasoning. Add typed walkthroughs.

- [ ] **Step 6: Run focused tests for orders 33–43**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: count remains RED, with all Easy and Medium additions individually green.

- [ ] **Step 7: Add seven Hard challenges (orders 44–50)**

Use layered clues, decoys, multiple objectives, cleanup requirements, or longer stateful command sequences. Add typed walkthroughs.

- [ ] **Step 8: Run the complete catalog verification and verify GREEN**

Run: `npm test -- src/lib/challenges/challenges.test.ts`

Expected: 50 total, exact distribution, all validation/decoding/walkthrough/scoring checks pass.

- [ ] **Step 9: Commit locally**

```bash
git add src/lib/challenges/additionalSeedData.ts src/lib/challenges/seedData.ts src/lib/challenges/solutions.ts src/lib/challenges/challenges.test.ts
git commit -m "feat(challenges): expand verified catalog to fifty"
```

### Task 4: Preserve Admin Presentation Edits During Seeding

**Files:**
- Modify: `prisma/seed.ts`
- Modify: `src/lib/games/migration.test.ts`

**Interfaces:**
- Consumes: combined `SEED_CHALLENGES` from Task 3.
- Produces: seed upserts that create all fields for missing challenges, but update only protected mechanics for existing challenges.

- [ ] **Step 1: Write a failing reseed regression test**

Create a challenge row, simulate admin-edited title/description/difficulty/time/visibility/hints, reseed it, and assert presentation values remain while protected mappings/objectives/filesystem/scoring update.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- src/lib/games/migration.test.ts`

- [ ] **Step 3: Split seed create and update payloads**

Create missing rows with the full definition. For existing rows, synchronize `commandMappings`, `clues`, `initialFilesystem`, `objectiveConfig`, and `scoringConfig`; do not overwrite admin-editable fields or existing hint edits.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- src/lib/games/migration.test.ts`

- [ ] **Step 5: Commit locally**

```bash
git add prisma/seed.ts src/lib/games/migration.test.ts
git commit -m "fix(seed): preserve challenge presentation edits"
```

### Task 5: Safe Challenge Metadata Service and API

**Files:**
- Create: `src/lib/challenges/adminMetadata.ts`
- Create: `src/lib/challenges/adminMetadata.test.ts`
- Modify: `src/app/api/admin/challenges/[challengeId]/route.ts`

**Interfaces:**
- Produces: `ChallengeMetadataInput`, `validateChallengeMetadata(input)`, `updateChallengeMetadata(challengeId, input, actorId)`, and a read model for protected technical details.
- Consumes: Prisma, verified admin session, and catalog solution registry.

- [ ] **Step 1: Write failing metadata validation and authorization tests**

Cover valid title/description/difficulty/time/visibility/hints; invalid values; protected fields in the payload; non-admin access; missing challenge; no partial update; and audit-log creation.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/lib/challenges/adminMetadata.test.ts`

- [ ] **Step 3: Implement the metadata service**

Allow only `title`, `description`, `difficulty`, `timeLimitSeconds`, `isPublished`, and ordered hint inputs. Reject known protected keys with a plain-language error. Apply challenge and hint changes transactionally and write `CHALLENGE_METADATA_UPDATED`.

- [ ] **Step 4: Narrow the route handlers**

Return parsed safe metadata plus a read-only technical summary on GET. Accept only `ChallengeMetadataInput` on PATCH with `400`, `403`, and `404` responses defined by the spec.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/lib/challenges/adminMetadata.test.ts`

- [ ] **Step 6: Commit locally**

```bash
git add src/lib/challenges/adminMetadata.ts src/lib/challenges/adminMetadata.test.ts 'src/app/api/admin/challenges/[challengeId]/route.ts'
git commit -m "feat(admin): restrict challenge editing to safe metadata"
```

### Task 6: Beginner-Safe Challenge Admin UI

**Files:**
- Create: `src/components/admin/ChallengeDetailsEditor.tsx`
- Create: `src/components/admin/ChallengeTechnicalSummary.tsx`
- Modify: `src/components/admin/challengeEditor.test.ts`
- Modify: `src/app/admin/challenges/[challengeId]/page.tsx`
- Modify: `src/app/admin/challenges/page.tsx`
- Modify: `src/app/admin/challenges/new/page.tsx`
- Remove: `src/components/admin/ChallengeEditor.tsx`

**Interfaces:**
- Consumes: metadata and technical-summary read model from Task 5.
- Produces: safe player-details form, hint rows, read-only mechanics summary, searchable/filterable catalog list, and removed creation flow.

- [ ] **Step 1: Write failing component behavior tests**

Test editable fields, hint add/remove/reorder, absence of raw JSON inputs, read-only mechanics rendering, search/filter behavior, and redirect messaging for `/admin/challenges/new`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/admin/challengeEditor.test.ts src/components/admin/adminUi.test.ts`

- [ ] **Step 3: Build the safe details editor**

Use existing `Field`, `Button`, `Notice`, and accessible labels. Preserve form input after server errors and show field-level plain-language messages.

- [ ] **Step 4: Build the technical summary and catalog controls**

Render command behavior, starter paths, clue types, objectives, scoring, and reference steps as read-only summaries. Add client-side search and difficulty/visibility filters to the library.

- [ ] **Step 5: Remove challenge creation UI**

Remove “New challenge” links and redirect `/admin/challenges/new` to the library with a developer-managed explanation.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/components/admin/challengeEditor.test.ts src/components/admin/adminUi.test.ts`

- [ ] **Step 7: Commit locally**

```bash
git add src/components/admin src/app/admin/challenges
git commit -m "feat(admin): add safe challenge details editor"
```

### Task 7: Searchable and Ordered Game Challenge Selection

**Files:**
- Create: `src/components/admin/ChallengeLineupSelector.tsx`
- Create: `src/components/admin/challengeLineupSelector.test.ts`
- Modify: `src/components/admin/GameBuilder.tsx`
- Modify: `src/app/admin/games/new/page.tsx`
- Modify: `src/lib/games/service.ts`
- Modify: `src/lib/games/service.test.ts`

**Interfaces:**
- Produces: `ChallengeLineupSelector` accepting published catalog items and selected ordered IDs.
- Consumes: challenge metadata and `GameAdminInput.challengeIds`.

- [ ] **Step 1: Write failing selector and service tests**

Cover grouping, search, filters, selected count, add/remove, ordering, hidden challenges excluded from new games, existing hidden lineup retained during edit, duplicate IDs rejected, and submitted order preserved.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/admin/challengeLineupSelector.test.ts src/lib/games/service.test.ts`

- [ ] **Step 3: Implement the selector component**

Use buttons and accessible list controls for move up/down; show title, difficulty, estimated minutes, selected state, and summary count.

- [ ] **Step 4: Harden service normalization**

Reject duplicate IDs, validate that new selections are published, and preserve the submitted order in `EventChallenge.order`.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/components/admin/challengeLineupSelector.test.ts src/lib/games/service.test.ts`

- [ ] **Step 6: Commit locally**

```bash
git add src/components/admin/ChallengeLineupSelector.tsx src/components/admin/challengeLineupSelector.test.ts src/components/admin/GameBuilder.tsx src/app/admin/games/new/page.tsx src/lib/games/service.ts src/lib/games/service.test.ts
git commit -m "feat(games): improve challenge lineup selection"
```

### Task 8: Protected Game Deletion and Archival Service

**Files:**
- Modify: `src/lib/games/service.ts`
- Modify: `src/lib/games/service.test.ts`
- Modify: `src/app/api/admin/games/[gameId]/route.ts`
- Modify: `src/app/api/admin/games/[gameId]/status/route.ts`

**Interfaces:**
- Produces: `deleteUnusedDraft(gameId, confirmation, actorId)` and `archiveGame(gameId, actorId)`.
- Consumes: Prisma transaction client, session admin role, and existing game status types.

- [ ] **Step 1: Write failing lifecycle tests**

Cover eligible draft deletion, wrong confirmation, non-draft rejection, registration/run rejection, concurrent state recheck, archival, retained historical relations, audit actions, missing game, and non-admin route access.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/lib/games/service.test.ts`

- [ ] **Step 3: Implement transactional deletion**

Inside one transaction, reload game status and registration/run counts, compare exact confirmation, record `GAME_DELETED` details, then delete the eligible event.

- [ ] **Step 4: Implement archival**

Transition eligible non-archived games to `ARCHIVED`, preserve related data, and record `GAME_ARCHIVED`.

- [ ] **Step 5: Add DELETE and archive route behavior**

Map validation outcomes to `400`, `404`, and `409`; retain `403` for non-admin sessions.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `npm test -- src/lib/games/service.test.ts`

- [ ] **Step 7: Commit locally**

```bash
git add src/lib/games/service.ts src/lib/games/service.test.ts 'src/app/api/admin/games/[gameId]/route.ts' 'src/app/api/admin/games/[gameId]/status/route.ts'
git commit -m "feat(games): add safe deletion and archival"
```

### Task 9: Game Lifecycle Controls UI

**Files:**
- Create: `src/components/admin/GameDangerZone.tsx`
- Create: `src/components/admin/gameDangerZone.test.ts`
- Modify: `src/app/admin/games/[gameId]/page.tsx`

**Interfaces:**
- Consumes: deletion and archival endpoints from Task 8 plus game status/counts/name.
- Produces: exact-name deletion dialog, archive confirmation, eligibility explanation, pending states, and success navigation.

- [ ] **Step 1: Write failing UI behavior tests**

Cover eligible delete rendering, disabled confirmation until exact match, archive-only historical state, API error retention, double-submit prevention, and successful navigation.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- src/components/admin/gameDangerZone.test.ts`

- [ ] **Step 3: Implement `GameDangerZone`**

Use the existing dialog and notice components. Never expose permanent deletion for an ineligible game; explain that history is preserved through archival.

- [ ] **Step 4: Add the control to the game page**

Pass status, name, registration count, and run count from the server component. Refresh or navigate to `/admin/games` after success.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- src/components/admin/gameDangerZone.test.ts`

- [ ] **Step 6: Commit locally**

```bash
git add src/components/admin/GameDangerZone.tsx src/components/admin/gameDangerZone.test.ts 'src/app/admin/games/[gameId]/page.tsx'
git commit -m "feat(admin): add game archive and delete controls"
```

### Task 10: Full Verification and Local Admin QA

**Files:**
- Modify only if verification reveals a scoped defect.

**Interfaces:**
- Consumes: all prior tasks.
- Produces: a verified local implementation with no push.

- [ ] **Step 1: Run formatting, types, lint, and full tests**

Run:

```bash
npx prettier --check .
npx tsc --noEmit
npm run lint
npm test
```

Expected: zero formatting/type/lint errors and all tests pass. Report existing warnings separately.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: exit code 0 with all admin routes compiled.

- [ ] **Step 3: Perform local browser QA**

Use mock admin login and verify challenge search/filter/details editing, absence of mechanics editing, 50-item selection and ordering, eligible draft deletion, historical archival, and non-admin denial.

- [ ] **Step 4: Review the final diff**

Confirm no secrets, unrelated edits, accidental generated files, or push operations. Confirm the earlier OIDC admin changes remain present and tested.

- [ ] **Step 5: Commit scoped verification fixes locally if needed**

Use a precise commit message describing only fixes found during verification. Do not push.
