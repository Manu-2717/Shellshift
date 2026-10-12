import { getSession } from "@/lib/auth/session";
import { getGameStandings } from "@/lib/games/standings";

export async function GET(_request: Request, context: RouteContext<"/api/games/[gameId]/standings">) {
  const session = await getSession();
  const { gameId } = await context.params;
  const result = await getGameStandings(gameId, session?.id);
  return Response.json(result, { status: result.error ? 403 : 200 });
}

