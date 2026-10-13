# Curated Challenge Catalog and Admin Safety Design

## Objective

Make ShellShift challenge management safe and beginner-friendly by keeping challenge mechanics developer-authored, limiting admin editing to presentation details, expanding the verified catalog from 20 to 50 challenges, and adding safe game deletion and archival.

The result must let an event organizer assemble and operate a competition without editing JSON, virtual filesystems, command mappings, objective rules, or scoring internals.

## Scope

This work includes:

- expanding the curated challenge catalog from 20 to 50 challenges;
- auditing all challenges for clear beginner-facing language and deterministic solvability;
- replacing the full challenge editor with a safe details editor;
- removing challenge creation from the admin UI;
- improving challenge selection in the game builder;
- adding permanent deletion for unused draft games;
- adding archival for games that must retain history;
- preserving the local OIDC-derived administrator work already present in the working tree.

This work does not include:

- a UI for authoring challenge mechanics;
- arbitrary JSON editing in the admin console;
- deleting challenges from the curated catalog;
- deleting registrations, runs, scores, command history, or audit history;
- pushing or publishing changes automatically.

## Challenge Ownership Model

Challenge mechanics remain developer-authored in `src/lib/challenges/seedData.ts`. Each definition owns its stable slug, order, command mappings, clues, initial filesystem, objectives, scoring, and initial hints. A colocated typed solution registry owns the positive walkthrough and negative path used for verification and the admin technical summary.

Database challenge rows remain the runtime representation. Seeding creates missing catalog rows and synchronizes protected mechanics while preserving presentation fields previously edited by an administrator. Existing identifiers and the original 20 challenge mechanics remain stable so saved games and run history continue to resolve correctly.

The admin console manages only safe presentation fields:

- title;
- beginner-facing description;
- difficulty;
- time limit;
- published or hidden state;
- hint title, content, order, and penalty.

The following fields are always read-only in the admin console:

- slug and catalog order;
- command mappings;
- encoded clues and plaintext solutions;
- initial filesystem;
- objective rules;
- scoring configuration;
- solution walkthrough.

The challenge update endpoint will use an explicit allowlist of editable fields. Extra mechanics fields in a request are ignored or rejected rather than written.

## Admin Challenge Experience

The challenge library remains the entry point. It supports search and difficulty or visibility filters. Each row shows title, short description, difficulty, time limit, publication state, and usage count.

The “New challenge” action and `/admin/challenges/new` authoring flow are removed. Direct navigation to that route redirects to the challenge library with a short explanation that challenge mechanics are developer-managed.

The challenge details page contains two sections:

1. **Player details** — a form for the safe editable fields.
2. **How this challenge works** — a read-only, human-readable summary of commands, starting files, clues, objectives, scoring, and the reference solution.

No raw JSON editor appears in the normal admin experience.

## Fifty-Challenge Catalog

The catalog contains exactly 50 challenges:

- 20 Easy;
- 20 Medium;
- 10 Hard.

The existing 20 challenges retain stable slugs, order, and mechanics. Their titles, descriptions, hints, and other player-facing copy may be rewritten for clarity.

Thirty new challenges extend the existing engine without adding filler. They should cover:

- file and directory navigation;
- creation, reading, copying, moving, and deletion;
- nested directories and path reasoning;
- command-behavior swaps;
- log and content inspection;
- Base64, ROT13, hexadecimal, binary, Morse, and URL decoding;
- decoys and multi-clue reasoning;
- multi-objective cleanup and verification;
- progressively longer command sequences.

Each challenge must have a distinct learning goal or a meaningful combination of earlier skills. Games select a subset of this catalog; the catalog is not a single 50-challenge event.

## Beginner-Friendly Content Standard

Player-facing content uses short sentences and familiar words. Every challenge explains:

- the desired outcome;
- where the player starts;
- which unusual command behavior matters;
- what evidence confirms completion.

Hints progress from a conceptual nudge to a near-explicit command sequence. The first hint should not reveal the answer. File contents and decoded clues must reinforce the same task rather than introduce conflicting terminology.

Difficulty expectations are:

- **Easy:** one or two core actions, shallow paths, and direct clues;
- **Medium:** two to four dependent actions or two combined mechanics;
- **Hard:** layered clues, decoys, multiple objectives, or longer stateful command sequences.

## Game Builder Improvements

The challenge-selection step groups the catalog by difficulty and provides:

- text search;
- difficulty filters;
- selected-count summary;
- clear selected state;
- ordering controls for the chosen lineup;
- title, difficulty, and estimated time for each challenge.

Saving a game stores only selected published challenge IDs and their chosen order. Hidden challenges are unavailable for new lineups but remain attached to existing games.

## Safe Game Deletion and Archival

Permanent deletion is allowed only when all of the following are true:

- the game is a draft;
- it has zero registrations;
- it has zero runs.

The administrator must type the exact game name in a confirmation dialog. The server rechecks eligibility inside the deletion transaction. Deletion removes the event and its lineup links and records a `GAME_DELETED` audit entry containing non-sensitive identifying details.

Games that are published, paused, ended, archived, registered for, or played cannot be deleted. They expose an **Archive game** action instead. Archival preserves registrations, runs, scores, command logs, and historical relationships and records `GAME_ARCHIVED` in the audit log.

Authorization is enforced server-side for both actions. Client-side hiding or confirmation is not treated as an authorization boundary.

## Validation

Every challenge must satisfy all existing validator rules plus catalog-level checks:

- exactly 50 definitions;
- unique slugs and orders;
- 20 Easy, 20 Medium, and 10 Hard;
- non-empty beginner-facing title and description;
- valid time limit and scoring configuration;
- absolute, confined virtual filesystem paths;
- valid command mappings;
- clues that decode to their declared plaintext;
- objectives that reference coherent paths and commands;
- a positive walkthrough that completes the challenge;
- a negative path that does not complete it;
- at least one useful hint progression.

Validation errors name the challenge order and slug so a developer can locate the faulty definition quickly.

## Error Handling

Admin forms use plain-language errors next to the affected action. Failed updates do not discard unsaved form input.

The challenge metadata endpoint returns:

- `400` for invalid editable values or attempts to modify protected mechanics;
- `403` for non-admin users;
- `404` for missing challenges.

The game deletion endpoint returns:

- `400` when confirmation does not match;
- `403` for non-admin users;
- `404` for a missing game;
- `409` when the game has registrations, runs, or a non-draft lifecycle state.

Database writes that affect multiple records use transactions. Unexpected failures return a generic message and retain server-side diagnostic detail.

## Testing Strategy

Implementation follows test-driven development.

Challenge catalog tests cover:

- count and difficulty distribution;
- stable original slugs and orders;
- uniqueness and validation;
- clue decoding;
- positive and negative walkthroughs;
- scoring completion;
- beginner-content requirements.

Admin challenge tests cover:

- safe metadata updates;
- protected mechanics rejection;
- hint editing;
- hidden challenge behavior;
- removed creation flow;
- read-only technical summaries.

Game lifecycle tests cover:

- eligible unused draft deletion;
- exact-name confirmation;
- rejection for registrations, runs, or non-draft status;
- archival with history retained;
- administrator authorization;
- audit-log creation.

The final verification includes TypeScript, lint, the complete test suite, a production build, and local browser checks for the admin challenge and game flows.

## Delivery Constraints

Implementation remains local unless the user separately requests a commit or push. Existing unrelated working-tree changes are preserved. No secret is added to source control, logs, tests, or documentation.
