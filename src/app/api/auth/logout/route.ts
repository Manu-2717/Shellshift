import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { buildEndSessionUrl, getOidcConfig } from "@/lib/auth/oidc";

function sanitizeRedirectTarget(target?: string | null): string {
  if (!target || typeof target !== "string") {
    return "/";
  }
  if (target.startsWith("/") && !target.startsWith("//") && !target.includes("://")) {
    return target;
  }
  return "/";
}

async function handleLogout(request: Request) {
  // Clear local ShellShift application session
  await clearSessionCookie();

  const { searchParams } = new URL(request.url);
  const rawRedirect = searchParams.get("redirect") || "/";
  const redirectUrl = sanitizeRedirectTarget(rawRedirect);
  const federated = searchParams.get("federated") === "true" || searchParams.get("sso") === "true";

  if (federated) {
    try {
      const config = getOidcConfig();
      const postLogoutRedirect = new URL(redirectUrl, request.url).toString();
      const endSessionUrl = await buildEndSessionUrl(config, postLogoutRedirect);
      if (endSessionUrl) {
        return NextResponse.redirect(endSessionUrl);
      }
    } catch (err) {
      console.warn("Could not initiate federated OIDC end-session logout:", err);
    }
  }

  return NextResponse.redirect(new URL(redirectUrl, request.url));
}

export async function POST(request: Request) {
  return handleLogout(request);
}

export async function GET(request: Request) {
  return handleLogout(request);
}
