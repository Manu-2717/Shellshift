import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { GameCountdown } from "@/components/games/GameCountdown";
import { GameLobby } from "@/components/games/GameLobby";
import { getSession } from "@/lib/auth/session";
import { deriveGamePhase } from "@/lib/games/lifecycle";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Lobby({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const user = await getSession();
  if (!user) {
    redirect(`/api/auth/login?redirect=/games/${gameId}/lobby`);
  }

  const g = await prisma.event.findFirst({
    where: {
      OR: [{ id: gameId }, { slug: gameId }],
    },
    include: {
      registrations: {
        where: { userId: user.id, status: "REGISTERED" },
      },
      challenges: {
        orderBy: { order: "asc" },
        include: { challenge: true },
      },
      runs: {
        where: { userId: user.id },
      },
    },
  });

  if (
    !g ||
    !g.registrationOpensAt ||
    !g.registrationClosesAt ||
    !g.startTime ||
    !g.endTime
  ) {
    notFound();
  }

  if (!g.registrations.length) {
    redirect(`/games/${g.id}`);
  }

  const now = new Date();
  if (g.status === "PUBLISHED" && g.endTime && now >= g.endTime) {
    await prisma.event.update({
      where: { id: g.id },
      data: { status: "ENDED" },
    });
    g.status = "ENDED";
  }

  const phase = deriveGamePhase(
    {
      status: g.status as any,
      registrationOpensAt: g.registrationOpensAt,
      registrationClosesAt: g.registrationClosesAt,
      startsAt: g.startTime,
      endsAt: g.endTime,
    },
    now
  );

  const isEnded = phase === "ENDED" || g.status === "ENDED";
  const live = phase === "LIVE" && !isEnded;

  // Distinct question assignment: Each team member receives distinct, non-overlapping questions
  const userMembership = await prisma.teamMembership.findFirst({
    where: { userId: user.id },
    include: {
      team: {
        include: {
          memberships: {
            orderBy: { createdAt: "asc" },
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  const team = userMembership?.team;
  const teamMembers = team?.memberships || [];
  const memberCount = Math.max(1, teamMembers.length);
  const sortedMemberIds = teamMembers.map((m) => m.userId).sort();
  const memberIndex = sortedMemberIds.indexOf(user.id);
  const effectiveIndex = memberIndex >= 0 ? memberIndex : 0;

  const assignedChallenges = memberCount > 1
    ? g.challenges.filter((_, idx) => idx % memberCount === effectiveIndex)
    : g.challenges;

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-cyan-400">
              {isEnded ? "Competition concluded" : live ? "Competition live" : "Waiting room"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{g.name}</h1>
          </div>
          {isEnded ? (
            <Link
              href={`/games/${g.id}/standings`}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition"
            >
              <Trophy className="size-4" />
              <span>View Leaderboard</span>
            </Link>
          ) : (
            <GameCountdown
              target={(live ? g.endTime : g.startTime).toISOString()}
              label={live ? "Time remaining" : "Starts in"}
            />
          )}
        </div>

        <div className="mt-8">
          {isEnded ? (
            <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-rose-500/30 bg-rose-950/20 p-5 text-sm">
              <div>
                <p className="font-semibold text-rose-300">This live competition has concluded.</p>
                <p className="text-xs text-zinc-400 mt-1">
                  Submissions are closed. Check the event leaderboard to see final verified standings and rankings.
                </p>
              </div>
              <Link
                href={`/games/${g.id}/standings`}
                className="shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition"
              >
                Go to Leaderboard
              </Link>
            </div>
          ) : !live ? (
            <div className="mb-6 rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-5 text-sm text-cyan-100">
              You’re registered. Challenge details unlock when the competition begins.
            </div>
          ) : null}

          {team && memberCount > 1 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-cyan-800/40 bg-cyan-950/20 p-4 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <span className="flex size-7 items-center justify-center rounded-lg bg-cyan-900/60 text-cyan-300 font-bold">
                  {effectiveIndex + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{team.name}</span>
                    <span className="rounded bg-cyan-950 border border-cyan-800/60 px-1.5 py-0.5 text-[10px] text-cyan-400 font-semibold">
                      Member {effectiveIndex + 1} of {memberCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Your assigned missions are unique to you. Teammates receive different questions to maximize team average score.
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 block">Assigned Missions</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  {assignedChallenges.length} <span className="text-zinc-500 font-normal">/ {g.challenges.length} total</span>
                </span>
              </div>
            </div>
          )}

          <GameLobby
            gameId={g.id}
            live={live}
            challenges={assignedChallenges.map((x) => {
              const run = g.runs.find((r) => r.challengeId === x.challengeId);
              return {
                id: x.challenge.id,
                title: live ? x.challenge.title : "Encrypted mission",
                difficulty: live ? x.challenge.difficulty : "LOCKED",
                order: x.order,
                runId: run?.id,
                status: run?.status,
              };
            })}
          />
        </div>
      </main>
    </div>
  );
}
