import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "../api/leaderboard/route";
import {
  Play,
  CheckCircle2,
  Users,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Target,
} from "lucide-react";
import { StartRunButton } from "./StartButton";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login?mock=true&role=user");
  }

  if (!session.teamId) {
    redirect("/register");
  }

  const team = await prisma.team.findUnique({
    where: { id: session.teamId },
    include: {
      memberships: { include: { user: true } },
      runs: {
        include: { challenge: true },
      },
    },
  });

  const challenges = await prisma.challenge.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });

  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
        {/* Team Banner Card */}
        <div className="bg-[#121215] border border-neutral-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-cyan-400 font-bold">
                <Users className="w-3.5 h-3.5" />
              </span>
              <h1 className="text-lg font-bold text-white">{team?.name}</h1>
              <span className="px-2 py-0.5 rounded bg-neutral-900 text-neutral-300 border border-neutral-700 text-xs font-mono">
                Team Code: #{team?.inviteCode}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Active Members: {team?.memberships.map((m) => m.user.name).join(", ")}
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="px-3 py-1.5 rounded bg-neutral-950 border border-neutral-800 flex items-center gap-2">
              <span className="text-neutral-500">Competition:</span>
              <span className="text-emerald-400 font-bold uppercase">{event?.status || "ACTIVE"}</span>
            </div>
          </div>
        </div>

        {/* Challenge Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              Competition Challenge Missions
            </h2>
            <span className="text-xs text-neutral-400">
              Select a mission to begin your timed race
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {challenges.map((challenge) => {
              const run = team?.runs.find((r) => r.challengeId === challenge.id);
              const isCompleted = run?.status === "COMPLETED";
              const isInProgress = run?.status === "IN_PROGRESS";

              let clueCount = 0;
              try {
                clueCount = JSON.parse(challenge.clues).length;
              } catch {}

              let objDesc = "";
              try {
                objDesc = JSON.parse(challenge.objectiveConfig).description;
              } catch {}

              return (
                <div
                  key={challenge.id}
                  className={`flex flex-col justify-between p-5 rounded-xl border bg-[#121215] transition-all ${
                    isCompleted
                      ? "border-emerald-500/50 bg-[#0d1612]"
                      : isInProgress
                      ? "border-cyan-500 bg-[#0e161c]"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                        Level {challenge.order}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                          challenge.difficulty === "EASY"
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : challenge.difficulty === "MEDIUM"
                            ? "bg-amber-950 text-amber-300 border-amber-800"
                            : "bg-rose-950 text-rose-300 border-rose-800"
                        }`}
                      >
                        {challenge.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm leading-snug">
                      {challenge.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                      {challenge.description}
                    </p>

                    {/* Prominent Mission Objective Preview */}
                    <div className="p-2.5 rounded bg-[#09090b] border border-neutral-800 space-y-1">
                      <div className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wide">
                        <Target className="w-3 h-3 text-cyan-400" />
                        Mission Objective
                      </div>
                      <div className="text-xs text-neutral-200 font-medium leading-relaxed">
                        {objDesc || "Inspect clues & complete challenge goals"}
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-500 flex items-center gap-2 font-mono">
                      <span>{clueCount} Cipher Clues</span>
                      <span>•</span>
                      <span>Sandboxed Shell</span>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-neutral-800 mt-5">
                    {isCompleted ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </span>
                          <span>{formatDuration(run?.durationMs)}</span>
                        </div>
                        <Link
                          href={`/results/${run?.id}`}
                          className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          View Verified Result
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : isInProgress ? (
                      <Link
                        href={`/play/${run?.id}`}
                        className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Resume Active Race
                      </Link>
                    ) : (
                      <StartRunButton challengeId={challenge.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Competition Rules Panel */}
        <div className="p-5 rounded-xl bg-[#121215] border border-neutral-800 text-xs text-neutral-400 space-y-2">
          <div className="font-bold text-white flex items-center gap-1.5 text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Competition Rules & Fair-Play Protocols
          </div>
          <ul className="list-disc list-inside space-y-1 text-neutral-400 text-[11px] leading-relaxed">
            <li>The authoritative timer begins the moment you press &quot;Start Challenge Race&quot;.</li>
            <li>Commands are executed strictly inside a simulated virtual shell. No host commands are executed.</li>
            <li>Objectives are verified by the server inspecting the resulting virtual filesystem state.</li>
            <li>First team with valid server verification wins. Unlocked hints add penalty seconds.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
