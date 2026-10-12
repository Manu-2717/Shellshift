import { getSession } from "@/lib/auth/session";
import { transitionGameStatus } from "@/lib/games/service";

export async function PATCH(request: Request, context: RouteContext<"/api/admin/games/[gameId]/status">) {
  const session = await getSession();
  if (session?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const { gameId } = await context.params;
  const { status } = await request.json();
  const result = await transitionGameStatus(gameId, status, session.id);
  return Response.json(result, { status: result.game ? 200 : 400 });
}

