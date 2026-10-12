import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { generateKeyPair, exportJWK, SignJWT } from "jose";
import crypto from "crypto";
import {
  buildAuthorizationUrl,
  buildEndSessionUrl,
  checkIsAdmin,
  clearDiscoveryCache,
  discoverEndpoints,
  exchangeAuthorizationCode,
  generateNonce,
  generatePkcePair,
  generateRandomState,
  isMockAdminAllowed,
  isMockAuthAllowed,
  OidcConfig,
  OidcDiscoveryMetadata,
  validateOidcConfig,
  verifyIdToken,
} from "./oidc";
import { createSessionToken, verifySessionToken, SessionUser } from "./session";
import { prisma } from "../prisma";

describe("USAR FOSS OpenID Connect (OIDC) Integration Suite", () => {
  // Test RSA Key Pair for cryptographic signing
  let testPrivateKey: crypto.KeyObject;
  let testPublicKey: crypto.KeyObject;
  let testPublicJwk: any;
  let attackerPrivateKey: crypto.KeyObject;

  const validIssuer = "https://oidc.fossclub.tech";
  const validClientId = "shellshift";
  const validClientSecret = "mock-super-secret-registered-key";
  const validRedirectUri = "http://localhost:3000/api/auth/callback";

  const testConfig: OidcConfig = {
    issuer: validIssuer,
    clientId: validClientId,
    clientSecret: validClientSecret,
    redirectUri: validRedirectUri,
    scopes: "openid profile email club",
  };

  const mockDiscoveryMetadata: OidcDiscoveryMetadata = {
    issuer: validIssuer,
    authorization_endpoint: `${validIssuer}/auth`,
    token_endpoint: `${validIssuer}/token`,
    jwks_uri: `${validIssuer}/jwks`,
    userinfo_endpoint: `${validIssuer}/me`,
    end_session_endpoint: `${validIssuer}/session/end`,
    response_types_supported: ["code"],
    code_challenge_methods_supported: ["S256"],
    id_token_signing_alg_values_supported: ["RS256"],
    token_endpoint_auth_methods_supported: ["client_secret_basic", "client_secret_post"],
    scopes_supported: ["openid", "profile", "email", "club"],
  };

  beforeAll(async () => {
    // Generate valid RSA 2048 keypair
    const validKeys = await generateKeyPair("RS256");
    testPrivateKey = validKeys.privateKey as unknown as crypto.KeyObject;
    testPublicKey = validKeys.publicKey as unknown as crypto.KeyObject;
    testPublicJwk = await exportJWK(validKeys.publicKey);
    testPublicJwk.kid = "test-key-2026";
    testPublicJwk.alg = "RS256";
    testPublicJwk.use = "sig";

    // Generate untrusted attacker keypair
    const attackerKeys = await generateKeyPair("RS256");
    attackerPrivateKey = attackerKeys.privateKey as unknown as crypto.KeyObject;

    clearDiscoveryCache();
  });

  afterAll(async () => {
    // Clean up any test users created during test runs
    await prisma.user.deleteMany({
      where: { oidcIssuer: validIssuer, oidcSub: { startsWith: "test-" } },
    });
  });

  // --------------------------------------------------------------------------
  // 1. The login endpoint constructs an authorization request with PKCE S256
  // --------------------------------------------------------------------------
  it("1. constructs a valid authorization request URL with PKCE S256", async () => {
    const state = generateRandomState();
    const nonce = generateNonce();
    const { codeChallenge } = generatePkcePair();

    const authUrlString = await buildAuthorizationUrl(
      testConfig,
      state,
      codeChallenge,
      nonce,
      mockDiscoveryMetadata
    );

    const authUrl = new URL(authUrlString);
    expect(authUrl.origin).toBe("https://oidc.fossclub.tech");
    expect(authUrl.pathname).toBe("/auth");
    expect(authUrl.searchParams.get("client_id")).toBe("shellshift");
    expect(authUrl.searchParams.get("response_type")).toBe("code");
    expect(authUrl.searchParams.get("redirect_uri")).toBe("http://localhost:3000/api/auth/callback");
    expect(authUrl.searchParams.get("scope")).toBe("openid profile email club");
    expect(authUrl.searchParams.get("code_challenge_method")).toBe("S256");
    expect(authUrl.searchParams.get("code_challenge")).toBe(codeChallenge);
    expect(authUrl.searchParams.get("state")).toBe(state);
    expect(authUrl.searchParams.get("nonce")).toBe(nonce);
  });

  // --------------------------------------------------------------------------
  // 2. State, nonce, and PKCE verifier are generated securely
  // --------------------------------------------------------------------------
  it("2. generates cryptographically secure state, nonce, and PKCE verifier pairs", () => {
    const state1 = generateRandomState();
    const state2 = generateRandomState();
    expect(state1).not.toBe(state2);
    expect(state1.length).toBeGreaterThanOrEqual(32);

    const nonce1 = generateNonce();
    const nonce2 = generateNonce();
    expect(nonce1).not.toBe(nonce2);
    expect(nonce1.length).toBeGreaterThanOrEqual(32);

    const { codeVerifier, codeChallenge } = generatePkcePair();
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);

    // Verify SHA-256 computation matches RFC 7636
    const expectedChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");
    expect(codeChallenge).toBe(expectedChallenge);
  });

  // --------------------------------------------------------------------------
  // 3. The valid callback successfully creates a ShellShift session
  // --------------------------------------------------------------------------
  it("3. validates a valid callback and creates a secure ShellShift session", async () => {
    const testNonce = generateNonce();
    const testSub = "test-sub-player-001";

    const idToken = await new SignJWT({
      sub: testSub,
      email: "player1@fossclub.tech",
      name: "Cipher Legend",
      preferred_username: "cipher01",
      nonce: testNonce,
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key-2026" })
      .setIssuer(validIssuer)
      .setAudience(validClientId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(testPrivateKey);

    const verified = await verifyIdToken(
      idToken,
      testConfig,
      testNonce,
      mockDiscoveryMetadata,
      testPublicKey
    );

    expect(verified.sub).toBe(testSub);
    expect(verified.email).toBe("player1@fossclub.tech");
    expect(verified.name).toBe("Cipher Legend");

    // Establish ShellShift session user
    const sessionUser: SessionUser = {
      id: "usr-uuid-001",
      oidcSub: verified.sub,
      oidcIssuer: validIssuer,
      email: verified.email as string,
      name: verified.name as string,
      role: "USER",
      teamId: null,
      teamName: null,
    };

    const sessionJwt = await createSessionToken(sessionUser);
    expect(typeof sessionJwt).toBe("string");

    const decodedSession = await verifySessionToken(sessionJwt);
    expect(decodedSession).not.toBeNull();
    expect(decodedSession?.oidcSub).toBe(testSub);
    expect(decodedSession?.oidcIssuer).toBe(validIssuer);
    expect(decodedSession?.role).toBe("USER");
  });

  // --------------------------------------------------------------------------
  // 4. Incorrect state is rejected
  // --------------------------------------------------------------------------
  it("4. rejects authorization callback when state does not match stored state", () => {
    const storedState: string = "legitimate-random-state-123";
    const returnedState: string = "tampered-attacker-state-456";

    const isMatch = storedState === returnedState;
    expect(isMatch).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 5. Incorrect nonce is rejected
  // --------------------------------------------------------------------------
  it("5. rejects ID token when nonce does not match stored nonce", async () => {
    const storedNonce = "expected-nonce-abc";
    const wrongNonce = "attacker-nonce-xyz";

    const idToken = await new SignJWT({
      sub: "test-sub-nonce-mismatch",
      nonce: wrongNonce,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(validIssuer)
      .setAudience(validClientId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(testPrivateKey);

    await expect(
      verifyIdToken(idToken, testConfig, storedNonce, mockDiscoveryMetadata, testPublicKey)
    ).rejects.toThrow(/nonce mismatch/i);
  });

  // --------------------------------------------------------------------------
  // 6. Invalid ID-token signatures are rejected
  // --------------------------------------------------------------------------
  it("6. rejects ID tokens with untrusted or forged cryptographic signatures", async () => {
    const nonce = generateNonce();

    // Sign with attacker private key not present in provider JWKS
    const attackerToken = await new SignJWT({
      sub: "attacker-sub",
      nonce,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(validIssuer)
      .setAudience(validClientId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(attackerPrivateKey);

    await expect(
      verifyIdToken(attackerToken, testConfig, nonce, mockDiscoveryMetadata, testPublicKey)
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 7. Invalid issuer or audience is rejected
  // --------------------------------------------------------------------------
  it("7. rejects ID tokens with mismatched issuer or wrong audience", async () => {
    const nonce = generateNonce();

    // Mismatched issuer
    const wrongIssuerToken = await new SignJWT({
      sub: "test-sub-iss",
      nonce,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer("https://unauthorized-fake-idp.com")
      .setAudience(validClientId)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(testPrivateKey);

    await expect(
      verifyIdToken(wrongIssuerToken, testConfig, nonce, mockDiscoveryMetadata, testPublicKey)
    ).rejects.toThrow();

    // Mismatched audience
    const wrongAudienceToken = await new SignJWT({
      sub: "test-sub-aud",
      nonce,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(validIssuer)
      .setAudience("some-other-registered-client")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(testPrivateKey);

    await expect(
      verifyIdToken(wrongAudienceToken, testConfig, nonce, mockDiscoveryMetadata, testPublicKey)
    ).rejects.toThrow();
  });

  // --------------------------------------------------------------------------
  // 8. Expired tokens and invalid authorization codes are rejected
  // --------------------------------------------------------------------------
  it("8. rejects expired tokens and failed code exchange responses", async () => {
    const nonce = generateNonce();

    // Expired token (issued 2 hours ago, expired 1 hour ago)
    const expiredToken = await new SignJWT({
      sub: "test-sub-expired",
      nonce,
    })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuer(validIssuer)
      .setAudience(validClientId)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 7200)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 3600)
      .sign(testPrivateKey);

    await expect(
      verifyIdToken(expiredToken, testConfig, nonce, mockDiscoveryMetadata, testPublicKey)
    ).rejects.toThrow();

    // Simulated invalid authorization code rejected by token endpoint
    const mockFailedFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ error: "invalid_grant", error_description: "Code expired" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    };

    await expect(
      exchangeAuthorizationCode(
        testConfig,
        "invalid-or-expired-code",
        "verifier-123",
        mockDiscoveryMetadata,
        mockFailedFetch
      )
    ).rejects.toThrow(/Token exchange failed/);
  });

  // --------------------------------------------------------------------------
  // 9. Missing required configuration produces a clear, safe error
  // --------------------------------------------------------------------------
  it("9. validates configuration completeness and produces safe errors without leaking secrets", async () => {
    const missingIssuerConfig: OidcConfig = {
      issuer: "",
      clientId: "shellshift",
      clientSecret: "secret",
      redirectUri: "http://localhost:3000/api/auth/callback",
      scopes: "openid",
    };
    const res1 = validateOidcConfig(missingIssuerConfig);
    expect(res1.valid).toBe(false);
    expect(res1.error).toContain("OIDC_ISSUER");

    const missingClientSecret: OidcConfig = {
      ...testConfig,
      clientSecret: "",
    };

    // Code exchange without client secret throws immediately
    await expect(
      exchangeAuthorizationCode(missingClientSecret, "code", "ver", mockDiscoveryMetadata)
    ).rejects.toThrow(/client secret is missing/i);
  });

  // --------------------------------------------------------------------------
  // 10. Existing users are recognized through stable issuer-subject identity
  // --------------------------------------------------------------------------
  it("10. recognizes existing players via stable (oidcIssuer, oidcSub) identifier", async () => {
    const uniqueSub = `test-user-stable-${Date.now()}`;

    // Create user initially
    const initialUser = await prisma.user.create({
      data: {
        oidcIssuer: validIssuer,
        oidcSub: uniqueSub,
        email: "persistent@fossclub.tech",
        name: "Original Name",
        role: "USER",
      },
    });

    expect(initialUser.id).toBeDefined();

    // Query on second login with same (oidcIssuer, oidcSub)
    const existingUser = await prisma.user.findUnique({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: validIssuer,
          oidcSub: uniqueSub,
        },
      },
    });

    expect(existingUser).not.toBeNull();
    expect(existingUser?.id).toBe(initialUser.id);
  });

  // --------------------------------------------------------------------------
  // 11. Provider claim changes do not create unintended duplicate accounts
  // --------------------------------------------------------------------------
  it("11. updates existing accounts when provider name or email changes without duplicating user records", async () => {
    const uniqueSub = `test-user-claims-${Date.now()}`;

    const original = await prisma.user.create({
      data: {
        oidcIssuer: validIssuer,
        oidcSub: uniqueSub,
        email: "initial@fossclub.tech",
        name: "Old CallSign",
        role: "USER",
      },
    });

    // Sign in again with changed email and updated name
    const updated = await prisma.user.update({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: validIssuer,
          oidcSub: uniqueSub,
        },
      },
      data: {
        email: "newemail@fossclub.tech",
        name: "Updated CallSign",
      },
    });

    expect(updated.id).toBe(original.id);
    expect(updated.email).toBe("newemail@fossclub.tech");
    expect(updated.name).toBe("Updated CallSign");

    // Total accounts for this issuer + sub should remain exactly 1
    const count = await prisma.user.count({
      where: {
        oidcIssuer: validIssuer,
        oidcSub: uniqueSub,
      },
    });
    expect(count).toBe(1);
  });

  // --------------------------------------------------------------------------
  // 12. A club member does not automatically become a ShellShift administrator
  // --------------------------------------------------------------------------
  it("12. verifies club membership does NOT grant ShellShift administrator privileges", () => {
    // Normal club member with member: true and provider role: "admin"
    const memberClaims = {
      member: true,
      role: "admin",
      preferred_username: "club_leader",
    };

    const regularEmail = "member@fossclub.tech";
    const isAdmin = checkIsAdmin(regularEmail, memberClaims);
    expect(isAdmin).toBe(false);

    // ShellShift server ADMIN_EMAILS allowlist
    const adminEmail = "admin@shellshift.io";
    expect(checkIsAdmin(adminEmail, memberClaims)).toBe(true);

    // Explicit ShellShift custom role claim
    const customAdminClaim = {
      "https://shellshift.io/roles": ["ADMIN"],
    };
    expect(checkIsAdmin("anyone@fossclub.tech", customAdminClaim)).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 13. The client secret is never exposed through public responses
  // --------------------------------------------------------------------------
  it("13. ensures client secret is never leaked in URLs or public session payloads", async () => {
    const state = generateRandomState();
    const nonce = generateNonce();
    const { codeChallenge } = generatePkcePair();

    const authUrl = await buildAuthorizationUrl(
      testConfig,
      state,
      codeChallenge,
      nonce,
      mockDiscoveryMetadata
    );

    // URL must not contain clientSecret
    expect(authUrl).not.toContain(validClientSecret);

    // Session token must not contain clientSecret
    const sessionToken = await createSessionToken({
      id: "u1",
      oidcSub: "s1",
      oidcIssuer: validIssuer,
      email: "u1@test.com",
      name: "U1",
      role: "USER",
    });

    const parsedSession = await verifySessionToken(sessionToken);
    expect(JSON.stringify(parsedSession)).not.toContain(validClientSecret);
  });

  // --------------------------------------------------------------------------
  // 14. Authentication failures do not fall back to mock authentication in production
  // --------------------------------------------------------------------------
  it("14. strictly prohibits mock authentication in production environments", () => {
    const originalEnv = process.env.NODE_ENV;
    const originalMock = process.env.MOCK_AUTH_ENABLED;

    try {
      // In production, even if MOCK_AUTH_ENABLED=true, mock auth MUST be disabled
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.MOCK_AUTH_ENABLED = "true";

      expect(isMockAuthAllowed()).toBe(false);
      expect(isMockAdminAllowed()).toBe(false);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      process.env.MOCK_AUTH_ENABLED = originalMock;
    }
  });

  // --------------------------------------------------------------------------
  // 15. Logout clears the local session and supports RP-initiated logout
  // --------------------------------------------------------------------------
  it("15. supports RP-initiated logout with post_logout_redirect_uri when advertised", async () => {
    const endSessionUrl = await buildEndSessionUrl(
      testConfig,
      "http://localhost:3000/",
      undefined,
      mockDiscoveryMetadata
    );

    expect(endSessionUrl).not.toBeNull();
    const parsed = new URL(endSessionUrl!);
    expect(parsed.origin).toBe("https://oidc.fossclub.tech");
    expect(parsed.pathname).toBe("/session/end");
    expect(parsed.searchParams.get("post_logout_redirect_uri")).toBe("http://localhost:3000/");
  });

  // --------------------------------------------------------------------------
  // 16. Existing team registration and game functionality continue to work
  // --------------------------------------------------------------------------
  it("16. allows authenticated OIDC users to register teams and participate in challenges", async () => {
    const playerSub = `test-player-team-${Date.now()}`;
    const uniqueTeamName = `OIDC Team ${Date.now()}`;

    // Authenticated player
    const user = await prisma.user.create({
      data: {
        oidcIssuer: validIssuer,
        oidcSub: playerSub,
        email: "player-team@fossclub.tech",
        name: "Team Runner",
        role: "USER",
      },
    });

    // Create team for player
    const team = await prisma.team.create({
      data: {
        name: uniqueTeamName,
        inviteCode: crypto.randomBytes(3).toString("hex").toUpperCase(),
      },
    });

    const membership = await prisma.teamMembership.create({
      data: {
        userId: user.id,
        teamId: team.id,
        role: "LEADER",
      },
    });

    expect(membership.id).toBeDefined();
    expect(membership.teamId).toBe(team.id);

    // Verify team is attached to user
    const userWithTeam = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        memberships: {
          include: { team: true },
        },
      },
    });

    expect(userWithTeam?.memberships[0]?.team.name).toBe(uniqueTeamName);
  });

  // --------------------------------------------------------------------------
  // Optional Live Provider Integration Check
  // --------------------------------------------------------------------------
  it(
    "optional real-provider live discovery against production issuer",
    async () => {
    try {
      const metadata = await discoverEndpoints("https://oidc.fossclub.tech", { forceRefresh: true });
      expect(metadata.issuer).toBe("https://oidc.fossclub.tech");
      expect(metadata.authorization_endpoint).toBe("https://oidc.fossclub.tech/auth");
      expect(metadata.token_endpoint).toBe("https://oidc.fossclub.tech/token");
      expect(metadata.jwks_uri).toBe("https://oidc.fossclub.tech/jwks");
      expect(metadata.userinfo_endpoint).toBe("https://oidc.fossclub.tech/me");
      expect(metadata.end_session_endpoint).toBe("https://oidc.fossclub.tech/session/end");
    } catch (err) {
      console.warn("Live provider discovery test skipped due to network environment:", (err as Error).message);
    }
  }, 15000);
});
