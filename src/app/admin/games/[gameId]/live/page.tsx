import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminShell } from "@/components/admin/AdminShell";
import { LiveOperations } from "@/components/admin/LiveOperations";
import { getGameStandings } from "@/lib/games/standings";

export const dynamic = "force-dynamic";

export default async function AdminGameLivePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    redirect("/api/auth/login?redirect=/admin");
  }

  const { gameId } = await params;

  const game = await prisma.event.findUnique({
    where: { id: gameId },
    include: {
      challenges: {
        include: { challenge: true },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!game) {
    notFound();
  }

  const [registeredCount, activeCount, completedCount, participants, activity, standings] =
    await Promise.all([
      prisma.gameRegistration.count({ where: { eventId: gameId } }),
      prisma.run.count({ where: { eventId: gameId, status: "IN_PROGRESS" } }),
      prisma.run.count({ where: { eventId: gameId, status: "COMPLETED" } }),
      prisma.gameRegistration.findMany({
        where: { eventId: gameId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { registeredAt: "asc" },
      }),
      prisma.commandLog.findMany({
        where: { run: { eventId: gameId } },
        orderBy: { timestamp: "desc" },
        take: 30,
        include: {
          run: {
            select: {
              id: true,
              user: { select: { id: true, name: true } },
              challenge: { select: { id: true, title: true } },
            },
          },
        },
      }),
      getGameStandings(gameId, session.id),
    ]);

  const initialData = {
    game,
    serverTime: new Date().toISOString(),
    metrics: {
      registeredCount,
      activeCount,
      completedCount,
    },
    participants,
    activity,
    standings,
  };

  return (
    <AdminShell>
      <LiveOperations game={game} initialData={initialData} />
    </AdminShell>
  );
}
