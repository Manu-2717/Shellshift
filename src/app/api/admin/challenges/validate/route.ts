import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { validateChallengeDefinition } from "@/lib/challenges/validator";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const result = validateChallengeDefinition(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { valid: false, errors: ["Invalid JSON payload: " + (err as Error).message], warnings: [] },
      { status: 400 }
    );
  }
}
