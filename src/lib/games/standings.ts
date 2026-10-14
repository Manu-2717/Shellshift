import { prisma } from "@/lib/prisma";

export interface StandingsRun {
  userId: string;
  userName: string;
  challengeId: string;
  finalScore: number;
  durationMs: number | null;
  completedAt: Date | null;
}

export function rankIndividualRuns(runs: StandingsRun[]) {
  const users = new Map<string, { userId: string; userName: string; totalScore: number; challengesCompleted: number; aggregateDurationMs: number; lastCompletionMs: number; best: Map<string, StandingsRun> }>();
  for (const run of runs) {
    let row = users.get(run.userId);
    if (!row) {
      row = { userId: run.userId, userName: run.userName, totalScore: 0, challengesCompleted: 0, aggregateDurationMs: 0, lastCompletionMs: 0, best: new Map() };
      users.set(run.userId, row);
    }
    const previous = row.best.get(run.challengeId);
    if (!previous || run.finalScore > previous.finalScore) row.best.set(run.challengeId, run);
  }
  const rows = [...users.values()].map((row) => {
    for (const run of row.best.values()) {
      row.totalScore += run.finalScore;
      row.aggregateDurationMs += run.durationMs || 0;
      row.lastCompletionMs = Math.max(row.lastCompletionMs, run.completedAt?.getTime() || 0);
    }
    row.totalScore = Math.round(row.totalScore * 100) / 100;
    row.challengesCompleted = row.best.size;
    return row;
  });
  rows.sort((a, b) => b.totalScore - a.totalScore || b.challengesCompleted - a.challengesCompleted || a.aggregateDurationMs - b.aggregateDurationMs || a.lastCompletionMs - b.lastCompletionMs);
  return rows.map(({ best: _best, ...row }, index) => ({ ...row, rank: index + 1 }));
}

export async function getGameStandings(eventId: string, viewerId?: string) {
  let game = await prisma.event.findFirst({
    where: {
      OR: [{ id: eventId }, { slug: eventId }],
    },
  });
  if (!game) return { error: "Game not found.", standings: [] };

  const now = new Date();
  if (game.status === "PUBLISHED" && game.endTime && now >= game.endTime) {
    game = await prisma.event.update({
      where: { id: game.id },
      data: { status: "ENDED" },
    });
  }

  if (game.leaderboardVisibility === "HIDDEN" || (game.leaderboardVisibility === "AFTER_END" && game.status !== "ENDED" && game.status !== "ARCHIVED")) return { error: "Standings are not available yet.", standings: [] };
  const runs = await prisma.run.findMany({ where: { eventId: game.id, status: "COMPLETED", isRanked: true, userId: { not: null }, legacyIndividualEligible: false }, include: { user: { select: { name: true } } } });
  const standings = rankIndividualRuns(runs.flatMap((run) => run.userId && run.user ? [{ userId: run.userId, userName: run.user.name, challengeId: run.challengeId, finalScore: run.finalScore, durationMs: run.durationMs, completedAt: run.completedAt }] : []));
  return { standings: standings.map((row) => ({ ...row, isViewer: row.userId === viewerId })) };
}

