import { getSession } from "@/lib/auth/session";
import { publishGame } from "@/lib/games/service";

export async function POST(_request: Request, context: RouteContext<"/api/admin/games/[gameId]/publish">) {
  const session = await getSession();
  if (session?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const { gameId } = await context.params;
  const result = await publishGame(gameId, session.id);
  return Response.json(result, { status: result.game ? 200 : 400 });
}

