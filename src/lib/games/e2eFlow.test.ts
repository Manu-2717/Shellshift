import { describe, expect, it } from "vitest";
import { prisma } from "../prisma";
import { getGameStandings } from "./standings";
import { deriveGamePhase } from "./lifecycle";
import { createInitialVfs } from "../vfs/vfs";
import { executeCommand } from "../vfs/engine";
import { evaluateObjective } from "../vfs/evaluator";
import { calculateRunScore } from "../scoring/scoringEngine";

describe("End-to-End Individual Competition Flow", () => {
  it("completes full lifecycle: create/publish, register, play, score, standings, end", async () => {
    // 1. Setup Admin and Player users
    const adminUser = await prisma.user.upsert({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: "https://auth.shellshift.test",
          oidcSub: "admin-e2e-sub",
        },
      },
      update: {},
      create: {
        oidcIssuer: "https://auth.shellshift.test",
        oidcSub: "admin-e2e-sub",
        name: "Admin Supervisor",
        role: "ADMIN",
      },
    });

    const playerUser = await prisma.user.upsert({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: "https://auth.shellshift.test",
          oidcSub: "player-e2e-sub",
        },
      },
      update: {},
      create: {
        oidcIssuer: "https://auth.shellshift.test",
        oidcSub: "player-e2e-sub",
        name: "Contender One",
        role: "USER",
      },
    });

    // 2. Fetch an existing seeded challenge
    const challenge = await prisma.challenge.findFirst({
      where: { slug: "operation-inversion" },
    });
    expect(challenge).not.toBeNull();
    if (!challenge) return;

    // 3. Admin creates and publishes a scheduled game
    const now = new Date();
    const game = await prisma.event.create({
      data: {
        slug: `e2e-game-${Date.now()}`,
        name: "E2E Invitational Sprint",
        description: "Automated end-to-end individual competition test.",
        status: "PUBLISHED",
        visibility: "PUBLIC",
        mode: "POINTS_TOURNAMENT",
        registrationOpensAt: new Date(now.getTime() - 3600000),
        registrationClosesAt: new Date(now.getTime() + 7200000),
        startTime: new Date(now.getTime() - 60000), // started 1 min ago -> LIVE
        endTime: new Date(now.getTime() + 3600000),   // ends in 1 hour
        timezone: "UTC",
        createdById: adminUser.id,
        challenges: {
          create: [
            {
              challengeId: challenge.id,
              order: 1,
              pointsOverride: 1000,
            },
          ],
        },
      },
      include: {
        challenges: true,
      },
    });
    expect(game.id).toBeDefined();
    expect(game.challenges.length).toBe(1);

    // Verify lifecycle phase is LIVE
    const phase = deriveGamePhase(
      {
        status: game.status as any,
        registrationOpensAt: game.registrationOpensAt!,
        registrationClosesAt: game.registrationClosesAt!,
        startsAt: game.startTime!,
        endsAt: game.endTime!,
      },
      new Date()
    );
    expect(phase).toBe("LIVE");

    // 4. Player registers for the game
    const registration = await prisma.gameRegistration.create({
      data: {
        eventId: game.id,
        userId: playerUser.id,
        status: "REGISTERED",
      },
    });
    expect(registration.id).toBeDefined();
    expect(registration.userId).toBe(playerUser.id);

    // 5. Player starts a run
    const initialVfs = createInitialVfs(JSON.parse(challenge.initialFilesystem));
    const run = await prisma.run.create({
      data: {
        eventId: game.id,
        userId: playerUser.id,
        challengeId: challenge.id,
        status: "IN_PROGRESS",
        startedAt: new Date(),
        deadlineAt: new Date(Date.now() + 600000), // 10 minutes
        filesystemState: JSON.stringify(initialVfs),
        currentWorkingDir: "/workspace",
        commandCount: 0,
      },
    });
    expect(run.status).toBe("IN_PROGRESS");

    // 6. Player executes commands in the virtual environment
    const mappings = JSON.parse(challenge.commandMappings);
    const commandResult = executeCommand(initialVfs, "cat note.txt", mappings);

    await prisma.commandLog.create({
      data: {
        runId: run.id,
        userId: playerUser.id,
        enteredCommand: "cat note.txt",
        mappedOperation: commandResult.mappedOperation,
        output: commandResult.output,
        executionTimeMs: 15,
      },
    });

    // 7. Objective evaluation and score calculation
    const objectiveConfig = JSON.parse(challenge.objectiveConfig);
    const evalResult = evaluateObjective(initialVfs, objectiveConfig, 1);
    expect(evalResult).toBeDefined();

    const scoringConfig = JSON.parse(challenge.scoringConfig || "{}");
    const completedAt = new Date(run.startedAt.getTime() + 45000); // 45 seconds later
    const scoreResult = calculateRunScore({
      status: "COMPLETED",
      startedAt: run.startedAt,
      completedAt,
      verifiedObjectiveIds: evalResult.isCompleted ? ["obj-1"] : [],
      revealedHintPenalties: [],
      config: scoringConfig,
      objectives: [{ id: "obj-1", description: "Objective 1", points: 500 }],
    });

    // 8. Player completes the challenge
    const completedRun = await prisma.run.update({
      where: { id: run.id },
      data: {
        status: "COMPLETED",
        completedAt,
        durationMs: 45000,
        commandCount: 1,
        finalScore: scoreResult.finalScore,
        baseScore: scoreResult.baseScore,
        objectivePoints: scoreResult.objectivePoints,
        speedBonus: scoreResult.speedBonus,
        hintPenalty: scoreResult.hintPenalty,
        completionBonus: scoreResult.completionBonus,
        scoringBreakdown: JSON.stringify(scoreResult),
      },
    });
    expect(completedRun.status).toBe("COMPLETED");
    expect(completedRun.finalScore).toBeGreaterThan(0);

    // 9. Verify standings update
    const standingsResult = await getGameStandings(game.id, playerUser.id);
    expect(standingsResult.standings.length).toBe(1);
    expect(standingsResult.standings[0].userId).toBe(playerUser.id);
    expect(standingsResult.standings[0].totalScore).toBe(completedRun.finalScore);
    expect(standingsResult.standings[0].challengesCompleted).toBe(1);
    expect(standingsResult.standings[0].rank).toBe(1);
    expect(standingsResult.standings[0].isViewer).toBe(true);

    // 10. Admin ends the competition
    const endedGame = await prisma.event.update({
      where: { id: game.id },
      data: { status: "ENDED" },
    });
    expect(endedGame.status).toBe("ENDED");

    const endedPhase = deriveGamePhase(
      {
        status: endedGame.status as any,
        registrationOpensAt: endedGame.registrationOpensAt!,
        registrationClosesAt: endedGame.registrationClosesAt!,
        startsAt: endedGame.startTime!,
        endsAt: endedGame.endTime!,
      },
      new Date()
    );
    expect(endedPhase).toBe("ENDED");

    // Clean up test game and its records
    await prisma.commandLog.deleteMany({ where: { runId: run.id } });
    await prisma.run.delete({ where: { id: run.id } });
    await prisma.gameRegistration.delete({ where: { id: registration.id } });
    await prisma.eventChallenge.deleteMany({ where: { eventId: game.id } });
    await prisma.event.delete({ where: { id: game.id } });
  }, 25000);
});
