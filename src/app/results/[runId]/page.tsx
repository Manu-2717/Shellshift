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
  Terminal as TerminalIcon,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { StartRunButton } from "../../lobby/StartButton";

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
      commandLogs: { orderBy: { timestamp: "asc" } },
    },
  });

  if (!run) {
    notFound();
  }

  const isCompleted = run.status === "COMPLETED";
  const isAbandoned = run.status === "ABANDONED";
  const isInProgress = run.status === "IN_PROGRESS";

  // Calculate Rank on leaderboard if completed
  const hintPenalty = run.hintUsages.reduce((sum, u) => sum + u.hint.penaltySeconds, 0);
  const effectiveDurationMs = (run.durationMs || 0) + hintPenalty * 1000;

  let rank = null;
  if (isCompleted && run.durationMs) {
    const fasterRunsCount = await prisma.run.count({
      where: {
        challengeId: run.challengeId,
        status: "COMPLETED",
        durationMs: {
          lt: run.durationMs,
        },
      },
    });
    rank = fasterRunsCount + 1;
  }

  const nextChallenge = await prisma.challenge.findFirst({
    where: {
      order: { gt: run.challenge.order },
      isPublished: true,
    },
    orderBy: { order: "asc" },
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 w-full flex-1 space-y-8">
        {/* Header Hero */}
        <div className="text-center space-y-4">
          <div
            className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center border ${
              isCompleted
                ? "bg-emerald-950 border-emerald-500/50 text-emerald-400"
                : isAbandoned
                ? "bg-rose-950 border-rose-500/50 text-rose-400"
                : "bg-cyan-950 border-cyan-500/50 text-cyan-400"
            }`}
          >
            {isCompleted ? (
              <Trophy className="w-7 h-7" />
            ) : isAbandoned ? (
              <XCircle className="w-7 h-7" />
            ) : (
              <Clock className="w-7 h-7" />
            )}
          </div>

          <div className="space-y-1">
            <span
              className={`text-xs uppercase font-bold tracking-widest ${
                isCompleted
                  ? "text-emerald-400"
                  : isAbandoned
                  ? "text-rose-400"
                  : "text-cyan-400"
              }`}
            >
              {isCompleted
                ? "Server-Verified Completion"
                : isAbandoned
                ? "Run Abandoned / Incomplete"
                : "Race In Progress"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {run.challenge.title}
            </h1>
            <p className="text-xs text-neutral-400">
              Team: <span className="text-cyan-300 font-bold">{run.team.name}</span>
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Final Verified Score
            </span>
            <div className="text-3xl font-extrabold text-cyan-400">
              {run.finalScore}
            </div>
            <span className="text-[10px] text-neutral-400">
              {run.difficultyMultiplier}x Multiplier
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Leaderboard Rank
            </span>
            <div className="text-3xl font-extrabold text-amber-400">
              {rank !== null ? `#${rank}` : "--"}
            </div>
            <span className="text-[10px] text-neutral-400">
              {isCompleted ? "Verified Standing" : "Unranked (Incomplete)"}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Authoritative Time
            </span>
            <div
              className={`text-3xl font-extrabold ${
                isCompleted ? "text-emerald-400" : "text-neutral-400"
              }`}
            >
              {isCompleted ? formatDuration(effectiveDurationMs) : "--:--"}
            </div>
            <span className="text-[10px] text-neutral-400">
              {hintPenalty > 0
                ? `(+${hintPenalty}s hint penalty)`
                : isCompleted
                ? "Zero penalties"
                : "Pending completion"}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-center space-y-1">
            <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
              Commands Executed
            </span>
            <div className="text-3xl font-extrabold text-neutral-200">
              {run.commandCount}
            </div>
            <span className="text-[10px] text-neutral-400">simulated shell calls</span>
          </div>
        </div>

        {/* Audited Scoring Formula Breakdown Card */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121215] border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h2 className="font-bold text-white text-sm flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              Official Competition Score Breakdown
            </h2>
            <span className="text-xs px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-cyan-300 font-mono">
              Status: {run.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs font-mono">
            <div className="p-3 rounded-lg bg-[#09090b] border border-neutral-800/80 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase">Milestones</span>
              <div className="text-lg font-bold text-emerald-400">+{run.objectivePoints}</div>
              <span className="text-[9px] text-neutral-500">Max 500 pts</span>
            </div>

            <div className="p-3 rounded-lg bg-[#09090b] border border-neutral-800/80 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase">Completion</span>
              <div className="text-lg font-bold text-cyan-400">+{run.completionBonus}</div>
              <span className="text-[9px] text-neutral-500">200 pts bonus</span>
            </div>

            <div className="p-3 rounded-lg bg-[#09090b] border border-neutral-800/80 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase">Speed Bonus</span>
              <div className="text-lg font-bold text-cyan-400">+{run.speedBonus}</div>
              <span className="text-[9px] text-neutral-500">Max 300 pts</span>
            </div>

            <div className="p-3 rounded-lg bg-[#09090b] border border-neutral-800/80 space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase">Hints Used</span>
              <div className="text-lg font-bold text-rose-400">-{run.hintPenalty}</div>
              <span className="text-[9px] text-neutral-500">Capped at 100</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/50 space-y-1">
              <span className="text-[10px] text-cyan-300 uppercase font-bold">Final Score</span>
              <div className="text-xl font-extrabold text-cyan-300">{run.finalScore}</div>
              <span className="text-[9px] text-neutral-400">Base {run.baseScore} × {run.difficultyMultiplier}</span>
            </div>
          </div>
        </div>

        {/* Detailed Verification Timestamps */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121215] border border-neutral-800 space-y-3 text-xs">
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
                {run.completedAt ? run.completedAt.toISOString() : "Session Incomplete"}
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
                  ? `${run.hintUsages.length} hints (+${hintPenalty}s penalty)`
                  : "0 hints unlocked"}
              </span>
            </div>
          </div>
        </div>

        {/* Command History Audit Log */}
        <div className="p-5 sm:p-6 rounded-xl bg-[#121215] border border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-neutral-200 text-sm flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-cyan-400" />
              Command History & Remapped Operation Audit
            </h2>
            <span className="text-xs text-neutral-500 font-mono">
              {run.commandLogs.length} commands logged
            </span>
          </div>

          {run.commandLogs.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-4 text-center">
              No commands recorded for this session.
            </p>
          ) : (
            <div className="overflow-x-auto border border-neutral-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#18181b] border-b border-neutral-800 text-neutral-400 text-[10px] uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">#</th>
                    <th className="py-2.5 px-3">Typed Command</th>
                    <th className="py-2.5 px-3">Mapped Operation</th>
                    <th className="py-2.5 px-3">Execution Output</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {run.commandLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-neutral-800/30">
                      <td className="py-2.5 px-3 text-center text-neutral-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 text-cyan-300 font-semibold">
                        $ {log.enteredCommand}
                      </td>
                      <td className="py-2.5 px-3 text-neutral-300">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px]">
                          {log.mappedOperation}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-400 max-w-xs truncate">
                        {log.output.slice(0, 80) || "<no stdout>"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-neutral-500 text-[11px]">
                        {log.executionTimeMs}ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          {nextChallenge && (
            <StartRunButton
              challengeId={nextChallenge.id}
              label={`Next Problem: Level ${nextChallenge.order} — ${nextChallenge.title} →`}
              className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2 shadow-lg"
            />
          )}

          {isInProgress ? (
            <Link
              href={`/play/${run.id}`}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              Resume Active Challenge
            </Link>
          ) : (
            <Link
              href="/lobby"
              className="px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors flex items-center gap-2 border border-neutral-700"
            >
              <Compass className="w-4 h-4" />
              All Problems (Lobby)
            </Link>
          )}

          <Link
            href="/leaderboard"
            className="px-5 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs transition-colors flex items-center gap-2 border border-neutral-700"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            View Leaderboard
          </Link>
        </div>
      </main>
    </div>
  );
}
