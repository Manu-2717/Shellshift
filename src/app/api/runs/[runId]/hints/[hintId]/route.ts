import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string; hintId: string }> }
) {
  const { runId, hintId } = await params;
  const session = await getSession();

  if (!session || !session.teamId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const run = await prisma.run.findUnique({
    where: { id: runId },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  if (run.teamId !== session.teamId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Run belongs to another team." }, { status: 403 });
  }

  const hint = await prisma.hint.findUnique({
    where: { id: hintId },
  });

  if (!hint || hint.challengeId !== run.challengeId) {
    return NextResponse.json({ error: "Hint not found for this challenge." }, { status: 404 });
  }

  // Create or retrieve HintUsage
  const hintUsage = await prisma.hintUsage.upsert({
    where: {
      runId_hintId: {
        runId: run.id,
        hintId: hint.id,
      },
    },
    create: {
      runId: run.id,
      hintId: hint.id,
    },
    update: {},
  });

  return NextResponse.json({
    hint: {
      id: hint.id,
      title: hint.title,
      content: hint.content,
      penaltySeconds: hint.penaltySeconds,
      requestedAt: hintUsage.requestedAt,
    },
  });
}
