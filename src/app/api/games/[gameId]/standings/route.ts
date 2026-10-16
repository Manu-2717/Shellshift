import { getSession } from "@/lib/auth/session";
import { getGameStandings } from "@/lib/games/standings";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/games/[gameId]/standings">) {
  const session = await getSession().catch(() => null);
  const { gameId } = await context.params;
  const result = await getGameStandings(gameId, session?.id);
  return Response.json(result, {
    status: result.error ? 403 : 200,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
