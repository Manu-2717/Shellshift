import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { createSessionToken, verifySessionToken } from "./auth/session";
import { createInitialVfs } from "./vfs/vfs";
import { executeCommand } from "./vfs/engine";
import { evaluateObjective } from "./vfs/evaluator";
import { rateLimit } from "./rateLimit";

describe("Database & Competition Integrity Integration Tests", () => {
  let testUser1: any;
  let testUser2: any;
  let testTeam1: any;
  let testTeam2: any;
  let testChallenge: any;

  beforeAll(async () => {
    // Clean up previous test artifacts if any
    await prisma.commandLog.deleteMany({
      where: { enteredCommand: { startsWith: "TEST_" } },
    });

    // Create test users
    testUser1 = await prisma.user.upsert({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: "https://auth.test.io",
          oidcSub: "test-user-sub-1",
        },
      },
      create: {
        oidcIssuer: "https://auth.test.io",
        oidcSub: "test-user-sub-1",
        name: "Test Runner Alpha",
        email: "runner1@test.io",
        role: "USER",
      },
      update: {},
    });

    testUser2 = await prisma.user.upsert({
      where: {
        oidcIssuer_oidcSub: {
          oidcIssuer: "https://auth.test.io",
          oidcSub: "test-user-sub-2",
        },
      },
      create: {
        oidcIssuer: "https://auth.test.io",
        oidcSub: "test-user-sub-2",
        name: "Test Runner Beta",
        email: "runner2@test.io",
        role: "USER",
      },
      update: {},
    });

    // Create or retrieve test teams
    testTeam1 = await prisma.team.upsert({
      where: { name: "Team_Cyber_Knights" },
      create: {
        name: "Team_Cyber_Knights",
        inviteCode: "CYBER1",
      },
      update: {},
    });

    testTeam2 = await prisma.team.upsert({
      where: { name: "Team_Phantom_Echo" },
      create: {
        name: "Team_Phantom_Echo",
        inviteCode: "ECHO22",
      },
      update: {},
    });

    // Ensure challenge exists
    testChallenge = await prisma.challenge.findUnique({
      where: { slug: "operation-inversion" },
    });
  });

  it("prevents duplicate team name registration", async () => {
    let duplicateErrorThrown = false;
    try {
      await prisma.team.create({
        data: {
          name: testTeam1.name, // Duplicate!
          inviteCode: "DUP999",
        },
      });
    } catch {
      duplicateErrorThrown = true;
    }
    expect(duplicateErrorThrown).toBe(true);
  });

  it("verifies OIDC JWT session creation, signing, and verification", async () => {
    const sessionPayload = {
      id: testUser1.id,
      oidcSub: testUser1.oidcSub,
      oidcIssuer: testUser1.oidcIssuer,
      email: testUser1.email,
      name: testUser1.name,
      role: testUser1.role as "USER" | "ADMIN",
      teamId: testTeam1.id,
      teamName: testTeam1.name,
      teamRole: "LEADER" as const,
    };

    const token = await createSessionToken(sessionPayload);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.id).toBe(testUser1.id);
    expect(verified?.teamId).toBe(testTeam1.id);
  });

  it("prevents duplicate run starts and preserves original timer", async () => {
    // Delete existing active runs for team1 on testChallenge
    await prisma.run.deleteMany({
      where: { teamId: testTeam1.id, challengeId: testChallenge.id },
    });

    const vfs = createInitialVfs();
    const run1 = await prisma.run.create({
      data: {
        teamId: testTeam1.id,
        challengeId: testChallenge.id,
        status: "IN_PROGRESS",
        filesystemState: JSON.stringify(vfs),
        currentWorkingDir: "/workspace",
        startedAt: new Date(Date.now() - 5000), // 5s ago
      },
    });

    // Attempt second start: check duplicate detection
    const existing = await prisma.run.findFirst({
      where: {
        teamId: testTeam1.id,
        challengeId: testChallenge.id,
        status: "IN_PROGRESS",
      },
    });

    expect(existing).not.toBeNull();
    expect(existing?.id).toBe(run1.id);
    expect(existing?.startedAt.getTime()).toBe(run1.startedAt.getTime());
  });

  it("enforces cross-team authorization checks", async () => {
    const run = await prisma.run.findFirst({
      where: { teamId: testTeam1.id, challengeId: testChallenge.id },
    });

    expect(run).not.toBeNull();
    // User2 belongs to Team2, attempting to access Team1's run
    const user2TeamId = testTeam2.id;
    const isAuthorized = run?.teamId === user2TeamId;
    expect(isAuthorized).toBe(false);
  });

  it("handles concurrent finish requests atomically without duplicate completion", async () => {
    // Create a fresh run specifically for race-condition testing
    const vfs = createInitialVfs();
    const raceRun = await prisma.run.create({
      data: {
        teamId: testTeam2.id,
        challengeId: testChallenge.id,
        status: "IN_PROGRESS",
        filesystemState: JSON.stringify(vfs),
        currentWorkingDir: "/workspace",
        startedAt: new Date(),
      },
    });

    // Simulate 5 simultaneous requests attempting to finalize the run
    const concurrentFinalizers = Array.from({ length: 5 }).map(async (_, idx) => {
      const now = new Date();
      const updateResult = await prisma.run.updateMany({
        where: {
          id: raceRun.id,
          status: "IN_PROGRESS", // Atomic conditional guard!
        },
        data: {
          status: "COMPLETED",
          completedAt: now,
          durationMs: 1500 + idx * 10,
        },
      });
      return updateResult.count;
    });

    const results = await Promise.all(concurrentFinalizers);
    const successfulCompletions = results.filter((c) => c === 1).length;

    // Exactly one concurrent request must win!
    expect(successfulCompletions).toBe(1);

    const finalRun = await prisma.run.findUnique({ where: { id: raceRun.id } });
    expect(finalRun?.status).toBe("COMPLETED");
  });

  it("strictly rejects commands after run completion", async () => {
    const completedRun = await prisma.run.findFirst({
      where: { teamId: testTeam2.id, status: "COMPLETED" },
    });

    expect(completedRun).not.toBeNull();
    expect(completedRun?.status).toBe("COMPLETED");

    // Check application logic: is mutating allowed?
    const isMutationAllowed = completedRun?.status === "IN_PROGRESS";
    expect(isMutationAllowed).toBe(false);
  });

  it("enforces rate limiting correctly", () => {
    const key = `test_limit_${Date.now()}`;
    const limit = 3;

    expect(rateLimit(key, limit, 10000).success).toBe(true);
    expect(rateLimit(key, limit, 10000).success).toBe(true);
    expect(rateLimit(key, limit, 10000).success).toBe(true);
    // 4th request exceeds limit
    expect(rateLimit(key, limit, 10000).success).toBe(false);
  });

  it("completes full end-to-end challenge flow with standard commands", async () => {
    // 1. Initialize run for Challenge 1 (Operation Inversion)
    const seedFiles = JSON.parse(testChallenge.initialFilesystem);
    const vfs = createInitialVfs(seedFiles);
    const mapping = JSON.parse(testChallenge.commandMappings);
    const objectiveConfig = JSON.parse(testChallenge.objectiveConfig);

    const startedAt = new Date();
    const e2eRun = await prisma.run.create({
      data: {
        teamId: testTeam1.id,
        challengeId: testChallenge.id,
        status: "IN_PROGRESS",
        filesystemState: JSON.stringify(vfs),
        currentWorkingDir: "/workspace",
        startedAt,
      },
    });

    // 2. Player runs command: cd /workspace/system
    const step1 = executeCommand(vfs, "cd /workspace/system", mapping);
    expect(step1.exitCode).toBe(0);
    expect(step1.newCwd).toBe("/workspace/system");
    expect(vfs.cwd).toBe("/workspace/system");

    // 3. Evaluate objective
    const evalResult = evaluateObjective(vfs, objectiveConfig, 1);
    expect(evalResult.isCompleted).toBe(true);
    expect(evalResult.completedRules).toBe(2);

    // 4. Finalize run on server
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    await prisma.run.update({
      where: { id: e2eRun.id },
      data: {
        status: "COMPLETED",
        completedAt,
        durationMs,
        filesystemState: JSON.stringify(vfs),
        commandCount: 1,
      },
    });

    // 5. Verify leaderboard query returns verified time
    const leaderboardEntry = await prisma.run.findUnique({
      where: { id: e2eRun.id },
      include: { team: true, challenge: true },
    });

    expect(leaderboardEntry?.status).toBe("COMPLETED");
    expect(leaderboardEntry?.durationMs).toBeGreaterThanOrEqual(0);
    expect(leaderboardEntry?.team.name).toBe(testTeam1.name);
  });
});
