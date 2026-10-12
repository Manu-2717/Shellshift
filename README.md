# ShellShift — Linux Command Cipher Race

> **ShellShift** is a competitive, browser-based Linux command-line puzzle game where contenders decode hidden instructions, discover that familiar Linux commands have unusual meanings, and race through scheduled individual tournaments under authoritative server-side timing.

---

## ⚡ Core Concepts

1. **Simulated Shell Interpreter (Zero Host Execution)**:
   - Player inputs (`pwd`, `ls`, `cd`, `cat`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `find`, `grep`, `head`, `tail`, `echo`, `tree`, `clear`, `help`) run exclusively in an isolated, in-memory virtual filesystem.
   - Host `exec`, `eval`, `child_process`, and OS shells are never invoked.
   - The sandbox strictly clamps paths to the virtual root `/` and rejects shell chaining (`;`, `&&`, `||`), pipes (`|`), redirection (`>`, `<`), and command substitution (`$()`, `` ` ``).

2. **Custom Command Remapping Matrix**:
   - Each challenge defines its own configurable mapping table (e.g. `cd` maps to `mkdir`, `mkdir` maps to `rm`, `cat` maps to `ls`, `ls` maps to `cat`).
   - The engine logs both what the player entered (`enteredCommand`) and the mapped operation executed (`mappedOperation`).

3. **Cipher Puzzle System**:
   - Challenges provide encoded clue blocks across eight classic cipher families:
     - **Morse Code** (Auditory/telecom dot-dash encoding)
     - **Binary UTF-8** (8-bit Base-2 byte streams)
     - **Hexadecimal UTF-8** (Base-16 byte representations)
     - **Base64** (Standard radix-64 ASCII transmission encoding)
     - **ROT13 & Caesar Shift** (Monoalphabetic rotational ciphers)
     - **ASCII Decimal Codes** (Base-10 character code values)
     - **URL Percent-Encoding** (%XX standard representation)
   - Built-in live decoder scratchpad and clue drawer enable players to inspect and decode clues without leaving the terminal view.

4. **Scheduled Individual Competitions with Server-Authoritative Timing**:
   - Players register directly with their verified identity (zero team-assembly barrier).
   - Games feature scheduled registration windows, start times, and deadlines with server-corrected countdowns.
   - Timing and scoring are calculated strictly on the server (`startedAt`, `completedAt`, `durationMs`). Client clocks are purely visual.
   - Leaderboards aggregate each contender's best score per challenge with deterministic tie-breaking (completions, then aggregate time).

5. **Terminal-First Workspace & Real-Time Context Panel**:
   - Focused 7/5 desktop split layout prioritizing the terminal command prompt alongside a tabbed context panel (Clues, Virtual Filesystem Tree, Reference Handbook, and Persistent Scratchpad).
   - Fluid mobile layout with quick context drawer tabs and touch-friendly controls.
   - Strictly non-emoji visual language utilizing semantic Lucide React SVG iconography.

6. **Live Admin Operations Console**:
   - Event supervisors can monitor registrations, active runs, command streams, and live standings in real time with auto-refreshing telemetry.
   - Emergency guarded controls to pause, resume, or permanently conclude competitions with audit-logged action confirmations.

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS (developer terminal dark aesthetic)
- **Database ORM**: Prisma ORM with SQLite (development/testing) & PostgreSQL (production ready)
- **Authentication**: OpenID Connect (OIDC) Relying Party with PKCE + Jose JWT session cookies (with Dev Mock Auth mode)
- **Icons**: Lucide React (Strict zero-emoji standard)
- **Test Suite**: Vitest (101 unit, integration, and E2E tests across 19 suites)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default `.env` configuration:

```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
SESSION_SECRET="development-session-secret-key-must-be-32-chars-long-minimum"
OIDC_ISSUER="https://oidc.fossclub.tech"
OIDC_CLIENT_ID="shellshift"
OIDC_CLIENT_SECRET="replace-with-registered-client-secret"
OIDC_REDIRECT_URI="http://localhost:3000/api/auth/callback"
OIDC_SCOPES="openid profile email club"
MOCK_AUTH_ENABLED="false"
ADMIN_EMAILS="admin@shellshift.io"
```

### 3. Initialize & Seed Database

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed challenges, scheduled tournament, and hints
npx tsx prisma/seed.ts
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎮 Playable Demo Challenges Included

1. **Level 1 — Operation Inversion** (`slug: operation-inversion`):
   - **Remappings**: `'cd'` creates directories (`mkdir`), `'mkdir'` deletes directories (`rm`), `'cat'` lists directories (`ls`), `'ls'` displays file contents (`cat`).
   - **Encodings**: Base64 & International Morse Code.
   - **Objective**: Create directory `/workspace/breach` and read `/clues/signal.txt`.

2. **Level 2 — The Cryptic Agent** (`slug: the-cryptic-agent`):
   - **Remappings**: `'touch'` prints working directory (`pwd`), `'pwd'` touches/creates files (`touch`), `'rm'` outputs file contents (`cat`).
   - **Encodings**: Hexadecimal UTF-8 & ROT13.
   - **Objective**: Deploy file `/workspace/agent.key` and inspect shadow cipher.

3. **Level 3 — Deep Breach: Operation Babel** (`slug: deep-breach-babel`):
   - **Remappings**: `'mv'` copies files (`cp`), `'cp'` deletes files (`rm`), `'grep'` creates directories (`mkdir`).
   - **Encodings**: Binary UTF-8, ASCII Decimal integers, and URL Percent-Encoding.
   - **Objective**: Create `/opt/vault/core`, copy secret key into `/opt/vault/core/master.key`, and remove `/opt/vault/secrets/fragment_a.dat`.

---

## 🔐 OpenID Connect & Authentication

ShellShift integrates with the official **USAR FOSS OIDC Provider** (`https://oidc.fossclub.tech`) as a registered confidential Relying Party (RP):

- **Dynamic Discovery**: Automatic discovery via `https://oidc.fossclub.tech/.well-known/openid-configuration` (authorization, token, JWKS, userinfo, and end-session endpoints).
- **PKCE S256**: Cryptographic `code_challenge` / `code_verifier` matching RFC 7636.
- **State & Nonce Validation**: Ephemeral, HttpOnly, SameSite cookies protect against CSRF and token replay.
- **Cryptographic ID Token Verification**: Validates RS256 token signatures against the provider's discovered JWKS (`jose.jwtVerify`), enforcing exact issuer, audience, expiration, azp, and nonce.
- **Stable Account Association**: Players are keyed by the compound `(oidcIssuer, oidcSub)` identity tuple; email or username modifications never corrupt historical records or duplicate accounts.
- **Strict Administrator Boundaries**: Club membership (`member: true`) or generic provider roles (`role: "admin"`) do not grant ShellShift console access. Privileges are strictly governed by server-side `ADMIN_EMAILS` allowlists.
- **RP-Initiated Logout**: Supports both local application logout and optional federated logout via discovered `end_session_endpoint`.
- **Diagnostic Inspector**: Run `npm run oidc:check` to inspect provider reachability, protocol metadata, and public keys without leaking secrets.
- **Full Guide**: See [`docs/oidc-setup.md`](file:///home/harsh/coding/foss-forge/docs/oidc-setup.md) for full maintainer registration instructions.

---

## 📡 API Contract Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check and database status |
| `/api/auth/login` | `GET` | Initiates OIDC PKCE flow or local dev mock authentication |
| `/api/auth/callback` | `GET` | Validates OIDC PKCE code exchange and RS256 ID tokens |
| `/api/auth/logout` | `POST, GET` | Clears local session cookie (supports `?federated=true`) |
| `/api/me` | `GET` | Current authenticated session & profile |
| `/api/games/[gameId]/register` | `POST` | Individual contender registration for hosted game |
| `/api/games/[gameId]/standings`| `GET` | Live standings with best verified challenge scores |
| `/api/challenges` | `GET` | List published challenges (answers stripped) |
| `/api/challenges/current` | `GET` | Active event and primary challenge |
| `/api/runs/start` | `POST` | Start a race run; initializes authoritative timer |
| `/api/runs/[runId]` | `GET` | Current run state, timer, and VFS tree |
| `/api/runs/[runId]/commands` | `POST` | Execute virtual shell command & evaluate objective |
| `/api/runs/[runId]/hints/[hintId]` | `POST` | Unlock hint and apply penalty |
| `/api/leaderboard` | `GET` | Verified global rankings |
| `/api/admin/games` | `GET, POST` | Hosted game CRUD and scheduling |
| `/api/admin/games/[id]/publish` | `POST` | Publish validation & launch |
| `/api/admin/games/[id]/status` | `PATCH` | Change state (`PAUSED`, `PUBLISHED`, `ENDED`) |
| `/api/admin/games/[id]/operations` | `GET` | Live telemetry, active contenders, and command activity stream |
| `/api/admin/challenges` | `GET, POST` | Challenge authoring and inspection |
| `/api/admin/challenges/[id]` | `GET, PUT` | Update challenge parameters |

---

## 🧪 Automated Testing

Run the full Vitest test suite:

```bash
npm run test
```

### Verified Test Cases (101 Tests Passing Across 19 Suites):
1. **End-to-End Individual Competition Flow**: Complete lifecycle (admin game creation/publication, player registration, sandboxed execution, objective evaluation, score breakdown, standings calculation, admin pause/end).
2. **Individual Game Lifecycle**: Phase derivation (`SCHEDULED`, `REGISTRATION_OPEN`, `STARTING_SOON`, `LIVE`, `PAUSED`, `ENDED`), auto-advancing countdowns.
3. **Contender Registration**: Date window validation, idempotent duplicate registration handling, player linking.
4. **Individual Run Access & Isolation**: Contender run protection, admin supervisory bypass, expiration, and pause rejection.
5. **Deterministic Standings Engine**: Best challenge score deduplication, multi-factor tiebreaks (completions, aggregate duration).
6. **Live Operations Console**: Real-time telemetry, active run counts, command auditing, guarded status changes.
7. **Structured Challenge Authoring**: Visual builder for command mappings, cipher clues, VFS state, objective rules, and hints.
8. **Terminal-First Play Shell**: Responsive 7/5 desktop split, mobile drawer, semantic output formatting, and result presentation.
9. **OIDC Authorization & PKCE S256**: URL parameter validation, S256 challenge creation, state/nonce protection.
10. **Cryptographic Signature Verification**: RS256 token verification against provider JWKS; rejection of attacker/tampered keys.
11. **Issuer & Audience Enforcement**: Strict rejection of mismatched issuers, unauthorized audiences, or invalid `azp`.
12. **Virtual Filesystem Sandboxing**: Path traversal outside root clamped, home resolution, nesting, root deletion prevention.
13. **Command Parser & Injection Defense**: Rejection of pipes (`|`), chaining (`;`), conditionals (`&&`, `||`), substitution (`$()`).
14. **Deterministic Scoring Engine**: Base score caps (1,000 pts), intermediate objectives (up to 500 pts), speed bonuses (up to 300 pts), and hint penalty caps (100 pts).

---

## 🛡️ Production Deployment (PostgreSQL & Docker)

To switch from SQLite to PostgreSQL:

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Set in `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/shellshift?schema=public"
   NODE_ENV="production"
   MOCK_AUTH_ENABLED="false"
   ```
3. Run migrations and seed:
   ```bash
   npx prisma migrate deploy
   npx tsx prisma/seed.ts
   ```
4. Build and start:
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 License

MIT License. Developed for competitive open-source capture-the-flag and Linux puzzle racing.
