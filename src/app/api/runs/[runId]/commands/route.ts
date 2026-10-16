import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { executeCommand } from "@/lib/vfs/engine";
import { evaluateObjective } from "@/lib/vfs/evaluator";
import { CommandMapping, ObjectiveConfig, VfsState } from "@/lib/vfs/types";
import { rateLimit } from "@/lib/rateLimit";
import { calculateRunScore } from "@/lib/scoring/scoringEngine";
import { evaluateRunAccess } from "@/lib/games/runAccess";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Please authenticate and register as a contestant." },
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
      include: { challenge: true, event: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found." }, { status: 404 });
    }

    const access = evaluateRunAccess(run, session);
    if (access !== "OK") {
      if (access === "GAME_ENDED") {
        if (run.event && run.event.status !== "ENDED") {
          await prisma.event.updateMany({
            where: { id: run.event.id },
            data: { status: "ENDED" },
          });
        }
        if (run.status === "IN_PROGRESS") {
          await prisma.run.updateMany({
            where: { id: run.id, status: "IN_PROGRESS" },
            data: { status: "EXPIRED" },
          });
        }
        return NextResponse.json({
          output: "[COMPETITION ENDED] The event duration has concluded. Terminal is locked and submissions are closed.",
          exitCode: 1,
          isGameEnded: true,
          isExpired: true,
          status: "EXPIRED",
        }, { status: 200 });
      }

      if (access === "RUN_EXPIRED") {
        if (run.status === "IN_PROGRESS") {
          await prisma.run.updateMany({
            where: { id: run.id, status: "IN_PROGRESS" },
            data: { status: "EXPIRED" },
          });
        }
        return NextResponse.json({
          output: "[TIME EXPIRED] Challenge deadline has passed. Run concluded.",
          exitCode: 1,
          isExpired: true,
          status: "EXPIRED",
        }, { status: 200 });
      }

      if (access === "GAME_PAUSED") {
        return NextResponse.json({
          output: "[GAME PAUSED] The competition is paused by tournament admins. Please wait for resumption.",
          exitCode: 1,
          isGamePaused: true,
        }, { status: 200 });
      }

      return NextResponse.json({ error: access }, { status: access === "RUN_FORBIDDEN" ? 403 : 409 });
    }

    // Check if run is already completed
    if (run.status === "COMPLETED") {
      return NextResponse.json(
        {
          output: "[COMPLETED] Challenge is already completed. Subsequent commands are locked.",
          isCompleted: true,
          durationMs: run.durationMs,
          exitCode: 0,
        },
        { status: 200 }
      );
    }

    if (run.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          output: `[LOCKED] Run is not active (status: ${run.status}).`,
          isExpired: run.status === "EXPIRED",
          exitCode: 1,
        },
        { status: 200 }
      );
    }

    // Verify event status
    const event = run.event;

    const now = new Date();
    const timeLimitSeconds = run.challenge.timeLimitSeconds || 1200;
    const deadline = run.deadlineAt
      ? new Date(run.deadlineAt)
      : new Date(run.startedAt.getTime() + timeLimitSeconds * 1000);

    // Parse scoring config
    let scoringConfig = {
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      defaultHintPenalty: 25,
      difficultyMultiplier:
        run.challenge.difficulty === "HARD"
          ? 1.5
          : run.challenge.difficulty === "MEDIUM"
          ? 1.25
          : 1.0,
      timeLimitSeconds,
      partialCreditOnExpiry: true,
      countsTowardLeaderboard: true,
    };

    try {
      if (run.scoringSnapshot) {
        scoringConfig = { ...scoringConfig, ...JSON.parse(run.scoringSnapshot) };
      } else if (run.challenge.scoringConfig) {
        scoringConfig = { ...scoringConfig, ...JSON.parse(run.challenge.scoringConfig) };
      }
    } catch {}

    // Check Authoritative Deadline Expiration
    if (now.getTime() > deadline.getTime()) {
      if (run.status === "IN_PROGRESS") {
        await prisma.run.updateMany({
          where: { id: run.id, status: "IN_PROGRESS" },
          data: { status: "EXPIRED" },
        });

        // Compute and store partial score if configured
        if (scoringConfig.partialCreditOnExpiry) {
          const completions = await prisma.objectiveCompletion.findMany({
            where: { runId: run.id },
          });
          const hintUsages = await prisma.hintUsage.findMany({
            where: { runId: run.id },
            include: { hint: true },
          });
          const verifiedIds = completions.map((c) => c.objectiveId);
          const hintPenalties = hintUsages.map((u) => u.pointPenalty || u.hint.pointPenalty || 25);

          let objConfig: ObjectiveConfig = { description: "", rules: [] };
          try {
            objConfig = JSON.parse(run.challenge.objectiveConfig);
          } catch {}

          const objectives = (objConfig.rules || []).map((r, idx) => ({
            id: r.id || `rule-${idx}`,
            description: r.description,
            points: r.points || 0,
          }));

          const partialBreakdown = calculateRunScore({
            status: "EXPIRED",
            startedAt: run.startedAt,
            currentTimestamp: deadline,
            verifiedObjectiveIds: verifiedIds,
            revealedHintPenalties: hintPenalties,
            config: scoringConfig,
            objectives,
          });

          await prisma.run.update({
            where: { id: run.id },
            data: {
              objectivePoints: partialBreakdown.objectivePoints,
              completionBonus: 0,
              speedBonus: 0,
              hintPenalty: partialBreakdown.hintPenalty,
              baseScore: partialBreakdown.baseScore,
              finalScore: partialBreakdown.finalScore,
              scoringBreakdown: JSON.stringify(partialBreakdown),
            },
          });
        }
      }

      return NextResponse.json(
        {
          error: "Time limit expired. Subsequent commands are rejected.",
          isCompleted: false,
          isExpired: true,
          status: "EXPIRED",
        },
        { status: 400 }
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

    // Intermediate Objective Scoring:
    // Persist verified objectives without triggering duplicate unique constraint errors
    const availableObjectives = (objectiveConfig.rules || []).map((r, idx) => ({
      id: r.id || `rule-${idx}`,
      description: r.description,
      points: r.points || 0,
    }));

    const existingCompletions = await prisma.objectiveCompletion.findMany({
      where: { runId: run.id },
    });
    const completedSet = new Set(existingCompletions.map((c) => c.objectiveId));

    for (let i = 0; i < evaluation.details.length; i++) {
      const detail = evaluation.details[i];
      if (detail.passed) {
        const objId = detail.id || `rule-${i}`;
        if (!completedSet.has(objId)) {
          const pts = detail.points || 0;
          try {
            const created = await prisma.objectiveCompletion.create({
              data: {
                runId: run.id,
                objectiveId: objId,
                ruleIndex: i,
                pointsAwarded: pts,
                completedAt: now,
              },
            });
            completedSet.add(objId);
            existingCompletions.push(created);
          } catch {
            // Handled concurrency / already recorded
          }
        }
      }
    }

    let justCompleted = false;
    let finalDurationMs = run.durationMs;
    let scoreBreakdown = null;

    const MAX_OUTPUT_SIZE = 32768;
    const safeOutput =
      cmdResult.output.length > MAX_OUTPUT_SIZE
        ? cmdResult.output.slice(0, MAX_OUTPUT_SIZE) + "\n...[output truncated by ShellShift]"
        : cmdResult.output;

    if (evaluation.isCompleted) {
      finalDurationMs = now.getTime() - run.startedAt.getTime();

      // Retrieve all verified milestones and used hints
      const allCompletions = existingCompletions;
      const allHints = await prisma.hintUsage.findMany({
        where: { runId: run.id },
        include: { hint: true },
      });

      const verifiedIds = allCompletions.map((c) => c.objectiveId);
      const hintPenalties = allHints.map((h) => h.pointPenalty || h.hint.pointPenalty || 25);

      scoreBreakdown = calculateRunScore({
        status: "COMPLETED",
        startedAt: run.startedAt,
        completedAt: now,
        verifiedObjectiveIds: verifiedIds,
        revealedHintPenalties: hintPenalties,
        config: scoringConfig,
        objectives: availableObjectives,
      });

      // ATOMIC CONDITIONAL UPDATE:
      // Prevents concurrent race condition where two finishing commands complete simultaneously.
      const updateResult = await prisma.run.updateMany({
        where: {
          id: run.id,
          status: "IN_PROGRESS",
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
          durationMs: finalDurationMs,
          filesystemState: JSON.stringify(vfsState),
          currentWorkingDir: cmdResult.newCwd,
          commandCount: nextCommandCount,
          objectivePoints: scoreBreakdown.objectivePoints,
          completionBonus: scoreBreakdown.completionBonus,
          speedBonus: scoreBreakdown.speedBonus,
          hintPenalty: scoreBreakdown.hintPenalty,
          baseScore: scoreBreakdown.baseScore,
          difficultyMultiplier: scoreBreakdown.difficultyMultiplier,
          finalScore: scoreBreakdown.finalScore,
          scoringBreakdown: JSON.stringify(scoreBreakdown),
        },
      });

      if (updateResult.count === 1) {
        justCompleted = true;
      }
    } else {
      // In-progress update: calculate current verified progress
      const allCompletions = existingCompletions;
      const allHints = await prisma.hintUsage.findMany({
        where: { runId: run.id },
        include: { hint: true },
      });

      const verifiedIds = allCompletions.map((c) => c.objectiveId);
      const hintPenalties = allHints.map((h) => h.pointPenalty || h.hint.pointPenalty || 25);

      scoreBreakdown = calculateRunScore({
        status: "IN_PROGRESS",
        startedAt: run.startedAt,
        currentTimestamp: now,
        verifiedObjectiveIds: verifiedIds,
        revealedHintPenalties: hintPenalties,
        config: scoringConfig,
        objectives: availableObjectives,
      });

      await prisma.run.updateMany({
        where: {
          id: run.id,
          status: "IN_PROGRESS",
        },
        data: {
          filesystemState: JSON.stringify(vfsState),
          currentWorkingDir: cmdResult.newCwd,
          commandCount: nextCommandCount,
          objectivePoints: scoreBreakdown.objectivePoints,
          hintPenalty: scoreBreakdown.hintPenalty,
          baseScore: scoreBreakdown.baseScore,
          finalScore: scoreBreakdown.finalScore,
          scoringBreakdown: JSON.stringify(scoreBreakdown),
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
        output: safeOutput,
        executionTimeMs,
      },
    });

    // Calculate player's live cumulative event score for immediate leaderboard synchronization
    let totalEventScore = scoreBreakdown?.finalScore || 0;
    if (run.eventId && session.id) {
      const userCompletedRuns = await prisma.run.findMany({
        where: {
          eventId: run.eventId,
          userId: session.id,
          status: "COMPLETED",
        },
        select: {
          challengeId: true,
          finalScore: true,
        },
      });

      const bestByChallenge = new Map<string, number>();
      for (const cr of userCompletedRuns) {
        const prev = bestByChallenge.get(cr.challengeId) || 0;
        if (cr.finalScore > prev) {
          bestByChallenge.set(cr.challengeId, cr.finalScore);
        }
      }

      if (evaluation.isCompleted && scoreBreakdown && scoreBreakdown.finalScore > (bestByChallenge.get(run.challengeId) || 0)) {
        bestByChallenge.set(run.challengeId, scoreBreakdown.finalScore);
      }

      totalEventScore = Math.round(Array.from(bestByChallenge.values()).reduce((sum, s) => sum + s, 0) * 100) / 100;
    }

    return NextResponse.json({
      output: safeOutput,
      exitCode: cmdResult.exitCode,
      cwd: cmdResult.newCwd,
      commandCount: nextCommandCount,
      isCompleted: evaluation.isCompleted,
      justCompleted,
      durationMs: finalDurationMs,
      objectiveEvaluation: evaluation,
      scoreBreakdown,
      totalEventScore,
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
