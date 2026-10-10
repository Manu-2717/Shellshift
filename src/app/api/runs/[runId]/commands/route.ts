import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { executeCommand } from "@/lib/vfs/engine";
import { evaluateObjective } from "@/lib/vfs/evaluator";
import { CommandMapping, ObjectiveConfig, VfsState } from "@/lib/vfs/types";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const session = await getSession();

  if (!session || !session.teamId) {
    return NextResponse.json(
      { error: "Unauthorized. Please authenticate and register with a team." },
      { status: 401 }
    );
  }

  // Rate limit command execution per run
  const rl = rateLimit(`cmd:${runId}`, 60, 60000);
  if (!rl.success) {
    return NextResponse.json(
      {
        output: "bash: fork: retry: Resource temporarily unavailable (Rate limit exceeded)",
        exitCode: 1,
        isCompleted: false,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { command, clientRequestId } = body;

    if (command === undefined || typeof command !== "string") {
      return NextResponse.json({ error: "Missing or invalid command string." }, { status: 400 });
    }

    // Fetch run and challenge
    const run = await prisma.run.findUnique({
      where: { id: runId },
      include: { challenge: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found." }, { status: 404 });
    }

    // Verify team ownership
    if (run.teamId !== session.teamId && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Access denied. Run belongs to another team." }, { status: 403 });
    }

    // Check if run is already completed
    if (run.status === "COMPLETED") {
      return NextResponse.json(
        {
          error: "Run has already completed. Subsequent commands are rejected.",
          isCompleted: true,
          durationMs: run.durationMs,
        },
        { status: 400 }
      );
    }

    if (run.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: `Run is not active (status: ${run.status}).` },
        { status: 400 }
      );
    }

    // Verify event status
    const event = await prisma.event.findFirst();
    if (event && event.status !== "ACTIVE") {
      return NextResponse.json(
        { error: `Event is currently ${event.status.toLowerCase()}. Command execution halted.` },
        { status: 403 }
      );
    }

    // Load VFS state & challenge mapping
    let vfsState: VfsState;
    try {
      vfsState = JSON.parse(run.filesystemState);
    } catch {
      return NextResponse.json({ error: "Corrupted virtual filesystem state." }, { status: 500 });
    }

    let commandMappings: CommandMapping = {};
    try {
      commandMappings = JSON.parse(run.challenge.commandMappings);
    } catch {}

    const startTime = Date.now();

    // Execute in sandbox interpreter
    const cmdResult = executeCommand(vfsState, command, commandMappings);
    const executionTimeMs = Date.now() - startTime;

    const nextCommandCount = run.commandCount + 1;

    // Evaluate objective completion
    let objectiveConfig: ObjectiveConfig = { description: "", rules: [] };
    try {
      objectiveConfig = JSON.parse(run.challenge.objectiveConfig);
    } catch {}

    const evaluation = evaluateObjective(vfsState, objectiveConfig, nextCommandCount);
    let justCompleted = false;
    let finalDurationMs = run.durationMs;

    if (evaluation.isCompleted) {
      const now = new Date();
      finalDurationMs = now.getTime() - run.startedAt.getTime();

      // ATOMIC CONDITIONAL UPDATE:
      // Prevents concurrent race condition where two finishing commands complete simultaneously.
      const updateResult = await prisma.run.updateMany({
        where: {
          id: run.id,
          status: "IN_PROGRESS", // Guard against race conditions
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
          durationMs: finalDurationMs,
          filesystemState: JSON.stringify(vfsState),
          currentWorkingDir: cmdResult.newCwd,
          commandCount: nextCommandCount,
        },
      });

      if (updateResult.count === 1) {
        justCompleted = true;
      }
    } else {
      // Normal state update
      await prisma.run.update({
        where: { id: run.id },
        data: {
          filesystemState: JSON.stringify(vfsState),
          currentWorkingDir: cmdResult.newCwd,
          commandCount: nextCommandCount,
        },
      });
    }

    // Log command audit entry
    await prisma.commandLog.create({
      data: {
        runId: run.id,
        userId: session.id,
        enteredCommand: command,
        mappedOperation: cmdResult.mappedOperation,
        output: cmdResult.output,
        executionTimeMs,
      },
    });

    return NextResponse.json({
      output: cmdResult.output,
      exitCode: cmdResult.exitCode,
      cwd: cmdResult.newCwd,
      commandCount: nextCommandCount,
      isCompleted: evaluation.isCompleted,
      justCompleted,
      durationMs: finalDurationMs,
      objectiveEvaluation: evaluation,
      clearScreen: !!cmdResult.clearScreen,
    });
  } catch (err) {
    console.error("Command execution error:", err);
    return NextResponse.json(
      { error: "Internal server error occurred while processing command." },
      { status: 500 }
    );
  }
}
