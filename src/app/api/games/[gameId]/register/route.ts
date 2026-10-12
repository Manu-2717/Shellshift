import { getSession } from "@/lib/auth/session";
import { registerUserForGame } from "@/lib/games/registration";

export async function POST(_request: Request, context: RouteContext<"/api/games/[gameId]/register">) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to register." }, { status: 401 });
  const { gameId } = await context.params;
  const result = await registerUserForGame(gameId, session.id);
  return Response.json(result, { status: result.status });
}

