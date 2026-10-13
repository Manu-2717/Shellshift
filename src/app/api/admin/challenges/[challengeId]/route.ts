import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  technicalSummary,
  updateChallengeMetadata,
} from "@/lib/challenges/adminMetadata";
export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/challenges/[challengeId]">,
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const { challengeId } = await context.params;
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    include: { hints: { orderBy: { order: "asc" } } },
  });
  if (!challenge)
    return Response.json({ error: "Challenge not found." }, { status: 404 });
  return Response.json({
    challenge: {
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      timeLimitSeconds: challenge.timeLimitSeconds,
      isPublished: challenge.isPublished,
      hints: challenge.hints,
    },
    technicalSummary: technicalSummary(challenge),
  });
}
export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/challenges/[challengeId]">,
) {
  const session = await getSession();
  if (session?.role !== "ADMIN")
    return Response.json({ error: "Forbidden" }, { status: 403 });
  const { challengeId } = await context.params;
  const result = await updateChallengeMetadata(
    challengeId,
    await request.json(),
    session.id,
  );
  return Response.json(
    "error" in result
      ? { error: result.error?.[0] ?? "Unable to update challenge.", details: result.error }
      : { challenge: result.challenge },
    { status: result.status },
  );
}
