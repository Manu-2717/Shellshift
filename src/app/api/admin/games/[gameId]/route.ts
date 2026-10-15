import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  deleteGamePermanently,
  deleteUnusedDraft,
  updateGameDraft,
} from "@/lib/games/service";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/games/[gameId]">,
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const { gameId } = await context.params;
  const game = await prisma.event.findUnique({
    where: { id: gameId },
    include: {
      challenges: {
        orderBy: { order: "asc" },
        include: { challenge: true },
      },
      registrations: true,
    },
  });
  return game
    ? Response.json({ game })
    : Response.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/games/[gameId]">,
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const { gameId } = await context.params;
  const result = await updateGameDraft(
    gameId,
    await request.json(),
    session.id,
  );
  return Response.json(result, { status: "game" in result ? 200 : 400 });
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/admin/games/[gameId]">,
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const { gameId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const confirmation =
    typeof body?.confirmation === "string" ? body.confirmation : "";
  const result = await deleteGamePermanently(gameId, confirmation, session.id);
  return Response.json(result, { status: result.status });
}
