import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST(request: Request) {
  await clearSessionCookie();
  const { searchParams } = new URL(request.url);
  const redirectUrl = searchParams.get("redirect") || "/";
  return NextResponse.redirect(new URL(redirectUrl, request.url));
}
