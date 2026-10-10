import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }

  const challenges = await prisma.challenge.findMany({
    orderBy: { order: "asc" },
    include: {
      hints: true,
      _count: { select: { runs: true } },
    },
  });

  const parsed = challenges.map((c) => ({
    ...c,
    commandMappings: JSON.parse(c.commandMappings || "{}"),
    clues: JSON.parse(c.clues || "[]"),
    initialFilesystem: JSON.parse(c.initialFilesystem || "{}"),
    objectiveConfig: JSON.parse(c.objectiveConfig || "{}"),
  }));

  return NextResponse.json({ challenges: parsed });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      slug,
      title,
      description,
      difficulty,
      order,
      commandMappings,
      clues,
      initialFilesystem,
      objectiveConfig,
    } = body;

    if (!slug || !title || !description) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const newChallenge = await prisma.challenge.create({
      data: {
        slug: slug.trim().toLowerCase(),
        title,
        description,
        difficulty: difficulty || "MEDIUM",
        order: order || 1,
        commandMappings: JSON.stringify(commandMappings || {}),
        clues: JSON.stringify(clues || []),
        initialFilesystem: JSON.stringify(initialFilesystem || {}),
        objectiveConfig: JSON.stringify(objectiveConfig || {}),
        isPublished: true,
      },
    });

    return NextResponse.json({ success: true, challenge: newChallenge });
  } catch (err) {
    console.error("Admin create challenge error:", err);
    return NextResponse.json(
      { error: "Failed to create challenge: " + (err as Error).message },
      { status: 500 }
    );
  }
}
