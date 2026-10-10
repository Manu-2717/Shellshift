import { NextResponse } from "next/server";
import crypto from "crypto";
import { getSession, setSessionCookie } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized. Please authenticate first." }, { status: 401 });
  }

  // Rate limit registration attempts per user
  const rl = rateLimit(`reg:${session.id}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many registration attempts. Please wait." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { displayName, teamName, joinCode } = body;

    const trimmedDisplayName = displayName ? String(displayName).trim() : session.name;
    const trimmedTeamName = teamName ? String(teamName).trim() : "";
    const trimmedJoinCode = joinCode ? String(joinCode).trim().toUpperCase() : "";

    // If joinCode is provided, user is joining an existing team
    if (trimmedJoinCode) {
      const existingTeam = await prisma.team.findUnique({
        where: { inviteCode: trimmedJoinCode },
        include: { memberships: true },
      });

      if (!existingTeam) {
        return NextResponse.json({ error: "Team not found with the provided invite code." }, { status: 404 });
      }

      // Check if user is already a member
      const isMember = existingTeam.memberships.some((m) => m.userId === session.id);
      if (isMember) {
        return NextResponse.json({
          message: "Already a member of this team.",
          team: existingTeam,
        });
      }

      // Add user to team in transaction
      const result = await prisma.$transaction(async (tx) => {
        if (trimmedDisplayName && trimmedDisplayName !== session.name) {
          await tx.user.update({
            where: { id: session.id },
            data: { name: trimmedDisplayName },
          });
        }

        const membership = await tx.teamMembership.create({
          data: {
            userId: session.id,
            teamId: existingTeam.id,
            role: "MEMBER",
          },
        });

        return { team: existingTeam, membership };
      });

      // Update session cookie
      await setSessionCookie({
        ...session,
        name: trimmedDisplayName,
        teamId: result.team.id,
        teamName: result.team.name,
        teamRole: "MEMBER",
      });

      return NextResponse.json({
        success: true,
        team: result.team,
        role: "MEMBER",
      });
    }

    // Creating a new team
    if (!trimmedTeamName || trimmedTeamName.length < 3 || trimmedTeamName.length > 32) {
      return NextResponse.json(
        { error: "Team name must be between 3 and 32 characters long." },
        { status: 400 }
      );
    }

    // Check if team name already exists
    const existingTeam = await prisma.team.findUnique({
      where: { name: trimmedTeamName },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: `Team name '${trimmedTeamName}' is already taken. Please choose another name.` },
        { status: 409 }
      );
    }

    // Create team and membership atomically in a transaction
    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const result = await prisma.$transaction(async (tx) => {
      // Update display name if changed
      if (trimmedDisplayName && trimmedDisplayName !== session.name) {
        await tx.user.update({
          where: { id: session.id },
          data: { name: trimmedDisplayName },
        });
      }

      // Remove existing memberships if any
      await tx.teamMembership.deleteMany({
        where: { userId: session.id },
      });

      const team = await tx.team.create({
        data: {
          name: trimmedTeamName,
          inviteCode,
        },
      });

      const membership = await tx.teamMembership.create({
        data: {
          userId: session.id,
          teamId: team.id,
          role: "LEADER",
        },
      });

      return { team, membership };
    });

    // Update session cookie
    await setSessionCookie({
      ...session,
      name: trimmedDisplayName,
      teamId: result.team.id,
      teamName: result.team.name,
      teamRole: "LEADER",
    });

    return NextResponse.json({
      success: true,
      team: result.team,
      role: "LEADER",
    });
  } catch (err) {
    console.error("Team registration error:", err);
    return NextResponse.json(
      { error: "Internal server error occurred during registration." },
      { status: 500 }
    );
  }
}
