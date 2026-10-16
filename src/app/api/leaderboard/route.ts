import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { getGameStandings } from "@/lib/games/standings";

export const dynamic = "force-dynamic";

import { formatDuration } from "@/lib/format";
export { formatDuration };

export async function GET(request: Request) {
  const requestedId = new URL(request.url).searchParams.get("gameId");
  const game = requestedId
    ? await prisma.event.findFirst({
        where: {
          OR: [{ id: requestedId }, { slug: requestedId }],
        },
      })
    : await prisma.event.findFirst({ orderBy: { createdAt: "desc" } });

  if (!game) {
    return Response.json(
      { event: null, leaderboard: [], total: 0 },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }

  const session = await getSession().catch(() => null);
  const result = await getGameStandings(game.id, session?.id);
  const leaderboard = result.standings.map((row) => ({
    ...row,
    playerId: row.userId,
    playerName: row.userName,
    formattedTime: formatDuration(row.aggregateDurationMs),
  }));

  return Response.json(
    {
      mode: game.mode,
      event: { id: game.id, name: game.name },
      leaderboard,
      total: leaderboard.length,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    }
  );
}
