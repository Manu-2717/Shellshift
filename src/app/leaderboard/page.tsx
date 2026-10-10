import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "../api/leaderboard/route";
import { Trophy, Medal, Users, Clock, Terminal, Flag, Zap, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ challengeSlug?: string }>;
}) {
  const { challengeSlug } = await searchParams;
  const session = await getSession();

  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
    include: { winnerTeam: true },
  });

  const eventMode = event?.mode || "POINTS_TOURNAMENT";

  const challenges = await prisma.challenge.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });

  const selectedChallenge = challengeSlug
    ? challenges.find((c) => c.slug === challengeSlug)
    : null;

  // 1. If Single Challenge selected
  if (selectedChallenge) {
    const runs = await prisma.run.findMany({
      where: {
        challengeId: selectedChallenge.id,
        status: "COMPLETED",
        durationMs: { not: null },
      },
      orderBy: [{ finalScore: "desc" }, { durationMs: "asc" }, { completedAt: "asc" }],
      include: {
        team: true,
        challenge: true,
        hintUsages: true,
      },
      take: 100,
    });

    const entries = runs.map((run, idx) => ({
      rank: idx + 1,
      runId: run.id,
      teamName: run.team.name,
      challengeTitle: run.challenge.title,
      difficulty: run.challenge.difficulty,
      finalScore: run.finalScore,
      durationMs: run.durationMs || 0,
      commandCount: run.commandCount,
      hintsUsed: run.hintUsages.length,
      completedAt: run.completedAt,
    }));

    return (
      <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
        <Navbar user={session} />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                {selectedChallenge.title} Leaderboard
              </h1>
              <p className="text-xs text-neutral-400">
                Single-challenge rankings scored server-side and ordered by verified points & time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <Link
                href="/leaderboard"
                className="px-3 py-1.5 rounded border bg-[#121215] text-neutral-400 border-neutral-800 hover:text-white transition-colors"
              >
                All Challenges (Overall)
              </Link>
              {challenges.map((c) => (
                <Link
                  key={c.id}
                  href={`/leaderboard?challengeSlug=${c.slug}`}
                  className={`px-3 py-1.5 rounded border transition-colors ${
                    challengeSlug === c.slug
                      ? "bg-neutral-800 text-cyan-400 border-neutral-700 font-bold"
                      : "bg-[#121215] text-neutral-400 border-neutral-800 hover:text-white"
                  }`}
                >
                  Level {c.order}
                </Link>
              ))}
            </div>
          </div>

          {entries.length === 0 ? (
            <div className="bg-[#121215] border border-neutral-800 rounded-xl p-12 text-center space-y-3">
              <Trophy className="w-8 h-8 text-neutral-600 mx-auto" />
              <h3 className="text-sm font-bold text-neutral-300">No Verified Runs Yet</h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto">
                Be the first team to complete {selectedChallenge.title} to establish the high score!
              </p>
            </div>
          ) : (
            <div className="bg-[#121215] border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="bg-[#18181b] border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-16">Rank</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4">Verified Score</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Hints</th>
                      <th className="py-3 px-4">Commands</th>
                      <th className="py-3 px-4 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {entries.map((e) => (
                      <tr key={e.runId} className="hover:bg-neutral-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-bold">
                          {e.rank === 1 ? (
                            <span className="flex items-center gap-1 text-amber-400 font-black">
                              <Medal className="w-4 h-4 text-amber-400" /> #1
                            </span>
                          ) : (
                            <span className="text-neutral-500">#{e.rank}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{e.teamName}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-cyan-300 text-sm">
                          {e.finalScore} pts
                        </td>
                        <td className="py-3.5 px-4 font-bold text-emerald-400">
                          {formatDuration(e.durationMs)}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400">
                          {e.hintsUsed > 0 ? `${e.hintsUsed} used` : "None"}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300">{e.commandCount}</td>
                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/results/${e.runId}`}
                            className="text-xs text-neutral-400 hover:text-cyan-300 inline-flex items-center gap-1"
                          >
                            Score Breakdown
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // 2. Global Leaderboard: POINTS_TOURNAMENT Mode
  const allRuns = await prisma.run.findMany({
    where: {
      status: "COMPLETED",
      isRanked: true,
    },
    include: {
      team: true,
      challenge: true,
      hintUsages: true,
    },
    orderBy: [{ completedAt: "asc" }],
  });

  interface TeamAgg {
    teamId: string;
    teamName: string;
    totalScore: number;
    challengesCompleted: number;
    aggregateDurationMs: number;
    hintsUsed: number;
    lastCompletionMs: number;
    challenges: Record<string, { score: number; durationMs: number }>;
  }

  const teamMap = new Map<string, TeamAgg>();

  for (const r of allRuns) {
    if (!teamMap.has(r.teamId)) {
      teamMap.set(r.teamId, {
        teamId: r.teamId,
        teamName: r.team.name,
        totalScore: 0,
        challengesCompleted: 0,
        aggregateDurationMs: 0,
        hintsUsed: 0,
        lastCompletionMs: r.completedAt ? new Date(r.completedAt).getTime() : 0,
        challenges: {},
      });
    }

    const t = teamMap.get(r.teamId)!;
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
      t.hintsUsed += r.hintUsages.length;
      const compMs = r.completedAt ? new Date(r.completedAt).getTime() : 0;
      t.lastCompletionMs = Math.max(t.lastCompletionMs, compMs);
    }
  }

  // Deterministic Tournament Tie-Breakers:
  // 1. Total score DESC
  // 2. Challenges completed DESC
  // 3. Aggregate duration ASC
  // 4. Hints used ASC
  // 5. Last completion timestamp ASC
  const ranked = Array.from(teamMap.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.challengesCompleted !== a.challengesCompleted) return b.challengesCompleted - a.challengesCompleted;
    if (a.aggregateDurationMs !== b.aggregateDurationMs) return a.aggregateDurationMs - b.aggregateDurationMs;
    if (a.hintsUsed !== b.hintsUsed) return a.hintsUsed - b.hintsUsed;
    return a.lastCompletionMs - b.lastCompletionMs;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                Competition Leaderboard
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold uppercase">
                {eventMode === "FIRST_FINISH" ? "Live Race (First Finish)" : "Points Tournament"}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              {eventMode === "FIRST_FINISH"
                ? "First team to achieve full server-verified completion wins the race."
                : "Teams ranked by verified points across all challenges, with tie-breaks by speed and hint frugality."}
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded border bg-neutral-800 text-cyan-400 border-neutral-700 font-bold"
            >
              Overall Standings
            </Link>
            {challenges.map((c) => (
              <Link
                key={c.id}
                href={`/leaderboard?challengeSlug=${c.slug}`}
                className="px-3 py-1.5 rounded border bg-[#121215] text-neutral-400 border-neutral-800 hover:text-white transition-colors"
              >
                Level {c.order}
              </Link>
            ))}
          </div>
        </div>

        {/* Live Race Winner Banner (if FIRST_FINISH mode) */}
        {eventMode === "FIRST_FINISH" && event?.winnerTeam && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Medal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Official Race Winner
                </span>
                <h3 className="text-base font-extrabold text-white">
                  {event.winnerTeam.name}
                </h3>
              </div>
            </div>
            <div className="text-right text-xs text-neutral-400 font-mono">
              Claimed: {event.winnerClaimedAt ? new Date(event.winnerClaimedAt).toLocaleTimeString() : "--"}
            </div>
          </div>
        )}

        {/* Tournament Standings Table */}
        {ranked.length === 0 ? (
          <div className="bg-[#121215] border border-neutral-800 rounded-xl p-12 text-center space-y-3">
            <Trophy className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-300">No Verified Submissions Yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Enter the competition lobby and start solving cipher challenges to see your team on the board!
            </p>
            <Link
              href="/lobby"
              className="inline-block px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors"
            >
              Enter Lobby
            </Link>
          </div>
        ) : (
          <div className="bg-[#121215] border border-neutral-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-[#18181b] border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4 w-16">Rank</th>
                    <th className="py-3 px-4">Team</th>
                    <th className="py-3 px-4">Total Score</th>
                    <th className="py-3 px-4">Challenges Solved</th>
                    <th className="py-3 px-4">Total Time</th>
                    <th className="py-3 px-4">Hints Used</th>
                    <th className="py-3 px-4 text-right">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 font-mono">
                  {ranked.map((t, idx) => (
                    <tr key={t.teamId} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold">
                        {idx === 0 ? (
                          <span className="flex items-center gap-1 text-amber-400 font-black">
                            <Medal className="w-4 h-4 text-amber-400" /> #1
                          </span>
                        ) : idx === 1 ? (
                          <span className="flex items-center gap-1 text-neutral-300 font-bold">
                            <Medal className="w-4 h-4 text-neutral-300" /> #2
                          </span>
                        ) : idx === 2 ? (
                          <span className="flex items-center gap-1 text-amber-600 font-bold">
                            <Medal className="w-4 h-4 text-amber-600" /> #3
                          </span>
                        ) : (
                          <span className="text-neutral-500">#{idx + 1}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{t.teamName}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-extrabold text-cyan-300 text-sm">
                        {t.totalScore} pts
                      </td>

                      <td className="py-3.5 px-4 text-neutral-300">
                        {t.challengesCompleted} / {challenges.length}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-emerald-400">
                        {formatDuration(t.aggregateDurationMs)}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400">
                        {t.hintsUsed}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                          {idx === 0 ? "Gold Leader" : idx < 3 ? "Podium" : "Contender"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
