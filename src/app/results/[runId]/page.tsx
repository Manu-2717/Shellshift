import Link from "next/link";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "@/app/api/leaderboard/route";
import {
  Trophy,
  Clock,
  Compass,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;
  const session = await getSession();

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      team: true,
      challenge: true,
      hintUsages: { include: { hint: true } },
    },
  });

  if (!run) {
    notFound();
  }

  // Calculate Rank on leaderboard
  const hintPenalty = run.hintUsages.reduce((sum, u) => sum + u.hint.penaltySeconds, 0);
  const effectiveDurationMs = (run.durationMs || 0) + hintPenalty * 1000;

  // Find all faster completed runs for this challenge
  const fasterRunsCount = await prisma.run.count({
    where: {
      challengeId: run.challengeId,
      status: "COMPLETED",
      durationMs: {
        lt: run.durationMs || 999999999,
      },
    },
  });

  const rank = fasterRunsCount + 1;

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 w-full flex-1 space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400">
            <Trophy className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-xs uppercase font-bold text-emerald-400 tracking-widest">
              Server-Verified Completion
            </span>
            <h1 className="text-3xl font-extrabold text-white">
              {run.challenge.title}
            </h1>
            <p className="text-xs text-neutral-400">
              Completed by <span className="text-cyan-300 font-bold">{run.team.name}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Current Rank
            </span>
            <div className="text-3xl font-extrabold text-amber-400">
              #{rank}
            </div>
            <span className="text-[10px] text-neutral-400">on Global Leaderboard</span>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Authoritative Time
            </span>
            <div className="text-3xl font-extrabold text-emerald-400">
              {formatDuration(effectiveDurationMs)}
            </div>
            <span className="text-[10px] text-neutral-400">
              {hintPenalty > 0 ? `(Includes +${hintPenalty}s hint penalty)` : "Zero penalties"}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Commands Run
            </span>
            <div className="text-3xl font-extrabold text-cyan-400">
              {run.commandCount}
            </div>
            <span className="text-[10px] text-neutral-400">virtual shell executions</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="p-6 rounded-xl bg-[#121215] border border-neutral-800 space-y-4 text-xs">
          <h2 className="font-bold text-neutral-200 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Verification Timestamp Log
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-neutral-400">
            <div>
              <span className="text-neutral-500 block mb-0.5">Authoritative Start:</span>
              <span className="text-neutral-200 font-mono">
                {run.startedAt.toISOString()}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Authoritative Finish:</span>
              <span className="text-neutral-200 font-mono">
                {run.completedAt?.toISOString() || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Raw Execution Duration:</span>
              <span className="text-neutral-200 font-mono">
                {run.durationMs ? `${(run.durationMs / 1000).toFixed(3)}s` : "N/A"}
              </span>
            </div>
            <div>
              <span className="text-neutral-500 block mb-0.5">Hint Usages:</span>
              <span className="text-neutral-200 font-mono">
                {run.hintUsages.length > 0
                  ? `${run.hintUsages.length} hints (+${hintPenalty}s)`
                  : "0 hints unlocked"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/lobby"
            className="px-6 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Compass className="w-4 h-4" />
            Back to Competition Lobby
          </Link>
          <Link
            href="/leaderboard"
            className="px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center gap-2"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            View Full Leaderboard
          </Link>
        </div>
      </main>
    </div>
  );
}
