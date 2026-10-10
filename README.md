# ShellShift — Linux Command Cipher Race

> **ShellShift** is a competitive, browser-based Linux command-line puzzle game where teams decode hidden instructions, discover that familiar Linux commands have unusual meanings, and race to solve challenges under authoritative server-side timing.

---

## ⚡ Core Concepts

1. **Simulated Shell Interpreter (Zero Host Execution)**:
   - Player inputs (`pwd`, `ls`, `cd`, `cat`, `mkdir`, `touch`, `cp`, `mv`, `rm`, `find`, `grep`, `head`, `tail`, `echo`, `tree`, `clear`, `help`) run exclusively in an isolated, in-memory/persisted virtual filesystem.
   - Host `exec`, `eval`, `child_process`, and OS shells are never invoked.
   - Sandbox strictly traps paths to the virtual root `/` and rejects shell chaining (`;`, `&&`, `||`), pipes (`|`), redirection (`>`, `<`), and command substitution (`$()`, `` ` ``).

2. **Custom Command Remapping Matrix**:
   - Each challenge defines its own configurable mapping table (e.g. `cd` maps to `mkdir`, `mkdir` maps to `rm`, `cat` maps to `ls`, `ls` maps to `cat`).
   - The game distinguishes between what the player typed (`enteredCommand`) and what operation the game executed (`mappedOperation`).

3. **Cipher Puzzle System**:
   - Challenges provide encoded clue blocks using:
     - **Morse Code** (Auditory/telecom dot-dash encoding)
     - **Binary UTF-8** (8-bit Base-2 byte streams)
     - **Hexadecimal UTF-8** (Base-16 radix byte representations)
     - **Base64** (Standard radix-64 ASCII transmission encoding)
     - **ROT13 & Caesar Shift** (Monoalphabetic rotational ciphers)
     - **ASCII Decimal Codes** (Base-10 character code values)
     - **URL Percent-Encoding** (%XX standard representation)
   - Built-in live decoder scratchpad enables players to inspect and decode clues in real time.

4. **Team Competition with Server-Authoritative Timing**:
   - The timer is calculated strictly using server timestamps (`startedAt`, `completedAt`, `durationMs`). The browser clock is display-only.
   - Atomic conditional updates protect against concurrent finish race conditions so only one request finalizes victory.

---

## 📦 Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS (developer terminal dark aesthetic)
- **Database ORM**: Prisma ORM with SQLite (development/testing) & PostgreSQL (production ready)
- **Authentication**: OpenID Connect (OIDC) client with PKCE + Jose JWT session cookies (with Dev Mock Auth mode)
- **Icons**: Lucide React
- **Test Suite**: Vitest (25 unit and integration tests)

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
OIDC_ISSUER="https://auth.example.com"
OIDC_CLIENT_ID="shellshift-client-id"
OIDC_CLIENT_SECRET="shellshift-client-secret"
OIDC_REDIRECT_URI="http://localhost:3000/api/auth/callback"
OIDC_SCOPES="openid profile email"
MOCK_AUTH_ENABLED="true"
ADMIN_EMAILS="admin@shellshift.io"
```

### 3. Initialize & Seed Database

```bash
# Push schema to SQLite / PostgreSQL
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed challenges, default event, and hints
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

- The application operates as an **OIDC Client** (not a replacement IdP).
- Authorization code flow with PKCE (`code_verifier` & `code_challenge` S256).
- State and nonce CSRF validation.
- User identity is keyed by the unique `(oidcIssuer, oidcSub)` pair.
- Sessions are stored in signed, HttpOnly, SameSite cookies.
- **Mock Auth Mode**: When `MOCK_AUTH_ENABLED="true"` and `NODE_ENV !== "production"`, allows 1-click test sign-in as player or admin via `/api/auth/login?mock=true&role=user|admin`. Automatically forbidden in production.

---

## 📡 API Contract Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check and database status |
| `/api/auth/login` | `GET` | Initiates OIDC flow or dev mock authentication |
| `/api/auth/callback` | `GET` | Validates OIDC PKCE code exchange |
| `/api/auth/logout` | `POST` | Clears session cookie |
| `/api/me` | `GET` | Current authenticated session & team info |
| `/api/teams/register` | `POST` | Create team or join team with invite code |
| `/api/challenges` | `GET` | List published challenges (answers stripped) |
| `/api/challenges/current`| `GET` | Active event and primary challenge |
| `/api/runs/start` | `POST` | Start a race run; initializes authoritative timer |
| `/api/runs/[runId]/commands` | `POST` | Execute virtual shell command & evaluate objective |
| `/api/runs/[runId]` | `GET` | Current run state, timer, and VFS tree |
| `/api/runs/[runId]/hints/[hintId]` | `POST` | Unlock hint and apply time penalty |
| `/api/leaderboard` | `GET` | Verified rankings ordered by server duration |
| `/api/admin/challenges` | `GET, POST` | Inspect decoded master keys or create challenges |
| `/api/admin/event` | `GET, PATCH` | Toggle event status (`ACTIVE`, `PAUSED`, `ENDED`) |
| `/api/admin/runs` | `GET` | Monitor live runs and recent team commands |

---

## 🧪 Automated Testing

Run the full Vitest test suite:

```bash
npm run test
```

### Verified Test Cases (25 Tests Passing):
1. **Virtual Filesystem Isolation**: Path traversal outside root clamped, `~` home directory resolution, directory nesting, file sandboxing, root deletion prevention.
2. **Command Parser & Injection Defense**: Rejection of pipes (`|`), chaining (`;`), conditionals (`&&`, `||`), substitution (`$()`, `` ` ``), and length limit enforcement.
3. **Configurable Command Remapping**: Verification of remapped tokens (`cd` -> `mkdir`, `cat` -> `ls`) vs unmapped standard commands.
4. **Cipher Puzzle Algorithms**: Accurate encoding and decoding for Morse, Binary, Hex, Base64, ROT13, Caesar (shift 7), ASCII Decimals, and URL percent.
5. **Objective Evaluation**: Multi-condition rule validation (file exists, dir exists, content matches, file deleted).
6. **Registration Integrity**: Unique team name enforcement and duplicate registration prevention.
7. **OIDC Sessions**: JWT signing, expiration, and role verification.
8. **Cross-Team Security**: Proving team A cannot access or mutate team B's run.
9. **Duplicate Run-Start Prevention**: Ensuring starting an in-progress challenge preserves the original server timer.
10. **Atomic Race-Condition Handling**: Proving concurrent finish requests allow exactly one completion event.
11. **Post-Completion Rejection**: Ensuring finished runs reject subsequent mutations.
12. **Sliding-Window Rate Limiting**: Request throttling per team/run.
13. **End-to-End Challenge Completion**: Full simulated race from start to verified leaderboard entry.

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
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```
4. Build and start:
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 License

MIT License. Developed for competitive open-source capture-the-flag and Linux puzzle racing.
