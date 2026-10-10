import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { checkIsAdmin, getOidcConfig } from "@/lib/auth/oidc";
import { SessionUser, setSessionCookie } from "@/lib/auth/session";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oidc_state")?.value;
  const storedVerifier = cookieStore.get("oidc_code_verifier")?.value;
  const redirectTarget = cookieStore.get("oidc_redirect_target")?.value || "/lobby";

  // Clean up transient auth cookies
  cookieStore.delete("oidc_state");
  cookieStore.delete("oidc_nonce");
  cookieStore.delete("oidc_code_verifier");
  cookieStore.delete("oidc_redirect_target");

  if (error) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(`OIDC Error: ${error}`)}`, request.url)
    );
  }

  if (!code || !state || !storedState || state !== storedState) {
    return NextResponse.redirect(
      new URL("/?error=Invalid+OIDC+State+or+authorization+code", request.url)
    );
  }

  const config = getOidcConfig();

  try {
    // Exchange code for tokens at the OIDC token endpoint
    const tokenEndpoint = `${config.issuer.replace(/\/+$/, "")}/token`;
    const tokenRes = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        code_verifier: storedVerifier || "",
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error("Token exchange failed:", errText);
      return NextResponse.redirect(
        new URL("/?error=Failed+to+exchange+authorization+code", request.url)
      );
    }

    const tokenData = await tokenRes.json();
    const userinfoEndpoint = `${config.issuer.replace(/\/+$/, "")}/userinfo`;

    let profile: { sub: string; email?: string | null; name?: string | null } = {
      sub: "oidc-sub",
      email: null,
      name: "Competitor",
    };
    if (tokenData.access_token) {
      const userinfoRes = await fetch(userinfoEndpoint, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (userinfoRes.ok) {
        profile = await userinfoRes.json();
      }
    }

    const oidcSub = profile.sub;
    const email: string | null = profile.email || null;
    const name = profile.name || (email ? email.split("@")[0] : "Competitor");
    const isAdmin = checkIsAdmin(email);

    let user = await prisma.user.findUnique({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: config.issuer,
          oidcSub,
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
          oidcSub,
          oidcIssuer: config.issuer,
          email,
          name,
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
  } catch (err) {
    console.error("OIDC callback handling exception:", err);
    return NextResponse.redirect(
      new URL("/?error=Authentication+processing+failure", request.url)
    );
  }
}
