import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GameDangerZone } from "@/components/admin/GameDangerZone";

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const game = await prisma.event.findUnique({
    where: { id: gameId },
    include: {
      challenges: {
        orderBy: { order: "asc" },
        include: { challenge: true },
      },
      _count: { select: { registrations: true, runs: true } },
    },
  });

  if (!game) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <StatusBadge tone="info">{game.status}</StatusBadge>
      <h1 className="mt-4 text-3xl font-semibold">{game.name}</h1>
      <p className="mt-2 text-zinc-500">{game.description}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <span className="text-sm text-zinc-500">Registered</span>
          <strong className="mt-2 block text-3xl">
            {game._count.registrations}
          </strong>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <span className="text-sm text-zinc-500">Runs</span>
          <strong className="mt-2 block text-3xl">{game._count.runs}</strong>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <span className="text-sm text-zinc-500">Challenges</span>
          <strong className="mt-2 block text-3xl">
            {game.challenges.length}
          </strong>
        </div>
      </div>
      <section className="mt-8 rounded-2xl border border-zinc-800 bg-[#0e1016] p-6">
        <h2 className="text-lg font-semibold">Challenge lineup</h2>
        <ol className="mt-4 divide-y divide-zinc-800">
          {game.challenges.map((item, index) => (
            <li key={item.id} className="flex items-center gap-4 py-4">
              <span className="font-mono text-xs text-cyan-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>{item.challenge.title}</span>
              <span className="ml-auto text-xs text-zinc-500">
                {item.challenge.difficulty}
              </span>
            </li>
          ))}
        </ol>
      </section>
      <div className="mt-8">
        <GameDangerZone
          gameId={game.id}
          name={game.name}
          status={game.status}
          registrationCount={game._count.registrations}
          runCount={game._count.runs}
        />
      </div>
    </div>
  );
}
