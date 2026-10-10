import Link from "next/link";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { formatDuration } from "../api/leaderboard/route";

export const dynamic = "force-dynamic";
import {
  Play,
  CheckCircle2,
  Users,
  KeyRound,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-8">
        {/* Team Banner */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold">
                <Users className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-white">{team?.name}</h1>
              <span className="px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-mono">
                Invite Code: #{team?.inviteCode}
              </span>
            </div>
            <p className="text-xs text-neutral-400">
              Members: {team?.memberships.map((m) => m.user.name).join(", ")}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="px-3 py-1.5 rounded bg-neutral-950 border border-neutral-800">
              <span className="text-neutral-500 mr-2">Competition Status:</span>
              <span className="text-emerald-400 font-bold uppercase">{event?.status || "ACTIVE"}</span>
            </div>
          </div>
        </div>

        {/* Challenge Selection Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-cyan-400" />
              Available Competition Challenges
            </h2>
            <span className="text-xs text-neutral-400">
              Select a mission to begin your timed race
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {challenges.map((challenge) => {
              const run = team?.runs.find((r) => r.challengeId === challenge.id);
              const isCompleted = run?.status === "COMPLETED";
              const isInProgress = run?.status === "IN_PROGRESS";

              let clueCount = 0;
              try {
                clueCount = JSON.parse(challenge.clues).length;
              } catch {}

              return (
                <div
                  key={challenge.id}
                  className={`flex flex-col justify-between p-6 rounded-xl border bg-neutral-900 transition-all ${
                    isCompleted
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : isInProgress
                      ? "border-cyan-500/50 bg-cyan-950/10 shadow-lg shadow-cyan-950/20"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        Level {challenge.order}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          challenge.difficulty === "EASY"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : challenge.difficulty === "MEDIUM"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : "bg-rose-950 text-rose-300 border border-rose-800"
                        }`}
                      >
                        {challenge.difficulty}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-base leading-tight">
                      {challenge.title}
                    </h3>

                    <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                      {challenge.description}
                    </p>

                    <div className="pt-2 text-[11px] text-neutral-500 flex items-center gap-3">
                      <span>{clueCount} Cipher Clues</span>
                      <span>•</span>
                      <span>Sandboxed Shell</span>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-neutral-800/80 mt-6">
                    {isCompleted ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            Completed
                          </span>
                          <span>{formatDuration(run?.durationMs)}</span>
                        </div>
                        <Link
                          href={`/results/${run?.id}`}
                          className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          View Results & Rank
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : isInProgress ? (
                      <Link
                        href={`/play/${run?.id}`}
                        className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 animate-pulse"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Resume Active Race
                      </Link>
                    ) : (
                      <form
                        action="/api/runs/start"
                        method="POST"
                        className="w-full"
                      >
                        <input type="hidden" name="challengeId" value={challenge.id} />
                        <StartRunButton challengeId={challenge.id} />
                      </form>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rules and Guidelines */}
        <div className="p-6 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400 space-y-2">
          <div className="font-bold text-neutral-200 flex items-center gap-1.5 text-sm">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Competition Rules & Anti-Cheat Protocols
          </div>
          <ul className="list-disc list-inside space-y-1 text-neutral-400">
            <li>The authoritative timer begins the moment &quot;Start Challenge&quot; is pressed on the server.</li>
            <li>Commands are executed in a safe sandboxed virtual filesystem. No host commands are executed.</li>
            <li>Win verification is performed by inspecting virtual filesystem states on the server.</li>
            <li>First team with valid server verification wins. Unlocked hints add penalty seconds to final time.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

// Client button component for starting challenge and redirecting cleanly
import { StartRunButton } from "./StartButton";
