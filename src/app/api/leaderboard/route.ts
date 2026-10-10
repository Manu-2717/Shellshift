import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export function formatDuration(durationMs?: number | null): string {
  if (!durationMs && durationMs !== 0) return "--:--";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = durationMs % 1000;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${Math.floor(millis / 10).toString().padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const challengeId = searchParams.get("challengeId");
  const challengeSlug = searchParams.get("slug");

  const whereClause: any = {
    status: "COMPLETED",
    durationMs: { not: null },
  };

  if (challengeId) {
    whereClause.challengeId = challengeId;
  } else if (challengeSlug) {
    whereClause.challenge = { slug: challengeSlug };
  }

  // Fetch completed runs ordered by durationMs ascending, then completedAt ascending (tie breaker)
  const runs = await prisma.run.findMany({
    where: whereClause,
    orderBy: [
      { durationMs: "asc" },
      { completedAt: "asc" },
    ],
    include: {
      team: { select: { id: true, name: true } },
      challenge: { select: { id: true, slug: true, title: true, difficulty: true } },
      hintUsages: {
        include: {
          hint: { select: { penaltySeconds: true } },
        },
      },
    },
    take: 100,
  });

  const leaderboard = runs.map((run, index) => {
    const hintPenalty = run.hintUsages.reduce((sum, u) => sum + u.hint.penaltySeconds, 0);
    const effectiveDurationMs = (run.durationMs || 0) + hintPenalty * 1000;

    return {
      rank: index + 1,
      runId: run.id,
      teamId: run.team.id,
      teamName: run.team.name,
      challengeId: run.challenge.id,
      challengeSlug: run.challenge.slug,
      challengeTitle: run.challenge.title,
      difficulty: run.challenge.difficulty,
      rawDurationMs: run.durationMs,
      hintPenaltySeconds: hintPenalty,
      effectiveDurationMs,
      formattedTime: formatDuration(effectiveDurationMs),
      commandCount: run.commandCount,
      completedAt: run.completedAt,
    };
  });

  // Re-sort with penalty accounted for if needed, or maintain authoritative base time:
  leaderboard.sort((a, b) => a.effectiveDurationMs - b.effectiveDurationMs);
  leaderboard.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return NextResponse.json({
    total: leaderboard.length,
    leaderboard,
  });
}
