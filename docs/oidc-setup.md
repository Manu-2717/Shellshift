# ShellShift — USAR FOSS OpenID Connect (OIDC) Integration Guide

This guide details the integration between **ShellShift** and the official **USAR FOSS OIDC Provider**.

---

## 1. Overview & Architecture

ShellShift operates as a standard, confidential OpenID Connect (OIDC) Relying Party (RP). Dynamic client registration is intentionally disabled on the provider. ShellShift must be registered in the provider's reviewed `clients.json` registry before live authentication succeeds.

```
+-----------------------------------------------------------------------------------------+
|                                    USAR FOSS OIDC Flow                                  |
+-----------------------------------------------------------------------------------------+
  User Browser                ShellShift App (RP)             USAR FOSS OIDC Provider
       |                               |                                |
       | 1. "Sign in with USAR FOSS"   |                                |
       |------------------------------>|                                |
       |                               | 2. Fetch Discovery Metadata    |
       |                               |------------------------------->|
       |                               |    (issuer, endpoints, jwks)   |
       |                               |<-------------------------------|
       |                               |                                |
       |                               | 3. Create PKCE (S256),         |
       |                               |    state, nonce & store in     |
       |                               |    transient HttpOnly cookies  |
       | 4. 302 Redirect to /auth      |                                |
       |<------------------------------|                                |
       |                                                                |
       | 5. Authenticate via Provider (Credentials / GitHub)            |
       |--------------------------------------------------------------->|
       |                                                                |
       | 6. Redirect back to /api/auth/callback?code=...&state=...      |
       |<---------------------------------------------------------------|
       |                                                                |
       | 7. Forward authorization code & state                          |
       |------------------------------>|                                |
       |                               | 8. Verify state & cookie       |
       |                               | 9. Exchange code + verifier    |
       |                               |    via client_secret_basic     |
       |                               |------------------------------->|
       |                               | 10. Return id_token & tokens   |
       |                               |<-------------------------------|
       |                               |                                |
       |                               | 11. Cryptographically verify   |
       |                               |     ID Token using RS256 JWKS, |
       |                               |     issuer, audience, nonce    |
       |                               | 12. Upsert user by (iss, sub)  |
       |                               | 13. Create ShellShift session  |
       | 14. 302 Redirect to App       |                                |
       |<------------------------------|                                |
```

---

## 2. Provider Endpoints & Discovery

### Production Configuration
- **Production Issuer**: `https://oidc.fossclub.tech`
- **Discovery Endpoint**: `https://oidc.fossclub.tech/.well-known/openid-configuration`

### Discovered Metadata
Endpoints are **dynamically resolved** from the discovery document:
- **Authorization Endpoint**: `https://oidc.fossclub.tech/auth`
- **Token Endpoint**: `https://oidc.fossclub.tech/token`
- **JWKS URI**: `https://oidc.fossclub.tech/jwks`
- **UserInfo Endpoint**: `https://oidc.fossclub.tech/me`
- **End-Session Endpoint**: `https://oidc.fossclub.tech/session/end`
- **Supported Response Types**: `code`
- **Code Challenge Methods**: `S256`
- **ID Token Signing Algorithms**: `RS256`
- **Client Authentication Methods**: `client_secret_basic`, `client_secret_post`

---

## 3. Callback Routes

The exact callback route implemented in ShellShift is:

| Environment | Base URL | Redirect URI |
|---|---|---|
| **Local Development** | `http://localhost:3000` | `http://localhost:3000/api/auth/callback` |
| **Production** | `https://<shellshift-domain>` | `https://<shellshift-domain>/api/auth/callback` |

> [!IMPORTANT]
> The redirect URI registered on the provider must match character-for-character with `OIDC_REDIRECT_URI` in ShellShift's environment.

---

## 4. ShellShift Environment Configuration

Configure `.env` using `.env.example` as a template:

```dotenv
# Database
DATABASE_URL="file:./dev.db"

# Application Base URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ShellShift Application Session Secret (32+ chars random string)
SESSION_SECRET="generate-a-strong-random-32-char-secret"

# USAR FOSS OIDC Provider Configuration
OIDC_ISSUER="https://oidc.fossclub.tech"
OIDC_CLIENT_ID="shellshift"
OIDC_CLIENT_SECRET="replace-with-registered-client-secret"
OIDC_REDIRECT_URI="http://localhost:3000/api/auth/callback"
OIDC_SCOPES="openid profile email club"

# Mock Authentication Mode (MUST be false in production)
MOCK_AUTH_ENABLED="false"

# Administrator Allowlist (Comma-separated emails authorized for Admin Console)
ADMIN_EMAILS="admin@shellshift.io"
```

### Confidential Client Secret Placement

| Component | Variable Name | Purpose |
|---|---|---|
| **ShellShift Application** | `OIDC_CLIENT_SECRET` | Used in HTTP Basic authentication during authorization code exchange at the token endpoint. |
| **OIDC Provider Deployment** | `CLIENT_SECRET_SHELLSHIFT` | Client-specific secret checked by the provider during token requests for `client_id=shellshift`. |

> [!CAUTION]
> **Never commit real secrets** to version control. Never place `OIDC_CLIENT_SECRET` in frontend bundles or expose it in client-side code. The provider's internal database credentials, Redis keys, GitHub OAuth credentials, and private signing keys belong exclusively to the provider.

---

## 5. Provider-Side Registration (OIDC Maintainer Instructions)

Client registration is managed inside the **[USAR-FOSS/OIDC](https://github.com/USAR-FOSS/OIDC)** repository. For full provider-side details, see the [official client registration guide](https://github.com/USAR-FOSS/OIDC/blob/main/docs/ADDING-AN-APP.md).

### Step 1: Clone and Set Up the Provider Repository

```bash
git clone https://github.com/USAR-FOSS/OIDC.git
cd OIDC
npm install
```

### Step 2: Register ShellShift as a Client

Execute the registration script inside the OIDC provider repository:

```bash
npm run client:new -- shellshift \
  --redirect http://localhost:3000/api/auth/callback \
  --logout http://localhost:3000/ \
  --name "ShellShift" \
  --untrusted
```

If a production domain is known, add additional `--redirect` and `--logout` flags:

```bash
npm run client:new -- shellshift \
  --redirect http://localhost:3000/api/auth/callback \
  --redirect https://<production-domain>/api/auth/callback \
  --logout http://localhost:3000/ \
  --logout https://<production-domain>/ \
  --name "ShellShift" \
  --untrusted
```

### Client Trust Level Options

1. **Untrusted Client (`--untrusted`)**: Recommended default. Enables the provider's approval flow where users see the consent screen before authorizing access to their identity and club profile.
2. **First-Party / Trusted Client (`--trusted`)**: If ShellShift is designated an official first-party application by the club maintainers, the maintainer may approve trusted status to bypass the consent screen for club members.
3. **Member-Only Flag**: Do **not** enable member-only restrictions unless the tournament or competition is strictly restricted to club members.
4. **Scopes**: ShellShift requests `openid profile email club`. Do **not** request the provider's special `github` scope.

### Maintainer Checklist Before Live Sign-In Works

- [ ] Execute `npm run client:new -- shellshift ...` in the OIDC repository.
- [ ] Verify `clients.json` contains the `shellshift` client definition with valid redirect URIs.
- [ ] Copy the generated client secret.
- [ ] In the OIDC provider production deployment, configure the environment variable:
  ```env
  CLIENT_SECRET_SHELLSHIFT=<generated-secret>
  ```
- [ ] In the ShellShift deployment, configure:
  ```env
  OIDC_CLIENT_SECRET=<generated-secret>
  ```
- [ ] Commit and push the updated `clients.json` in the OIDC repository.
- [ ] Deploy the OIDC provider update.
- [ ] Deploy ShellShift with the updated environment variables.

---

## 6. Development Diagnostics: `npm run oidc:check`

ShellShift includes a built-in diagnostic tool to test protocol reachability without exposing secrets:

```bash
npm run oidc:check
```

The diagnostic command verifies:
1. `OIDC_ISSUER` reachability and response latency.
2. Discovery document presence at `/.well-known/openid-configuration`.
3. Matching declared issuer vs configured issuer.
4. Presence of required endpoints (`authorization_endpoint`, `token_endpoint`, `jwks_uri`).
5. PKCE `S256` support.
6. RS256 token signing support.
7. Client authentication methods (`client_secret_basic`).
8. JWKS URI reachability and active public keys.
9. Alignment between `OIDC_REDIRECT_URI` and `/api/auth/callback`.

> [!NOTE]
> A successful discovery check confirms protocol reachability, but **does not indicate that client registration has been completed or deployed**. Client authentication requires the provider-side maintainer steps to be finished.

---

## 7. Local Testing & Verification

### Running the Application

```bash
# Push Prisma schema and seed default competition data
npx prisma db push
npx prisma db seed

# Run OIDC diagnostic inspector
npm run oidc:check

# Run test suite
npm run test

# Start Next.js development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Testing Login & Callback Flows

1. **Live OIDC Flow**:
   - Click **"Sign in with USAR FOSS"** on the landing page or navbar.
   - The browser redirects to `https://oidc.fossclub.tech/auth` with `client_id=shellshift`, `code_challenge_method=S256`, `scope=openid profile email club`, `state`, and `nonce`.
   - If client registration is deployed on the provider, log in with test credentials.
   - You are redirected back to `http://localhost:3000/api/auth/callback`.
   - ShellShift exchanges the authorization code using `client_secret_basic` and PKCE `code_verifier`.
   - The ID token is cryptographically verified against the provider's JWKS.
   - You are redirected to `/register` (if new user) or `/lobby` (if already registered).

2. **Error Scenarios Tested**:
   - **User cancels / Access denied**: Redirects to `/?error=Access+was+denied+by+the+identity+provider`.
   - **Tampered state / expired transient cookies**: Redirects to `/?error=Authentication+state+validation+failed`.
   - **ID token signature mismatch**: Cryptographic verification fails; session is rejected.
   - **Nonce mismatch**: Replayed or cross-session tokens are rejected.
   - **Missing provider registration / invalid secret**: Token exchange failure redirected safely without leaking credentials.

3. **Mock Auth Mode (Local Dev Only)**:
   - When developing offline without provider access:
     ```env
     MOCK_AUTH_ENABLED="true"
     ```
   - Click "Dev Mock Login" or visit `/api/auth/login?mock=true&role=user`.
   - In production (`NODE_ENV=production`), mock authentication is strictly forbidden and returns `403 Forbidden`.

4. **Testing Logout**:
   - Click the Sign Out icon in the navbar.
   - Local ShellShift session is destroyed (`shellshift_session` cookie deleted).
   - Optional RP-initiated federated logout is supported at `/api/auth/logout?federated=true` which redirects to the discovered `end_session_endpoint`.

---

## 8. Role & Identity Integrity Rules

1. **Identity Association**:
   - Accounts are uniquely keyed by the compound tuple `(oidcIssuer, oidcSub)`.
   - Email is not used as the primary key.
   - If a player changes their email or preferred username on the provider, their competition history, runs, and team membership remain intact.

2. **Administrator Authorization**:
   - Server-side allowlist (`ADMIN_EMAILS`) or explicit ShellShift role claims (`https://shellshift.io/roles`) are required.
   - **Club membership (`member: true`) or generic provider roles (`role: "admin"`) NEVER grant administrator rights in ShellShift.**
