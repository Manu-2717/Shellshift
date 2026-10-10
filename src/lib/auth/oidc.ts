import crypto from "crypto";

export interface OidcConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

export function getOidcConfig(): OidcConfig {
  return {
    issuer: process.env.OIDC_ISSUER || "https://auth.example.com",
    clientId: process.env.OIDC_CLIENT_ID || "shellshift-client-id",
    clientSecret: process.env.OIDC_CLIENT_SECRET || "shellshift-client-secret",
    redirectUri: process.env.OIDC_REDIRECT_URI || "http://localhost:3000/api/auth/callback",
    scopes: process.env.OIDC_SCOPES || "openid profile email",
  };
}

export function generatePkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

export function generateRandomState(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function generateNonce(): string {
  return crypto.randomBytes(16).toString("hex");
}

export function buildAuthorizationUrl(
  config: OidcConfig,
  state: string,
  codeChallenge: string,
  nonce: string
): string {
  const url = new URL(`${config.issuer.replace(/\/+$/, "")}/auth`);
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

export function isMockAuthAllowed(): boolean {
  return process.env.MOCK_AUTH_ENABLED === "true";
}

export function isMockAdminAllowed(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return process.env.MOCK_AUTH_ENABLED === "true" && process.env.ALLOW_MOCK_ADMIN !== "false";
}

export function checkIsAdmin(email?: string | null, claims?: Record<string, any>): boolean {
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

  // 2. Verify against trusted OIDC claims
  if (claims) {
    const roles = claims.roles || claims["https://shellshift.io/roles"] || claims.groups;
    if (Array.isArray(roles) && roles.includes("ADMIN")) {
      return true;
    }
  }

  return false;
}
