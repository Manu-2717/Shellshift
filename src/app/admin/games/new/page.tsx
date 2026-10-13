import { prisma } from "@/lib/prisma";
import { GameBuilder } from "@/components/admin/GameBuilder";

export const dynamic = "force-dynamic";

export default async function NewGame() {
  const challenges = await prisma.challenge.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      title: true,
      difficulty: true,
      timeLimitSeconds: true,
    },
  });

  return (
    <div>
      <header className="mx-auto mb-8 max-w-4xl">
        <p className="text-sm text-cyan-400">New competition</p>
        <h1 className="mt-1 text-3xl font-semibold">Create game</h1>
      </header>
      <GameBuilder challenges={challenges} />
    </div>
  );
}
