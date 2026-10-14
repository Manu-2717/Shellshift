import { redirect, notFound } from "next/navigation";
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

  const phase = deriveGamePhase(
    {
      status: g.status as any,
      registrationOpensAt: g.registrationOpensAt,
      registrationClosesAt: g.registrationClosesAt,
      startsAt: g.startTime,
      endsAt: g.endTime,
    },
    new Date()
  );

  const live = phase === "LIVE";

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-5 border-b border-zinc-800 pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm text-cyan-400">
              {live ? "Competition live" : "Waiting room"}
            </p>
            <h1 className="mt-2 text-3xl font-semibold">{g.name}</h1>
          </div>
          <GameCountdown
            target={(live ? g.endTime : g.startTime).toISOString()}
            label={live ? "Time remaining" : "Starts in"}
          />
        </div>

        <div className="mt-8">
          {!live ? (
            <div className="mb-6 rounded-xl border border-cyan-900/60 bg-cyan-950/20 p-5 text-sm text-cyan-100">
              You’re registered. Challenge details unlock when the competition begins.
            </div>
          ) : null}

          <GameLobby
            gameId={g.id}
            live={live}
            challenges={g.challenges.map((x) => {
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
