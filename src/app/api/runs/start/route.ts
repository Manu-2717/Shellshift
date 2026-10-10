import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { createInitialVfs } from "@/lib/vfs/vfs";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || !session.teamId) {
    return NextResponse.json(
      { error: "Unauthorized. You must be authenticated and registered on a team." },
      { status: 401 }
    );
  }

  // Rate limit run creation
  const rl = rateLimit(`run_start:${session.teamId}`, 10, 60000);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many run start requests. Please wait." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const { challengeId } = body;

    if (!challengeId) {
      return NextResponse.json({ error: "Missing challengeId." }, { status: 400 });
    }

    // Verify event status
    const currentEvent = await prisma.event.findFirst();
    if (currentEvent && currentEvent.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Competition is currently ${currentEvent.status.toLowerCase()}. Challenges cannot be started.` },
        { status: 403 }
      );
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || !challenge.isPublished) {
      return NextResponse.json({ error: "Challenge not found or unavailable." }, { status: 404 });
    }

    // Duplicate-start prevention: check for existing active run
    const existingActiveRun = await prisma.run.findFirst({
      where: {
        teamId: session.teamId,
        challengeId: challenge.id,
        status: "IN_PROGRESS",
      },
    });

    if (existingActiveRun) {
      return NextResponse.json({
        run: {
          id: existingActiveRun.id,
          status: existingActiveRun.status,
          startedAt: existingActiveRun.startedAt,
          currentWorkingDir: existingActiveRun.currentWorkingDir,
          commandCount: existingActiveRun.commandCount,
          isExisting: true,
        },
      });
    }

    // Initialize virtual filesystem from challenge seed
    let initialFiles = {};
    try {
      initialFiles = JSON.parse(challenge.initialFilesystem);
    } catch {}

    const vfs = createInitialVfs(initialFiles);

    // Create new run with authoritative server start timestamp
    const startedAt = new Date();
    const newRun = await prisma.run.create({
      data: {
        teamId: session.teamId,
        challengeId: challenge.id,
        status: "IN_PROGRESS",
        startedAt,
        filesystemState: JSON.stringify(vfs),
        currentWorkingDir: vfs.cwd,
        commandCount: 0,
      },
    });

    return NextResponse.json({
      run: {
        id: newRun.id,
        status: newRun.status,
        startedAt: newRun.startedAt,
        currentWorkingDir: newRun.currentWorkingDir,
        commandCount: 0,
        isExisting: false,
      },
    });
  } catch (err) {
    console.error("Run start error:", err);
    return NextResponse.json(
      { error: "Internal server error occurred while starting run." },
      { status: 500 }
    );
  }
}
