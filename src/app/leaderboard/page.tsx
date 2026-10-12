import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Trophy } from "lucide-react";
import { LeaderboardView, LeaderboardEntry } from "./LeaderboardView";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();

  const totalChallenges = await prisma.challenge.count({
    where: { isPublished: true },
  });

  const allRuns = await prisma.run.findMany({
    where: {
      status: "COMPLETED",
      isRanked: true,
    },
    include: {
      user: true,
    },
    orderBy: [{ completedAt: "asc" }],
  });

  interface TeamAgg extends LeaderboardEntry {
    challenges: Record<string, { score: number; durationMs: number }>;
  }

  const teamMap = new Map<string, TeamAgg>();

  for (const r of allRuns) {
    if (!r.userId || !r.user) continue;
    if (!teamMap.has(r.userId)) {
      teamMap.set(r.userId, {
        teamId: r.userId,
        teamName: r.user.name,
        totalScore: 0,
        challengesCompleted: 0,
        aggregateDurationMs: 0,
        lastCompletionMs: r.completedAt ? new Date(r.completedAt).getTime() : 0,
        challenges: {},
      });
    }

    const t = teamMap.get(r.userId)!;
    if (!t.challenges[r.challengeId] || r.finalScore > t.challenges[r.challengeId].score) {
      if (t.challenges[r.challengeId]) {
        t.totalScore -= t.challenges[r.challengeId].score;
        t.aggregateDurationMs -= t.challenges[r.challengeId].durationMs;
      } else {
        t.challengesCompleted += 1;
      }

      t.challenges[r.challengeId] = {
        score: r.finalScore,
        durationMs: r.durationMs || 0,
      };

      t.totalScore += r.finalScore;
      t.aggregateDurationMs += r.durationMs || 0;
      const compMs = r.completedAt ? new Date(r.completedAt).getTime() : 0;
      t.lastCompletionMs = Math.max(t.lastCompletionMs, compMs);
    }
  }

  const entries: LeaderboardEntry[] = Array.from(teamMap.values()).map((t) => ({
    teamId: t.teamId,
    teamName: t.teamName,
    totalScore: t.totalScore,
    challengesCompleted: t.challengesCompleted,
    aggregateDurationMs: t.aggregateDurationMs,
    lastCompletionMs: t.lastCompletionMs,
  }));

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#27272a] gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              Competition Leaderboard
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Live tournament standings calculated from server-verified challenge runs.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono self-start sm:self-auto">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Tournament
            </span>
            <span className="text-[#a1a1aa] bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded">
              {entries.length} Players Ranked
            </span>
          </div>
        </div>

        <LeaderboardView
          entries={entries}
          totalChallenges={totalChallenges}
          currentTeamId={session?.id}
        />
      </main>
    </div>
  );
}
