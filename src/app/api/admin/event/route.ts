import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ event });
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { status, name, description, mode, scoringConfig } = body;

    const event = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!event) {
      const created = await prisma.event.create({
        data: {
          name: name || "ShellShift Championship",
          status: status || "ACTIVE",
          mode: mode || "POINTS_TOURNAMENT",
          scoringConfig: typeof scoringConfig === "object" ? JSON.stringify(scoringConfig) : scoringConfig,
          description,
        },
      });
      return NextResponse.json({ event: created });
    }

    const updated = await prisma.event.update({
      where: { id: event.id },
      data: {
        ...(status ? { status } : {}),
        ...(name ? { name } : {}),
        ...(mode ? { mode } : {}),
        ...(scoringConfig !== undefined
          ? {
              scoringConfig:
                typeof scoringConfig === "object"
                  ? JSON.stringify(scoringConfig)
                  : scoringConfig,
            }
          : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });

    return NextResponse.json({ event: updated });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update event: " + (err as Error).message },
      { status: 500 }
    );
  }
}
