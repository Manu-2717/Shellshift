import crypto from "crypto";
import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from "jose";

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

export interface OidcDiscoveryMetadata {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  jwks_uri: string;
  userinfo_endpoint?: string;
  end_session_endpoint?: string;
  response_types_supported?: string[];
  code_challenge_methods_supported?: string[];
  id_token_signing_alg_values_supported?: string[];
  token_endpoint_auth_methods_supported?: string[];
  scopes_supported?: string[];
  claims_supported?: string[];
  [key: string]: unknown;
}

export interface TokenResponse {
  access_token?: string;
  token_type?: string;
  id_token?: string;
  expires_in?: number;
  scope?: string;
  refresh_token?: string;
  [key: string]: unknown;
}

export interface ValidatedClaims {
  sub: string;
  iss: string;
  aud: string | string[];
  exp: number;
  iat?: number;
  nonce?: string;
  azp?: string;
  email?: string | null;
  email_verified?: boolean;
  name?: string | null;
  preferred_username?: string | null;
  picture?: string | null;
  member?: boolean;
  role?: string;
  [key: string]: unknown;
}

// In-memory discovery and JWKS caches
const discoveryCache = new Map<string, { metadata: OidcDiscoveryMetadata; expiresAt: number }>();
const jwksCache = new Map<string, JWTVerifyGetKey>();
const DISCOVERY_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export function clearDiscoveryCache(): void {
  discoveryCache.clear();
  jwksCache.clear();
}

/**
 * Normalizes issuer URL by stripping trailing slashes.
 */
export function normalizeIssuer(issuer: string): string {
  return issuer.trim().replace(/\/+$/, "");
}

/**
 * Returns OIDC configuration populated from environment variables with production defaults.
 */
export function getOidcConfig(): OidcConfig {
  const defaultProductionUrl = "https://shellshift-ten.vercel.app";
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined) ||
    (process.env.NODE_ENV === "production" ? defaultProductionUrl : "http://localhost:3000");
  const defaultRedirectUri = `${baseUrl.replace(/\/+$/, "")}/api/auth/callback`;

  return {
    issuer: normalizeIssuer(process.env.OIDC_ISSUER || "https://oidc.fossclub.tech"),
    clientId: process.env.OIDC_CLIENT_ID || "shellshift",
    clientSecret: process.env.OIDC_CLIENT_SECRET || "",
    redirectUri: process.env.OIDC_REDIRECT_URI || defaultRedirectUri,
    scopes: process.env.OIDC_SCOPES || "openid profile email club",
  };
}

/**
 * Validates OIDC configuration before initiating authentication.
 */
export function validateOidcConfig(config: OidcConfig): { valid: boolean; error?: string } {
  if (!config.issuer) {
    return { valid: false, error: "OIDC_ISSUER is not configured." };
  }
  try {
    const url = new URL(config.issuer);
    if (!["http:", "https:"].includes(url.protocol)) {
      return { valid: false, error: "OIDC_ISSUER must use http or https protocol." };
    }
  } catch {
    return { valid: false, error: "OIDC_ISSUER must be a valid URL." };
  }

  if (!config.clientId) {
    return { valid: false, error: "OIDC_CLIENT_ID is not configured." };
  }

  if (!config.redirectUri) {
    return { valid: false, error: "OIDC_REDIRECT_URI is not configured." };
  }
  try {
    new URL(config.redirectUri);
  } catch {
    return { valid: false, error: "OIDC_REDIRECT_URI must be a valid absolute URL." };
  }

  return { valid: true };
}

/**
 * Dynamically fetches and validates provider discovery metadata.
 * Enforces that discovered issuer strictly matches the configured issuer.
 */
export async function discoverEndpoints(
  issuer: string,
  options?: { forceRefresh?: boolean; fetchFn?: typeof fetch }
): Promise<OidcDiscoveryMetadata> {
  const normIssuer = normalizeIssuer(issuer);
  const now = Date.now();

  if (!options?.forceRefresh) {
    const cached = discoveryCache.get(normIssuer);
    if (cached && cached.expiresAt > now) {
      return cached.metadata;
    }
  }

  const discoveryUrl = `${normIssuer}/.well-known/openid-configuration`;
  const fetchImpl = options?.fetchFn || fetch;

  let response: Response;
  try {
    response = await fetchImpl(discoveryUrl, {
      headers: { Accept: "application/json" },
    });
  } catch (err) {
    throw new Error(
      `Failed to reach OIDC discovery endpoint at "${discoveryUrl}": ${(err as Error).message}`
    );
  }

  if (!response.ok) {
    throw new Error(
      `OIDC discovery endpoint "${discoveryUrl}" returned HTTP status ${response.status}`
    );
  }

  let metadata: OidcDiscoveryMetadata;
  try {
    metadata = (await response.json()) as OidcDiscoveryMetadata;
  } catch (err) {
    throw new Error(
      `Failed to parse JSON from OIDC discovery endpoint "${discoveryUrl}": ${(err as Error).message}`
    );
  }

  // Validate declared issuer matches configured issuer
  if (!metadata.issuer) {
    throw new Error(`Discovery document at "${discoveryUrl}" is missing the "issuer" claim.`);
  }

  const declaredIssuer = normalizeIssuer(metadata.issuer);
  if (declaredIssuer !== normIssuer) {
    throw new Error(
      `Configured OIDC issuer "${normIssuer}" does not match provider metadata issuer "${declaredIssuer}".`
    );
  }

  // Validate essential endpoint presence
  if (!metadata.authorization_endpoint) {
    throw new Error(`Discovery document missing "authorization_endpoint".`);
  }
  if (!metadata.token_endpoint) {
    throw new Error(`Discovery document missing "token_endpoint".`);
  }
  if (!metadata.jwks_uri) {
    throw new Error(`Discovery document missing "jwks_uri".`);
  }

  discoveryCache.set(normIssuer, {
    metadata,
    expiresAt: now + DISCOVERY_CACHE_TTL_MS,
  });

  return metadata;
}

export function generatePkcePair(): { codeVerifier: string; codeChallenge: string } {
  // Generate a cryptographically random code_verifier (32 bytes = 43 base64url characters)
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function generateRandomState(): string {
  return crypto.randomBytes(24).toString("base64url");
}

export function generateNonce(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Builds the authorization URL dynamically using discovered endpoints.
 */
export async function buildAuthorizationUrl(
  config: OidcConfig,
  state: string,
  codeChallenge: string,
  nonce: string,
  metadata?: OidcDiscoveryMetadata
): Promise<string> {
  const meta = metadata || (await discoverEndpoints(config.issuer));
  const url = new URL(meta.authorization_endpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("scope", config.scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("nonce", nonce);
  return url.toString();
}

/**
 * Retrieves or initializes cached remote JWKS for an issuer.
 */
function getOrCreateRemoteJWKSet(jwksUri: string): JWTVerifyGetKey {
  let keySet = jwksCache.get(jwksUri);
  if (!keySet) {
    keySet = createRemoteJWKSet(new URL(jwksUri));
    jwksCache.set(jwksUri, keySet);
  }
  return keySet;
}

/**
 * Exchanges authorization code for tokens at discovered token endpoint.
 */
export async function exchangeAuthorizationCode(
  config: OidcConfig,
  code: string,
  codeVerifier: string,
  metadata?: OidcDiscoveryMetadata,
  fetchFn?: typeof fetch
): Promise<TokenResponse> {
  if (!config.clientSecret) {
    throw new Error(
      "OIDC client secret is missing. Confidential client requires a registered client secret."
    );
  }

  const meta = metadata || (await discoverEndpoints(config.issuer));
  const fetchImpl = fetchFn || fetch;

  // Standard client_secret_basic authentication (RFC 6749 Section 2.3.1)
  const credentials = `${encodeURIComponent(config.clientId)}:${encodeURIComponent(config.clientSecret)}`;
  const authHeader = `Basic ${Buffer.from(credentials).toString("base64")}`;

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });

  const response = await fetchImpl(meta.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: authHeader,
      Accept: "application/json",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Token exchange failed (HTTP ${response.status}): ${errorBody}`);
  }

  return (await response.json()) as TokenResponse;
}

/**
 * Cryptographically validates the received ID token using RS256 and discovered JWKS.
 * Verifies signature, issuer, audience, azp, expiration, and nonce.
 */
export async function verifyIdToken(
  idToken: string,
  config: OidcConfig,
  expectedNonce: string,
  metadata?: OidcDiscoveryMetadata,
  jwksOrKey?: JWTVerifyGetKey | Uint8Array | crypto.KeyObject
): Promise<ValidatedClaims> {
  if (!idToken || typeof idToken !== "string") {
    throw new Error("Missing ID token");
  }

  const meta = metadata || (await discoverEndpoints(config.issuer));
  const keySource = jwksOrKey || getOrCreateRemoteJWKSet(meta.jwks_uri);

  const allowedAlgs = meta.id_token_signing_alg_values_supported && meta.id_token_signing_alg_values_supported.length > 0
    ? meta.id_token_signing_alg_values_supported
    : ["RS256"];

  const { payload } = await jwtVerify(idToken, keySource as any, {
    issuer: config.issuer,
    audience: config.clientId,
    algorithms: allowedAlgs,
    clockTolerance: 30, // 30 seconds clock skew tolerance
  });

  // Verify nonce
  if (!payload.nonce || payload.nonce !== expectedNonce) {
    throw new Error(
      `ID token nonce mismatch. Expected "${expectedNonce}", received "${payload.nonce}"`
    );
  }

  // Verify authorized party (azp) if multiple audiences or if present
  if (Array.isArray(payload.aud) && payload.aud.length > 1) {
    if (!payload.azp || payload.azp !== config.clientId) {
      throw new Error("Invalid or missing azp claim in ID token with multiple audiences.");
    }
  } else if (payload.azp && payload.azp !== config.clientId) {
    throw new Error(
      `azp claim mismatch: expected "${config.clientId}", received "${payload.azp}".`
    );
  }

  // Verify subject (sub)
  if (!payload.sub || typeof payload.sub !== "string" || !payload.sub.trim()) {
    throw new Error("ID token is missing a valid subject (sub) claim.");
  }

  return payload as ValidatedClaims;
}

/**
 * Fetches user profile from discovered UserInfo endpoint if access token is available.
 */
export async function fetchUserInfo(
  accessToken: string,
  userinfoEndpoint: string,
  fetchFn?: typeof fetch
): Promise<Record<string, unknown>> {
  const fetchImpl = fetchFn || fetch;
  const res = await fetchImpl(userinfoEndpoint, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`UserInfo endpoint request failed with HTTP ${res.status}`);
  }

  return (await res.json()) as Record<string, unknown>;
}

/**
 * Builds RP-initiated logout URL if end_session_endpoint is supported by the provider.
 */
export async function buildEndSessionUrl(
  config: OidcConfig,
  postLogoutRedirectUri: string,
  idTokenHint?: string,
  metadata?: OidcDiscoveryMetadata
): Promise<string | null> {
  try {
    const meta = metadata || (await discoverEndpoints(config.issuer));
    if (!meta.end_session_endpoint) {
      return null;
    }
    const url = new URL(meta.end_session_endpoint);
    url.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    if (idTokenHint) {
      url.searchParams.set("id_token_hint", idTokenHint);
    }
    return url.toString();
  } catch {
    return null;
  }
}

/**
 * Determines whether mock authentication is permitted.
 * Strictly forbidden in production environments.
 */
export function isMockAuthAllowed(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.MOCK_AUTH_ENABLED === "true";
}

/**
 * Determines whether mock administrator authentication is permitted.
 * Strictly forbidden in production environments.
 */
export function isMockAdminAllowed(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return isMockAuthAllowed() && process.env.ALLOW_MOCK_ADMIN !== "false";
}

/**
 * Evaluates whether an authenticated identity is granted the ShellShift ADMIN role.
 *
 * Security rules:
 * 1. Matches against server-side ADMIN_EMAILS allowlist.
 * 2. Matches against explicitly configured, ShellShift-scoped role claims.
 * 3. Never grants ADMIN merely because provider returns member=true or generic role claims.
 */
export function checkIsAdmin(email?: string | null, claims?: Record<string, unknown>): boolean {
  // 1. Verify against server-side ADMIN_EMAILS allowlist
  if (email) {
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.includes(email.toLowerCase())) {
      return true;
    }
  }

  // 2. Verify against explicitly trusted ShellShift-scoped claims
  if (claims) {
    const shellShiftRoles =
      claims["https://shellshift.io/roles"] ||
      claims["shellshift_roles"];
    if (Array.isArray(shellShiftRoles) && shellShiftRoles.includes("ADMIN")) {
      return true;
    }
  }

  return false;
}
