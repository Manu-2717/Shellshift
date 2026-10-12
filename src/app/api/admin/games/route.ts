import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createGameDraft } from "@/lib/games/service";

export async function GET() {
  const session = await getSession();
  if (session?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const games = await prisma.event.findMany({ orderBy: { createdAt: "desc" }, include: { challenges: true, _count: { select: { registrations: true, runs: true } } } });
  return Response.json({ games });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (session?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
  const result = await createGameDraft(await request.json(), session.id);
  return Response.json(result, { status: result.game ? 201 : 400 });
}

