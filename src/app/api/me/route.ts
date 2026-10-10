import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  // Fetch fresh user data from database
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      memberships: {
        include: {
          team: {
            include: {
              runs: {
                select: {
                  id: true,
                  challengeId: true,
                  status: true,
                  startedAt: true,
                  completedAt: true,
                  durationMs: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const activeMembership = user.memberships[0];

  return NextResponse.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: activeMembership?.team
        ? {
            id: activeMembership.team.id,
            name: activeMembership.team.name,
            inviteCode: activeMembership.team.inviteCode,
            role: activeMembership.role,
            runs: activeMembership.team.runs,
          }
        : null,
    },
  });
}
