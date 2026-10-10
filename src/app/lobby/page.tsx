import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Users, ShieldAlert } from "lucide-react";
import { LobbyCatalog, LobbyChallengeItem } from "./LobbyCatalog";
import { isMockAuthAllowed } from "@/lib/auth/oidc";
import { SEED_CHALLENGES } from "@/lib/challenges/seedData";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const session = await getSession();

  if (!session) {
    redirect(isMockAuthAllowed() ? "/api/auth/login?mock=true&role=user" : "/api/auth/login");
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

  const durationLookup = new Map(SEED_CHALLENGES.map((sc) => [sc.slug, sc.estimatedDuration]));

  const catalogItems: LobbyChallengeItem[] = challenges.map((challenge) => {
    const run = team?.runs.find((r) => r.challengeId === challenge.id);

    let clueCount = 0;
    try {
      clueCount = JSON.parse(challenge.clues || "[]").length;
    } catch {}

    let objDesc = "";
    try {
      objDesc = JSON.parse(challenge.objectiveConfig || "{}").description || "";
    } catch {}

    let scoringConfig = {
      maxBaseScore: 1000,
      difficultyMultiplier:
        challenge.difficulty === "HARD" ? 1.5 : challenge.difficulty === "MEDIUM" ? 1.25 : 1.0,
    };
    try {
      if (challenge.scoringConfig) {
        const sc = JSON.parse(challenge.scoringConfig);
        scoringConfig = {
          maxBaseScore: sc.maxBaseScore || 1000,
          difficultyMultiplier: sc.difficultyMultiplier || scoringConfig.difficultyMultiplier,
        };
      }
    } catch {}

    return {
      id: challenge.id,
      slug: challenge.slug,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty as "EASY" | "MEDIUM" | "HARD",
      order: challenge.order,
      timeLimitSeconds: challenge.timeLimitSeconds,
      estimatedDuration: durationLookup.get(challenge.slug) || `${Math.floor(challenge.timeLimitSeconds / 60)} min`,
      scoringConfig,
      clueCount,
      objectiveDescription: objDesc,
      runStatus: (run?.status as any) || null,
      runId: run?.id || null,
      runDurationMs: run?.durationMs || null,
      finalScore: run?.finalScore || null,
    };
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

        {/* 20 Challenges Catalog with Filters & Sections */}
        <LobbyCatalog challenges={catalogItems} />

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
