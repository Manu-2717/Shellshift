import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  buildAuthorizationUrl,
  checkIsAdmin,
  generateNonce,
  generatePkcePair,
  generateRandomState,
  getOidcConfig,
  isMockAuthAllowed,
} from "@/lib/auth/oidc";
import { SessionUser, setSessionCookie } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const isMock = searchParams.get("mock") === "true";
  const roleParam = searchParams.get("role") || "user";
  const redirectTarget = searchParams.get("redirect") || "/lobby";

  // Check Mock Auth Mode
  if (isMock) {
    if (!isMockAuthAllowed()) {
      return NextResponse.json(
        { error: "Mock authentication is disabled in production environments." },
        { status: 403 }
      );
    }

    const isAdmin = roleParam.toLowerCase() === "admin";
    const mockEmail = isAdmin ? "admin@shellshift.io" : "player1@shellshift.io";
    const mockName = isAdmin ? "Admin Cipher Master" : "Cipher Runner 01";
    const mockSub = isAdmin ? "mock-sub-admin-001" : "mock-sub-user-001";
    const mockIssuer = "https://auth.shellshift.mock";

    let user = await prisma.user.findUnique({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: mockIssuer,
          oidcSub: mockSub,
        },
      },
      include: {
        memberships: {
          include: { team: true },
        },
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          oidcSub: mockSub,
          oidcIssuer: mockIssuer,
          email: mockEmail,
          name: mockName,
          role: isAdmin ? "ADMIN" : "USER",
        },
        include: {
          memberships: {
            include: { team: true },
          },
        },
      });
    }

    const activeMembership = user.memberships[0];

    const sessionUser: SessionUser = {
      id: user.id,
      oidcSub: user.oidcSub,
      oidcIssuer: user.oidcIssuer,
      email: user.email,
      name: user.name,
      role: (user.role as "USER" | "ADMIN") || (isAdmin ? "ADMIN" : "USER"),
      teamId: activeMembership?.teamId || null,
      teamName: activeMembership?.team?.name || null,
      teamRole: (activeMembership?.role as "LEADER" | "MEMBER") || null,
    };

    await setSessionCookie(sessionUser);

    const destination = !sessionUser.teamId ? "/register" : redirectTarget;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // Real OIDC Flow with PKCE
  const config = getOidcConfig();
  const state = generateRandomState();
  const nonce = generateNonce();
  const { codeVerifier, codeChallenge } = generatePkcePair();

  // Store PKCE verifier, state and nonce in secure cookies for callback validation
  const cookieStore = await cookies();
  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 600, // 10 minutes
    path: "/",
  };

  cookieStore.set("oidc_state", state, cookieOpts);
  cookieStore.set("oidc_nonce", nonce, cookieOpts);
  cookieStore.set("oidc_code_verifier", codeVerifier, cookieOpts);
  cookieStore.set("oidc_redirect_target", redirectTarget, cookieOpts);

  const authUrl = buildAuthorizationUrl(config, state, codeChallenge, nonce);
  return NextResponse.redirect(authUrl);
}
