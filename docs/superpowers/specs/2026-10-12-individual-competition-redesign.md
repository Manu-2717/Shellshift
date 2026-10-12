# ShellShift Individual Competition and UX Redesign

**Date:** 2026-10-12  
**Status:** Approved design  
**Scope:** Player experience, admin hosting console, event scheduling, individual participation, scoring, and leaderboards

## Product intent

ShellShift should feel like a polished competitive cyber-operations game rather than a collection of administrative forms and terminal-themed cards. An administrator must be able to create and host scheduled games. A player must be able to discover a game, register individually, wait for it to open, compete, and see an individual result without navigating team-oriented concepts.

The redesign preserves the virtual filesystem, command remapping, cipher, objective-validation, hint, timer, and scoring engines. It changes how competitions are modeled and presented around those systems.

## Success criteria

- Administrators can create, edit, publish, schedule, monitor, pause, resume, and end multiple games.
- Each game has its own challenge lineup, registration window, competition window, participants, runs, and individual standings.
- A user's participation and score belong to that user and game, never to a team.
- Player navigation always presents the correct action for the current game state.
- The game workspace keeps the terminal as the primary interaction surface while making objectives, clues, files, time, and progress easier to scan.
- All redesigned flows work on mobile and desktop, support keyboard navigation, expose visible focus, honor reduced-motion preferences, and maintain readable contrast.
- Existing challenge and terminal mechanics remain behaviorally compatible.

## Recommended product structure

### Public and player-facing routes

- `/` — concise product introduction, active/upcoming competition preview, and one context-aware primary action.
- `/games` — discover live, upcoming, and completed public games.
- `/games/[gameId]` — game details and the state-aware registration, waiting, enter, or results action.
- `/games/[gameId]/lobby` — registered-player waiting room before launch and challenge catalog while live.
- `/play/[runId]` — focused challenge workspace.
- `/games/[gameId]/standings` — individual live or final rankings, depending on visibility settings.
- `/profile` — personal registrations, attempts, results, and best performances.
- `/leaderboard` redirects to the currently relevant standings page or provides a game selector during migration.

Authentication remains OIDC-based. Team registration is removed from the main flow. Existing `/register` team behavior will be retired or redirected after migration.

### Admin routes

- `/admin` — operations overview with live games, upcoming schedules, alerts, participation, and recent activity.
- `/admin/games` — searchable list of drafts, scheduled, live, and completed games.
- `/admin/games/new` — guided game creation.
- `/admin/games/[gameId]` — game overview and edit surface.
- `/admin/games/[gameId]/live` — live operations console.
- `/admin/challenges` — challenge library.
- `/admin/challenges/new` and `/admin/challenges/[challengeId]` — guided challenge authoring and editing.

## Competition lifecycle

Games use explicit timestamps and a derived display state:

1. **Draft** — private and editable.
2. **Published** — visible, but registration has not opened.
3. **Registration open** — eligible users can register.
4. **Scheduled** — registration is closed and the start is pending.
5. **Live** — the competition window is open.
6. **Paused** — administrators temporarily prevent new commands and new run starts. Authoritative timing excludes paused intervals when the scoring policy enables that behavior.
7. **Ended** — the end time passed or an administrator ended the game.
8. **Archived** — read-only historical record.

Database status is authoritative for manual states such as draft, paused, ended, and archived. Time-derived states are calculated consistently in a shared server utility. API authorization and eligibility checks never trust a client-displayed state.

The game builder captures:

- Name, slug, description, cover treatment, and visibility.
- Registration opening and closing timestamps.
- Competition start and end timestamps with the configured event timezone displayed explicitly.
- Scoring mode and settings.
- Leaderboard visibility during and after play.
- Ordered challenge selection.
- Per-game challenge overrides where necessary, such as availability window, points, or time limit.
- Review summary before publishing.

Publishing validates timestamp ordering, at least one selected challenge, unique slug, compatible scoring settings, and challenge readiness. Published schedules remain editable until the game starts, with warnings for changes that affect registered players.

## Data model

The existing `Event` concept becomes the hosted `Game` domain. The database table may be renamed in a migration or retained as `Event` internally if a low-risk staged migration is preferable; product code should use consistent game-oriented naming.

### Game

- `id`, `slug`, `name`, `description`
- `status`: `DRAFT | PUBLISHED | PAUSED | ENDED | ARCHIVED`
- `visibility`: `PUBLIC | UNLISTED`
- `registrationOpensAt`, `registrationClosesAt`
- `startsAt`, `endsAt`
- `timezone`
- `scoringMode`
- `scoringConfig`
- `leaderboardVisibility`: `LIVE | AFTER_END | HIDDEN`
- `createdById`, `createdAt`, `updatedAt`

### GameChallenge

Join model between a game and a reusable challenge:

- `gameId`, `challengeId`
- `order`
- Optional scoring and time-limit overrides
- Optional `unlocksAt` for staggered releases

A unique constraint prevents the same challenge appearing twice in one game.

### GameRegistration

Individual entry record:

- `gameId`, `userId`
- `status`: `REGISTERED | WITHDRAWN | DISQUALIFIED`
- `registeredAt`, `updatedAt`

The `(gameId, userId)` pair is unique.

### Run

Runs become user-owned and game-scoped:

- Add required `gameId` and `userId` relationships.
- Remove `teamId` from new runtime behavior.
- Enforce one active run per user and game challenge.
- Preserve challenge snapshot data needed for fair historical scoring.
- Continue storing authoritative start, deadline, completion, scoring, command, hint, and objective data.

### Migration strategy

The implementation uses additive migrations first:

1. Add game-challenge, registration, and user-owned run relationships.
2. Backfill legacy runs to their original users where command/audit history provides an unambiguous owner; otherwise mark them legacy and exclude them from new individual standings.
3. Switch APIs and UI to individual ownership.
4. Retain team tables temporarily for historical compatibility, then remove them in a separately reviewed cleanup migration.

No existing user, challenge, run, or score record is destructively deleted as part of the redesign.

## Player experience

### Discovery and registration

The games index prioritizes one live or next upcoming game, followed by compact rows for other scheduled and completed games. Each row communicates state, schedule, duration, challenge count, and the user's participation state. Filtering is secondary and appears only when enough games exist to justify it.

The game detail screen provides one context-aware action:

- Sign in
- Registration opens soon
- Register now
- Registered
- Enter waiting room
- Start competing
- Continue challenge
- View results

Registration is one confirmation step for authenticated users. Success feedback includes the scheduled start in the user's local time and a route to the waiting room. Errors remain next to the action and never discard page context.

### Waiting room and lobby

Before start, the lobby shows a trustworthy server-synchronized countdown, schedule, rules, challenge count, and registration status. It does not expose private challenge content early.

When live, it becomes a mission list with clear states: locked, available, in progress, completed, or expired. The next recommended mission is visually dominant. Score, rank, completed count, and remaining event time are visible without overwhelming the challenge choices.

### Play workspace

Desktop uses a stable command-center layout:

- Compact top bar: game, challenge, authoritative timer, score, and exit/back action.
- Mission rail: objective and progressive validation status.
- Primary terminal: the largest and most visually dominant region.
- Context panel: tabs for clues/decoder and filesystem.
- Lightweight status feedback for command execution, connection problems, and completion.

Mobile uses a terminal-first single-column layout. Objective, clues, and filesystem become accessible sheets or tabs with persistent labels and 44px targets. The command input remains visible when the software keyboard opens. Essential status is never hover-only.

Completion presents a clear summary with score breakdown, duration, penalties, personal rank, and a next action. It does not trap the player inside a disabled terminal.

### Individual standings and profile

Standings rank users by the configured game scoring mode. Rows show rank, player identity, score, completed challenges, and an appropriate tie-break value. The signed-in player's row remains easy to locate. Live updates use polite announcements and restrained animation rather than constantly reshuffling without context.

The profile gives the player a durable history across games, including registrations, completed challenges, results, and personal bests.

## Admin experience

### Operations overview

The admin landing page answers four questions immediately:

- What is live now?
- What starts next?
- Is anything requiring attention?
- How many players are registered or active?

It uses concise operational summaries and lists rather than decorative statistics. High-risk actions are absent from the overview and live inside the relevant game.

### Game creation

Game creation is a four-step guided workflow:

1. Basics — identity, description, and visibility.
2. Schedule — registration and competition windows with timezone clarity.
3. Challenges and scoring — searchable challenge selection, ordering, and overrides.
4. Review and publish — validation results and a complete summary.

Drafts save between steps. Validation is inline and specific. JSON is not required for ordinary game hosting.

### Live operations

The live console includes:

- Server time and game state.
- Registered, active, completed, and disconnected participant counts.
- Individual standings.
- Recent command/run activity with filters.
- Operational warnings.
- Pause/resume and end controls.

Pause and end actions require a confirmation explaining player impact. Ending is irreversible through the normal UI. Admin actions create audit-log entries.

### Challenge authoring

The challenge library remains separate from games so challenges can be reused. The current raw JSON form is replaced by structured sections for metadata, command mappings, clues, filesystem seed, objectives, hints, timing, and scoring. An advanced JSON view may remain as an expert affordance, but it is not the default.

Validation runs before publishing and returns errors at the relevant field or section. A preview simulates the player-facing challenge without exposing confidential answers outside admin authorization.

## Visual design system

### Direction

The visual language is a restrained cyber-operations interface: deep neutral graphite, crisp typography, cyan as the primary interactive signal, and violet as a limited secondary accent. Green, amber, and red are reserved for semantic success, warning, and danger states.

The interface should feel immersive without imitating a terminal everywhere. Monospace is reserved for commands, paths, timers, codes, and operational data. Navigation, headings, forms, and body copy use a highly legible sans-serif.

### Tokens

- True near-black page background with slightly lighter structural surfaces.
- Subtle one-pixel borders; elevation comes mainly from contrast and controlled shadow.
- Radius family of 8px, 12px, and 16px, with no indiscriminate pill styling.
- An 8px spacing foundation with consistent responsive gutters.
- Minimum 16px body text where reading is required; compact operational labels may be smaller only with sufficient contrast and line height.
- Primary controls have a minimum 44px interactive height.
- Visible `:focus-visible` treatment on every interactive element.

### Motion

Motion explains state changes:

- 120–180ms for local hover and press feedback.
- 180–260ms for panels, tabs, and status transitions.
- Gentle countdown and live-state emphasis without continuous distracting pulses.
- Transform and opacity are preferred over layout-triggering animation.
- `prefers-reduced-motion` removes non-essential movement and smooth scrolling.

### Component families

- App shell and responsive navigation.
- Status badge with text and icon, never color alone.
- Primary, secondary, quiet, and danger buttons.
- Field, select, date-time control, helper, inline error, and error summary.
- Tabs, segmented controls, tables, empty states, notices, confirmation dialogs, and sheets.
- Game row/card, challenge row, participant row, ranking row, and activity row.
- Timer, progress indicator, score breakdown, terminal chrome, filesystem tree, clue panel, and objective checklist.

Repeated components use tokens and explicit variants instead of copied utility combinations.

## Responsive behavior

- Mobile-first layouts must not horizontally scroll at 320px width.
- Admin tables collapse into labeled rows or controlled scroll regions only when the data genuinely requires tabular comparison.
- Desktop admin navigation uses a sidebar; compact widths use a drawer.
- Game creation remains step-based on all screen sizes.
- The play workspace preserves the terminal as the first interaction target at every breakpoint.
- Safe-area padding is applied to fixed mobile controls.

## Accessibility and feedback

- WCAG AA contrast is required for text, focus, controls, and semantic states.
- Every icon-only control has an accessible name and tooltip where useful.
- Dialogs trap focus, restore focus when closed, and close predictably.
- Forms use persistent labels, field-level errors, an accessible error summary, and focus the first invalid field after submission.
- Loading operations preserve layout and communicate progress.
- Toasts supplement rather than replace inline outcomes.
- Live timers and standings avoid noisy per-second screen-reader announcements.
- Terminal output is navigable, copyable, and announced selectively without flooding assistive technology.

## Server and API behavior

- All game, registration, run, and standings APIs enforce individual user ownership and game membership server-side.
- Run creation verifies registration, game state, challenge membership, unlock state, and absence of an existing conflicting run in one transaction.
- Command execution verifies that the game is live and not paused or ended.
- Administrative writes validate timestamps and transitions and emit audit records.
- Standings queries are scoped by game and exclude disqualified, unranked, or unmigrated legacy entries.
- Server timestamps remain authoritative. Client countdowns are display projections corrected during polling or revalidation.

## Error and edge states

- Registration window closed while the page is open.
- Game paused or ended during active play.
- Schedule changed after registration.
- Network interruption during command execution.
- Duplicate run start caused by multiple tabs.
- Empty challenge lineup or unpublished challenge at publish time.
- No registered players, no active runs, and no completed standings.
- Player disqualification and hidden leaderboard policies.
- Legacy team-owned result encountered during migration.

Each state receives explicit copy and a safe recovery action. Generic alerts and silent failures are replaced by inline feedback or accessible dialogs.

## Testing and acceptance

### Domain and API tests

- Game lifecycle derivation and permitted status transitions.
- Timestamp and timezone validation.
- Game challenge ordering and uniqueness.
- Individual registration uniqueness and eligibility.
- User-owned run authorization and cross-user isolation.
- Pause, resume, end, and deadline enforcement.
- Individual scoring, tie-breaking, and leaderboard visibility.
- Migration handling for legacy team-owned runs.

### UI tests

- Context-aware game actions for every lifecycle state.
- Complete admin create, save draft, validate, publish, pause, resume, and end flows.
- Player register, wait, enter, play, complete, and results flow.
- Keyboard traversal, focus restoration, error focus, dialogs, tabs, and mobile sheets.
- 320px mobile, common tablet, 1440px desktop, and reduced-motion behavior.

### Visual verification

Before implementation, complete screen concepts are required for:

- Public games discovery/detail.
- Player live lobby.
- Desktop and mobile play workspace.
- Admin overview.
- Game creation workflow.
- Live operations console.
- Individual standings/results.

The implemented screens must be compared at native viewport size to their accepted concepts. Copy, hierarchy, color, typography, spacing, icon treatment, responsive behavior, interaction states, and the complete core workflow must match before handoff.

## Out of scope

- Real host-shell execution.
- Chat, team collaboration, or team rankings.
- Payments or ticketing.
- Public challenge authoring by non-admin users.
- Native mobile applications.
- Removing legacy team tables in the same migration that introduces individual competitions.

