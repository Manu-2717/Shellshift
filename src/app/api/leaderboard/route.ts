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

  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
    include: { winnerTeam: { select: { id: true, name: true } } },
  });

  const eventMode = event?.mode || "POINTS_TOURNAMENT";

  // CASE 1: Specific Challenge Leaderboard
  if (challengeId || challengeSlug) {
    const whereClause: any = {
      status: "COMPLETED",
      durationMs: { not: null },
    };

    if (challengeId) {
      whereClause.challengeId = challengeId;
    } else if (challengeSlug) {
      whereClause.challenge = { slug: challengeSlug };
    }

    const runs = await prisma.run.findMany({
      where: whereClause,
      orderBy: [{ finalScore: "desc" }, { durationMs: "asc" }, { completedAt: "asc" }],
      include: {
        team: { select: { id: true, name: true } },
        challenge: { select: { id: true, slug: true, title: true, difficulty: true } },
        hintUsages: {
          include: {
            hint: { select: { penaltySeconds: true, pointPenalty: true } },
          },
        },
      },
      take: 100,
    });

    const leaderboard = runs.map((run, index) => {
      const hintCount = run.hintUsages.length;
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
        formattedTime: formatDuration(run.durationMs),
        objectivePoints: run.objectivePoints,
        completionBonus: run.completionBonus,
        speedBonus: run.speedBonus,
        hintPenalty: run.hintPenalty,
        finalScore: run.finalScore,
        hintCount,
        commandCount: run.commandCount,
        completedAt: run.completedAt,
      };
    });

    return NextResponse.json({
      mode: eventMode,
      total: leaderboard.length,
      leaderboard,
    });
  }

  // CASE 2: Global Competition Leaderboard
  if (eventMode === "FIRST_FINISH") {
    // Mode A: FIRST_FINISH Live Race Leaderboard
    const runs = await prisma.run.findMany({
      where: {
        status: "COMPLETED",
        durationMs: { not: null },
      },
      orderBy: [{ durationMs: "asc" }, { completedAt: "asc" }],
      include: {
        team: { select: { id: true, name: true } },
        challenge: { select: { id: true, slug: true, title: true, difficulty: true } },
        hintUsages: true,
      },
    });

    // De-duplicate: 1 ranked run per team
    const seenTeams = new Set<string>();
    const uniqueRuns: typeof runs = [];
    for (const r of runs) {
      if (!seenTeams.has(r.teamId)) {
        seenTeams.add(r.teamId);
        uniqueRuns.push(r);
      }
    }

    const leaderboard = uniqueRuns.map((run, index) => {
      const isOfficialWinner = event?.winnerTeamId === run.teamId;
      return {
        rank: index + 1,
        runId: run.id,
        teamId: run.team.id,
        teamName: run.team.name,
        isWinner: isOfficialWinner,
        challengeTitle: run.challenge.title,
        difficulty: run.challenge.difficulty,
        rawDurationMs: run.durationMs,
        formattedTime: formatDuration(run.durationMs),
        finalScore: run.finalScore,
        commandCount: run.commandCount,
        hintsUsed: run.hintUsages.length,
        completedAt: run.completedAt,
      };
    });

    return NextResponse.json({
      mode: "FIRST_FINISH",
      event: {
        id: event?.id,
        name: event?.name,
        mode: "FIRST_FINISH",
        winnerTeam: event?.winnerTeam || null,
        winnerClaimedAt: event?.winnerClaimedAt || null,
      },
      winner: event?.winnerTeam
        ? {
            id: event.winnerTeam.id,
            name: event.winnerTeam.name,
            claimedAt: event.winnerClaimedAt,
          }
        : null,
      total: leaderboard.length,
      leaderboard,
    });
  }

  // Mode B: POINTS_TOURNAMENT Multi-Challenge Aggregation
  // Query all eligible completed runs
  const allCompletedRuns = await prisma.run.findMany({
    where: {
      status: "COMPLETED",
      isRanked: true,
    },
    include: {
      team: { select: { id: true, name: true } },
      challenge: { select: { id: true, slug: true, title: true, order: true } },
      hintUsages: true,
    },
    orderBy: [{ completedAt: "asc" }],
  });

  // Group by team and enforce 1 best score per challenge to prevent farming
  interface TeamAggregate {
    teamId: string;
    teamName: string;
    totalScore: number;
    challengesCompleted: number;
    aggregateDurationMs: number;
    hintsUsed: number;
    earliestCompletionMs: number;
    lastCompletionMs: number;
    challenges: Record<string, { score: number; durationMs: number; completedAt: string }>;
  }

  const teamMap = new Map<string, TeamAggregate>();

  for (const run of allCompletedRuns) {
    if (!teamMap.has(run.teamId)) {
      teamMap.set(run.teamId, {
        teamId: run.teamId,
        teamName: run.team.name,
        totalScore: 0,
        challengesCompleted: 0,
        aggregateDurationMs: 0,
        hintsUsed: 0,
        earliestCompletionMs: run.completedAt ? new Date(run.completedAt).getTime() : Infinity,
        lastCompletionMs: run.completedAt ? new Date(run.completedAt).getTime() : 0,
        challenges: {},
      });
    }

    const team = teamMap.get(run.teamId)!;
    const challengeKey = run.challengeId;

    // Enforce 1 recorded attempt per challenge: take highest score
    if (!team.challenges[challengeKey] || run.finalScore > team.challenges[challengeKey].score) {
      if (team.challenges[challengeKey]) {
        // Replace previous challenge score
        team.totalScore -= team.challenges[challengeKey].score;
        team.aggregateDurationMs -= team.challenges[challengeKey].durationMs;
      } else {
        team.challengesCompleted += 1;
      }

      team.challenges[challengeKey] = {
        score: run.finalScore,
        durationMs: run.durationMs || 0,
        completedAt: run.completedAt?.toISOString() || "",
      };

      team.totalScore += run.finalScore;
      team.aggregateDurationMs += run.durationMs || 0;
      team.hintsUsed += run.hintUsages.length;

      const compMs = run.completedAt ? new Date(run.completedAt).getTime() : 0;
      team.lastCompletionMs = Math.max(team.lastCompletionMs, compMs);
      team.earliestCompletionMs = Math.min(team.earliestCompletionMs, compMs);
    }
  }

  // Deterministic Ranking Sort according to official tournament tie-break protocols:
  // 1. Total verified points (descending)
  // 2. Challenges completed (descending)
  // 3. Aggregate elapsed duration (ascending)
  // 4. Hints used (ascending)
  // 5. Earliest verified final completion timestamp (ascending)
  const rankedTeams = Array.from(teamMap.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    if (b.challengesCompleted !== a.challengesCompleted) {
      return b.challengesCompleted - a.challengesCompleted;
    }
    if (a.aggregateDurationMs !== b.aggregateDurationMs) {
      return a.aggregateDurationMs - b.aggregateDurationMs;
    }
    if (a.hintsUsed !== b.hintsUsed) {
      return a.hintsUsed - b.hintsUsed;
    }
    return a.lastCompletionMs - b.lastCompletionMs;
  });

  const leaderboard = rankedTeams.map((t, idx) => ({
    rank: idx + 1,
    teamId: t.teamId,
    teamName: t.teamName,
    totalScore: t.totalScore,
    challengesCompleted: t.challengesCompleted,
    aggregateDurationMs: t.aggregateDurationMs,
    formattedTime: formatDuration(t.aggregateDurationMs),
    hintsUsed: t.hintsUsed,
    lastCompletionAt: t.lastCompletionMs ? new Date(t.lastCompletionMs).toISOString() : null,
  }));

  return NextResponse.json({
    mode: eventMode,
    event: {
      id: event?.id,
      name: event?.name,
      mode: eventMode,
      winnerTeam: event?.winnerTeam || null,
      winnerClaimedAt: event?.winnerClaimedAt || null,
    },
    total: leaderboard.length,
    leaderboard,
  });
}
