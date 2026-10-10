import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
    const { status, name, description } = body;

    const event = await prisma.event.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!event) {
      const created = await prisma.event.create({
        data: {
          name: name || "ShellShift Championship",
          status: status || "ACTIVE",
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
        ...(description ? { description } : {}),
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
