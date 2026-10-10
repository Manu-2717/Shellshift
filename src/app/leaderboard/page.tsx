import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "../api/leaderboard/route";
import { Trophy, Medal, Users } from "lucide-react";

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
              <Trophy className="w-6 h-6 text-amber-400" />
              Competition Leaderboard
            </h1>
            <p className="text-xs text-neutral-400">
              Verified ranking ordered by authoritative server timestamps.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 rounded-lg border transition-colors ${
                !challengeSlug
                  ? "bg-neutral-800 text-cyan-400 border-neutral-700 font-bold"
                  : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
              }`}
            >
              All Challenges
            </Link>
            {challenges.map((c) => (
              <Link
                key={c.id}
                href={`/leaderboard?challengeSlug=${c.slug}`}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${
                  challengeSlug === c.slug
                    ? "bg-neutral-800 text-cyan-400 border-neutral-700 font-bold"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
              >
                Level {c.order}
              </Link>
            ))}
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
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
                {formattedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-neutral-500 italic">
                      No completed runs recorded yet for this selection. Start a challenge in the lobby to set a record!
                    </td>
                  </tr>
                ) : (
                  formattedEntries.map((entry) => {
                    return (
                      <tr
                        key={entry.runId}
                        className={`hover:bg-neutral-800/40 transition-colors ${
                          entry.rank === 1 ? "bg-amber-500/5" : ""
                        }`}
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
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{entry.teamName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-neutral-300">
                          <div className="flex items-center gap-2">
                            <span>{entry.challengeTitle}</span>
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                                entry.challengeDifficulty === "EASY"
                                  ? "bg-emerald-950 text-emerald-300"
                                  : entry.challengeDifficulty === "MEDIUM"
                                  ? "bg-amber-950 text-amber-300"
                                  : "bg-rose-950 text-rose-300"
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
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
