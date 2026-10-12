/**
 * ShellShift - USAR FOSS OIDC Provider Diagnostics & Discovery Inspector
 *
 * Checks OIDC provider reachability, dynamic metadata, cryptographic capabilities,
 * and client configuration alignment without exposing confidential credentials.
 *
 * Usage:
 *   npx tsx scripts/check-oidc.ts
 *   npm run oidc:check
 */

import fs from "fs";
import path from "path";

// Load .env file if running via tsx directly
function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile();

interface DiscoveryDocument {
  issuer: string;
  authorization_endpoint?: string;
  token_endpoint?: string;
  jwks_uri?: string;
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

interface JwksDocument {
  keys?: Array<{
    kid?: string;
    kty?: string;
    alg?: string;
    use?: string;
  }>;
}

async function runOidcDiagnostics() {
  console.log("\n=======================================================");
  console.log("   ShellShift - USAR FOSS OIDC Diagnostic Utility");
  console.log("=======================================================\n");

  const issuer = (process.env.OIDC_ISSUER || "https://oidc.fossclub.tech").replace(/\/+$/, "");
  const clientId = process.env.OIDC_CLIENT_ID || "shellshift";
  const clientSecret = process.env.OIDC_CLIENT_SECRET || "";
  const redirectUri = process.env.OIDC_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
  const scopes = process.env.OIDC_SCOPES || "openid profile email club";

  console.log("--- Local Client Configuration ---");
  console.log(`• Configured Issuer : ${issuer}`);
  console.log(`• Client ID         : ${clientId}`);
  console.log(`• Client Secret     : ${clientSecret ? (clientSecret === "replace-with-registered-client-secret" ? "[DEFAULT PLACEHOLDER - Secret not yet provisioned]" : `[CONFIGURED - length: ${clientSecret.length} chars]`) : "[MISSING]"}`);
  console.log(`• Redirect URI      : ${redirectUri}`);
  console.log(`• Requested Scopes  : ${scopes}`);
  console.log("");

  // Validate callback route alignment
  try {
    const callbackUrl = new URL(redirectUri);
    if (!callbackUrl.pathname.endsWith("/api/auth/callback")) {
      console.warn(`⚠️ WARNING: Redirect URI path is "${callbackUrl.pathname}", expected "/api/auth/callback".`);
    } else {
      console.log(`✓ Callback path aligned with ShellShift route: /api/auth/callback`);
    }
  } catch (err) {
    console.error(`❌ ERROR: Invalid OIDC_REDIRECT_URI: ${(err as Error).message}`);
    process.exit(1);
  }

  // 1. Discovery Reachability Check
  const discoveryUrl = `${issuer}/.well-known/openid-configuration`;
  console.log(`\n--- Fetching Discovery Document ---`);
  console.log(`Querying: ${discoveryUrl} ...`);

  let metadata: DiscoveryDocument;
  const startTime = Date.now();
  try {
    const res = await fetch(discoveryUrl, {
      headers: { Accept: "application/json" },
    });
    const duration = Date.now() - startTime;

    if (!res.ok) {
      console.error(`❌ Discovery failed with HTTP ${res.status} (${res.statusText}) in ${duration}ms`);
      process.exit(1);
    }

    metadata = (await res.json()) as DiscoveryDocument;
    console.log(`✓ Discovery successful! (${res.status} OK in ${duration}ms)`);
  } catch (err) {
    console.error(`❌ Network error fetching discovery document: ${(err as Error).message}`);
    console.error(`  Ensure the OIDC provider is running and reachable at "${issuer}".`);
    process.exit(1);
  }

  // 2. Metadata Protocol & Endpoint Verification
  console.log("\n--- Discovered Protocol Metadata ---");
  console.log(`• Discovered Issuer : ${metadata.issuer}`);
  if (metadata.issuer.replace(/\/+$/, "") !== issuer) {
    console.error(`❌ MISMATCH: Configured issuer (${issuer}) does not match declared issuer (${metadata.issuer})!`);
  } else {
    console.log(`  ✓ Issuer matches configured value`);
  }

  console.log(`• Authorization URI : ${metadata.authorization_endpoint || "❌ MISSING"}`);
  console.log(`• Token Endpoint    : ${metadata.token_endpoint || "❌ MISSING"}`);
  console.log(`• JWKS URI          : ${metadata.jwks_uri || "❌ MISSING"}`);
  console.log(`• UserInfo Endpoint : ${metadata.userinfo_endpoint || "(Not advertised)"}`);
  console.log(`• End-Session URI   : ${metadata.end_session_endpoint || "(Not advertised)"}`);
  console.log("");

  // Capabilities
  console.log("--- Supported Capabilities ---");
  console.log(`• Response Types    : ${JSON.stringify(metadata.response_types_supported || [])}`);
  console.log(`• PKCE Methods      : ${JSON.stringify(metadata.code_challenge_methods_supported || [])}`);
  console.log(`• Signing Algs (ID) : ${JSON.stringify(metadata.id_token_signing_alg_values_supported || [])}`);
  console.log(`• Client Auth Modes : ${JSON.stringify(metadata.token_endpoint_auth_methods_supported || [])}`);
  console.log(`• Scopes Advertised : ${JSON.stringify(metadata.scopes_supported || [])}`);

  // Check required features
  const hasCodeFlow = metadata.response_types_supported?.includes("code");
  const hasS256 = metadata.code_challenge_methods_supported?.includes("S256");
  const hasRS256 = metadata.id_token_signing_alg_values_supported?.includes("RS256");
  const hasBasicAuth = metadata.token_endpoint_auth_methods_supported?.includes("client_secret_basic");

  console.log("");
  console.log(hasCodeFlow ? "✓ Authorization Code Flow supported" : "⚠️ 'code' response type not found");
  console.log(hasS256 ? "✓ PKCE S256 supported" : "❌ PKCE S256 not advertised");
  console.log(hasRS256 ? "✓ RS256 token signing supported" : "❌ RS256 not advertised");
  console.log(hasBasicAuth ? "✓ client_secret_basic authentication supported" : "⚠️ client_secret_basic not found");

  // 3. JWKS Verification
  if (metadata.jwks_uri) {
    console.log("\n--- Checking JWKS Public Key Endpoint ---");
    try {
      const jwksRes = await fetch(metadata.jwks_uri, {
        headers: { Accept: "application/json" },
      });
      if (jwksRes.ok) {
        const jwksData = (await jwksRes.json()) as JwksDocument;
        const keyCount = jwksData.keys?.length || 0;
        console.log(`✓ JWKS reachable: Found ${keyCount} key(s)`);
        jwksData.keys?.forEach((k, idx) => {
          console.log(`  Key [${idx + 1}]: kid="${k.kid}", kty="${k.kty}", alg="${k.alg || 'any'}", use="${k.use || 'sig'}"`);
        });
      } else {
        console.warn(`⚠️ JWKS endpoint returned HTTP ${jwksRes.status}`);
      }
    } catch (err) {
      console.warn(`⚠️ Failed to fetch JWKS: ${(err as Error).message}`);
    }
  }

  // 4. Provider Registration Summary & Guidance
  console.log("\n=======================================================");
  console.log("   Provider Registration Checklist");
  console.log("=======================================================");
  console.log("A successful discovery check confirms protocol reachability,");
  console.log("but DOES NOT mean client registration has been completed.\n");
  console.log("To register ShellShift on the USAR FOSS OIDC provider:");
  console.log("1. Inside the OIDC repository (https://github.com/USAR-FOSS/OIDC):");
  console.log(`   npm run client:new -- ${clientId} \\`);
  console.log(`     --redirect ${redirectUri} \\`);
  console.log(`     --logout http://localhost:3000/ \\`);
  console.log(`     --name "ShellShift" \\`);
  console.log(`     --untrusted`);
  console.log("");
  console.log("2. The command updates clients.json and outputs a generated secret.");
  console.log(`3. Configure the secret on the provider deployment as: CLIENT_SECRET_${clientId.toUpperCase().replace(/-/g, "_")}`);
  console.log(`4. Configure the secret in ShellShift as: OIDC_CLIENT_SECRET=<the-secret>`);
  console.log("5. Commit and deploy the OIDC provider changes.");
  console.log("=======================================================\n");
}

runOidcDiagnostics().catch((err) => {
  console.error("Unhandled diagnostic error:", err);
  process.exit(1);
});
