import { describe, expect, it } from "vitest";
import { SEED_CHALLENGES, SeedChallengeDef } from "./seedData";
import { validateChallengeDefinition } from "./validator";
import { executeCommand } from "../vfs/engine";
import { evaluateObjective } from "../vfs/evaluator";
import { createInitialVfs } from "../vfs/vfs";
import { VfsState } from "../vfs/types";
import { calculateRunScore } from "../scoring/scoringEngine";

function setupInitialVfs(challenge: SeedChallengeDef): VfsState {
  return createInitialVfs(challenge.initialFilesystem);
}

describe("Challenge Catalog & Solvability Engine Verification", () => {
  it("contains exactly 20 challenges with exact difficulty distribution", () => {
    expect(SEED_CHALLENGES).toHaveLength(20);

    const counts = { EASY: 0, MEDIUM: 0, HARD: 0 };
    for (const c of SEED_CHALLENGES) {
      expect(["EASY", "MEDIUM", "HARD"]).toContain(c.difficulty);
      counts[c.difficulty]++;
    }

    expect(counts.EASY).toBe(8);
    expect(counts.MEDIUM).toBe(9);
    expect(counts.HARD).toBe(3);
  });

  it("preserves stable IDs and details for the original 3 challenges", () => {
    const c1 = SEED_CHALLENGES.find((c) => c.slug === "operation-inversion");
    const c2 = SEED_CHALLENGES.find((c) => c.slug === "the-cryptic-agent");
    const c3 = SEED_CHALLENGES.find((c) => c.slug === "deep-breach-babel");

    expect(c1).toBeDefined();
    expect(c1?.order).toBe(1);
    expect(c1?.difficulty).toBe("EASY");

    expect(c2).toBeDefined();
    expect(c2?.order).toBe(2);
    expect(c2?.difficulty).toBe("MEDIUM");

    expect(c3).toBeDefined();
    expect(c3?.order).toBe(3);
    expect(c3?.difficulty).toBe("HARD");
  });

  it("passes server-side configuration validation for every single challenge", () => {
    for (const challenge of SEED_CHALLENGES) {
      const res = validateChallengeDefinition(challenge);
      expect(res.valid, `Challenge ${challenge.order} (${challenge.slug}) validation failed: ${res.errors.join(", ")}`).toBe(true);
      expect(res.errors).toHaveLength(0);
    }
  });

  it("verifies clue encoding integrity across all challenges", () => {
    for (const challenge of SEED_CHALLENGES) {
      for (const clue of challenge.clues) {
        expect(clue.encodedContent).toBeDefined();
        expect(clue.encodedContent.length).toBeGreaterThan(0);
        expect(clue.plaintextAnswer).toBeDefined();
        expect(clue.plaintextAnswer.length).toBeGreaterThan(0);
      }
    }
  });

  it("verifies path confinement preventing escape from VFS sandbox", () => {
    for (const challenge of SEED_CHALLENGES) {
      const vfs = setupInitialVfs(challenge);
      const res = executeCommand(vfs, "ls ../../../../../etc/passwd", challenge.commandMappings);
      expect(res.newCwd.startsWith("/")).toBe(true);
      expect(res.newCwd.includes("..")).toBe(false);
    }
  });

  // Comprehensive positive & negative solution walkthroughs for all 20 simple challenges
  const solutions: Record<string, { negativeCmd: string; steps: string[] }> = {
    "operation-inversion": {
      negativeCmd: "cat /workspace/signal.txt",
      steps: ["cd /workspace/breach", "ls /workspace/signal.txt"],
    },
    "the-cryptic-agent": {
      negativeCmd: "pwd",
      steps: ["rm /workspace/notes.txt", "pwd /workspace/agent.key"],
    },
    "deep-breach-babel": {
      negativeCmd: "cat /workspace/secret.key",
      steps: [
        "grep -p /workspace/vault/core",
        "mv /workspace/secret.key /workspace/vault/core/secret.key",
        "cp /workspace/temp.tmp",
      ],
    },
    "pathfinder-basics": {
      negativeCmd: "ls /workspace",
      steps: ["cd project"],
    },
    "morse-mail": {
      negativeCmd: "cat /workspace/other.txt",
      steps: ["touch /workspace/note.txt", "cat /workspace/read.txt"],
    },
    "binary-breadcrumbs": {
      negativeCmd: "cat /workspace/message.txt",
      steps: ["cd /workspace/secret"],
    },
    "hex-in-plain-sight": {
      negativeCmd: "ls /workspace",
      steps: ["mkdir /workspace/temp.txt"],
    },
    "directory-flip": {
      negativeCmd: "cat /workspace/decoy.txt",
      steps: ["touch /workspace/flag.txt /workspace/found.txt"],
    },
    "the-missing-file": {
      negativeCmd: "cat /workspace/data.txt",
      steps: ["mv /workspace/data.txt /workspace/backup/data.txt"],
    },
    "first-flag": {
      negativeCmd: "cat /workspace/briefing.txt",
      steps: [
        "cd /workspace/mission",
        "cp /workspace/briefing.txt /workspace/mission/briefing.txt",
      ],
    },
    "dead-letter": {
      negativeCmd: "ls /workspace",
      steps: ["cd /workspace/alpha", "cd /workspace/beta"],
    },
    "log-diver": {
      negativeCmd: "find /workspace -name other",
      steps: [
        "find /workspace -name secret.txt",
        "cp /workspace/sub1/sub2/sub3/secret.txt /workspace/found.txt",
      ],
    },
    "the-relocation-protocol": {
      negativeCmd: "ls /workspace",
      steps: ["mv /workspace/report.doc /workspace/archive/report.doc"],
    },
    "needle-in-the-archive": {
      negativeCmd: "ls /workspace",
      steps: [
        "grep ERROR /workspace/server.log",
        "touch /workspace/alert.txt",
      ],
    },
    "ghost-signal": {
      negativeCmd: "cat /workspace/junk.txt",
      steps: [
        "rm /workspace/safe",
        "mkdir /workspace/junk.txt",
      ],
    },
    "three-keys": {
      negativeCmd: "cat /workspace/code.js",
      steps: [
        "cp /workspace/code.js /workspace/src/code.js",
        "cp /workspace/style.css /workspace/styles/style.css",
      ],
    },
    "decoy-protocol": {
      negativeCmd: "cat /workspace/decoy.txt",
      steps: [
        "cat /workspace/target_omega.txt",
        "touch /workspace/confirmation.txt",
      ],
    },
    "broken-chain": {
      negativeCmd: "cat /workspace/instructions.txt",
      steps: [
        "cd /workspace/vault",
        "cp /workspace/data.bin /workspace/vault/data.bin",
      ],
    },
    "recursive-vault": {
      negativeCmd: "cat /workspace/key.dat",
      steps: [
        "grep /workspace/secure",
        "cp /workspace/key.dat /workspace/secure/key.dat",
      ],
    },
    "final-convergence": {
      negativeCmd: "cat /workspace/notes.txt",
      steps: [
        "cd /workspace/production",
        "cp /workspace/artifact.dat /workspace/production/artifact.dat",
        "mv /workspace/old_cache.tmp",
      ],
    },
  };

  it("verifies every single challenge has a valid, working walkthrough and rejects negative path", () => {
    for (const challenge of SEED_CHALLENGES) {
      const sol = solutions[challenge.slug];
      expect(sol, `Missing solution walkthrough for challenge: ${challenge.slug}`).toBeDefined();

      // Negative Test: Run incorrect command
      const negVfs = setupInitialVfs(challenge);
      executeCommand(negVfs, sol.negativeCmd, challenge.commandMappings);
      const negEval = evaluateObjective(negVfs, challenge.objectiveConfig, 1);
      expect(negEval.isCompleted, `Challenge ${challenge.slug} accidentally completed on incorrect command: ${sol.negativeCmd}`).toBe(false);

      // Positive Test: Execute solution walkthrough
      const posVfs = setupInitialVfs(challenge);
      let cmdCount = 0;
      for (const step of sol.steps) {
        cmdCount++;
        const res = executeCommand(posVfs, step, challenge.commandMappings);
        expect(res.exitCode, `Command failed in ${challenge.slug}: ${step} (output: ${res.output})`).toBe(0);
      }

      const posEval = evaluateObjective(posVfs, challenge.objectiveConfig, cmdCount);
      expect(
        posEval.isCompleted,
        `Challenge ${challenge.slug} failed to complete. Passed ${posEval.completedRules}/${posEval.totalRules} rules.`
      ).toBe(true);

      // Scoring Engine Verification
      const now = Date.now();
      const scoreRes = calculateRunScore({
        status: "COMPLETED",
        startedAt: new Date(now - 300000), // 5 min ago
        completedAt: new Date(now),
        verifiedObjectiveIds: challenge.objectiveConfig.rules.map((r) => r.id),
        objectives: challenge.objectiveConfig.rules.map((r) => ({
          id: r.id,
          points: r.points,
          description: r.description,
        })),
        revealedHintPenalties: [],
        config: challenge.scoringConfig,
      });

      expect(scoreRes.isCompleted).toBe(true);
      expect(scoreRes.finalScore).toBeGreaterThan(0);
      expect(scoreRes.speedBonus).toBeGreaterThan(0);
      expect(scoreRes.completionBonus).toBe(challenge.scoringConfig.completionBonus);
    }
  });
});
