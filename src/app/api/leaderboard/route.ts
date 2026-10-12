import { prisma } from "@/lib/prisma";
import { getGameStandings } from "@/lib/games/standings";

export function formatDuration(durationMs?: number | null): string {
  if (durationMs === null || durationMs === undefined) return "--:--";
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((durationMs % 1000) / 10);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(2, "0")}`;
}

export async function GET(request: Request) {
  const requestedId = new URL(request.url).searchParams.get("gameId");
  const game = requestedId
    ? await prisma.event.findUnique({ where: { id: requestedId } })
    : await prisma.event.findFirst({ orderBy: { createdAt: "desc" } });
  if (!game) return Response.json({ event: null, leaderboard: [], total: 0 });
  const result = await getGameStandings(game.id);
  const leaderboard = result.standings.map((row) => ({
    ...row,
    playerId: row.userId,
    playerName: row.userName,
    formattedTime: formatDuration(row.aggregateDurationMs),
  }));
  return Response.json({ mode: game.mode, event: { id: game.id, name: game.name }, leaderboard, total: leaderboard.length });
}
