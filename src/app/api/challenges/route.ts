import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ClueItem } from "@/lib/challenges/seedData";

export function sanitizeChallengeForPlayer(challenge: any) {
  let clues: ClueItem[] = [];
  try {
    clues = JSON.parse(challenge.clues);
  } catch {
    clues = [];
  }

  // Strip private answer keys from player view
  const safeClues = clues.map((c) => ({
    id: c.id,
    title: c.title,
    type: c.type,
    encodedContent: c.encodedContent,
  }));

  let objConfig = { description: "", rules: [] as any[] };
  try {
    objConfig = JSON.parse(challenge.objectiveConfig);
  } catch {}

  const safeObjective = {
    description: objConfig.description,
    rules: (objConfig.rules || []).map((r: any) => ({
      description: r.description,
    })),
  };

  return {
    id: challenge.id,
    slug: challenge.slug,
    title: challenge.title,
    description: challenge.description,
    difficulty: challenge.difficulty,
    order: challenge.order,
    timeLimitSeconds: challenge.timeLimitSeconds,
    clues: safeClues,
    objective: safeObjective,
    hintsCount: challenge.hints?.length || 0,
  };
}

export async function GET() {
  const challenges = await prisma.challenge.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
    include: {
      hints: {
        select: { id: true, title: true, penaltySeconds: true, pointPenalty: true, order: true },
      },
    },
  });

  const sanitized = challenges.map((c) => ({
    ...sanitizeChallengeForPlayer(c),
    hints: c.hints,
  }));

  return NextResponse.json({ total: sanitized.length, challenges: sanitized });
}
