import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "../api/leaderboard/route";
import { Trophy, Medal, Users, Clock, Terminal } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ challengeSlug?: string }>;
}) {
  const { challengeSlug } = await searchParams;
  const session = await getSession();

  const challenges = await prisma.challenge.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });

  const selectedChallenge = challengeSlug
    ? challenges.find((c) => c.slug === challengeSlug)
    : null;

  const whereClause: any = {
    status: "COMPLETED",
    durationMs: { not: null },
  };

  if (selectedChallenge) {
    whereClause.challengeId = selectedChallenge.id;
  }

  const runs = await prisma.run.findMany({
    where: whereClause,
    orderBy: [
      { durationMs: "asc" },
      { completedAt: "asc" },
    ],
    include: {
      team: true,
      challenge: true,
      hintUsages: {
        include: { hint: true },
      },
    },
    take: 100,
  });

  const formattedEntries = runs
    .map((run) => {
      const hintPenalty = run.hintUsages.reduce((sum, u) => sum + u.hint.penaltySeconds, 0);
      const effectiveDurationMs = (run.durationMs || 0) + hintPenalty * 1000;
      return {
        runId: run.id,
        teamName: run.team.name,
        challengeTitle: run.challenge.title,
        challengeDifficulty: run.challenge.difficulty,
        rawDurationMs: run.durationMs || 0,
        hintPenalty,
        effectiveDurationMs,
        commandCount: run.commandCount,
        completedAt: run.completedAt,
      };
    })
    .sort((a, b) => a.effectiveDurationMs - b.effectiveDurationMs)
    .map((entry, idx) => ({ ...entry, rank: idx + 1 }));

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Trophy className="w-5 h-5 text-amber-400" />
              Competition Leaderboard
            </h1>
            <p className="text-xs text-neutral-400">
              Verified ranking ordered by authoritative server timestamps.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 rounded border transition-colors ${
                !challengeSlug
                  ? "bg-neutral-800 text-cyan-400 border-neutral-700 font-bold"
                  : "bg-[#121215] text-neutral-400 border-neutral-800 hover:text-white"
              }`}
            >
              All Challenges
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

        {/* Empty State */}
        {formattedEntries.length === 0 ? (
          <div className="bg-[#121215] border border-neutral-800 rounded-xl p-12 text-center space-y-3">
            <Trophy className="w-8 h-8 text-neutral-600 mx-auto" />
            <h3 className="text-sm font-bold text-neutral-300">No Verified Runs Yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Be the first team to decode the cipher, execute remapped commands, and establish a record on the board!
            </p>
            <Link
              href="/lobby"
              className="inline-block px-4 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors"
            >
              Enter Lobby & Start Race
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< 640px) */}
            <div className="sm:hidden space-y-3">
              {formattedEntries.map((entry) => (
                <div
                  key={entry.runId}
                  className="p-4 rounded-xl bg-[#121215] border border-neutral-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm font-mono">
                        {entry.rank === 1 ? (
                          <span className="text-amber-400 flex items-center gap-1">
                            <Medal className="w-4 h-4" /> #1
                          </span>
                        ) : entry.rank === 2 ? (
                          <span className="text-neutral-300 flex items-center gap-1">
                            <Medal className="w-4 h-4" /> #2
                          </span>
                        ) : entry.rank === 3 ? (
                          <span className="text-amber-600 flex items-center gap-1">
                            <Medal className="w-4 h-4" /> #3
                          </span>
                        ) : (
                          <span className="text-neutral-500">#{entry.rank}</span>
                        )}
                      </span>
                      <span className="font-bold text-white text-xs truncate max-w-[180px]">
                        {entry.teamName}
                      </span>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-400 font-mono">
                        {formatDuration(entry.effectiveDurationMs)}
                      </div>
                      {entry.hintPenalty > 0 && (
                        <div className="text-[10px] text-amber-400 font-mono">
                          +{entry.hintPenalty}s pen
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="truncate max-w-[160px]">{entry.challengeTitle}</span>
                    <span className="text-cyan-300 font-semibold flex items-center gap-1">
                      <Terminal className="w-3 h-3" />
                      {entry.commandCount} cmds
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Table (sm:block) */}
            <div className="hidden sm:block bg-[#121215] border border-neutral-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-xs">
                  <thead className="bg-[#18181b] border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4 w-16">Rank</th>
                      <th className="py-3 px-4">Team</th>
                      <th className="py-3 px-4">Challenge</th>
                      <th className="py-3 px-4">Time (Verified)</th>
                      <th className="py-3 px-4">Raw / Penalties</th>
                      <th className="py-3 px-4">Commands</th>
                      <th className="py-3 px-4">Finished At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-mono">
                    {formattedEntries.map((entry) => (
                      <tr
                        key={entry.runId}
                        className="hover:bg-neutral-800/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-bold">
                          {entry.rank === 1 ? (
                            <span className="flex items-center gap-1 text-amber-400 font-black">
                              <Medal className="w-4 h-4 text-amber-400" /> #1
                            </span>
                          ) : entry.rank === 2 ? (
                            <span className="flex items-center gap-1 text-neutral-300 font-bold">
                              <Medal className="w-4 h-4 text-neutral-300" /> #2
                            </span>
                          ) : entry.rank === 3 ? (
                            <span className="flex items-center gap-1 text-amber-600 font-bold">
                              <Medal className="w-4 h-4 text-amber-600" /> #3
                            </span>
                          ) : (
                            <span className="text-neutral-500">#{entry.rank}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{entry.teamName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-neutral-300">
                          <div className="flex items-center gap-2">
                            <span className="truncate max-w-[200px]">{entry.challengeTitle}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                                entry.challengeDifficulty === "EASY"
                                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                  : entry.challengeDifficulty === "MEDIUM"
                                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                                  : "bg-rose-950 text-rose-300 border border-rose-800"
                              }`}
                            >
                              {entry.challengeDifficulty}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                          {formatDuration(entry.effectiveDurationMs)}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-400 text-[11px]">
                          {(entry.rawDurationMs / 1000).toFixed(2)}s
                          {entry.hintPenalty > 0 && (
                            <span className="text-amber-400 ml-1.5 font-semibold">
                              (+{entry.hintPenalty}s)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-cyan-300 font-semibold">
                          {entry.commandCount}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-500 text-[11px]">
                          {entry.completedAt ? new Date(entry.completedAt).toLocaleTimeString() : "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
