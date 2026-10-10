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

  // Comprehensive positive & negative solution walkthroughs for all 20 challenges
  const solutions: Record<string, { negativeCmd: string; steps: string[] }> = {
    "operation-inversion": {
      negativeCmd: "cat /system/signal.txt",
      steps: ["cd /workspace/breach", "ls /system/signal.txt"],
    },
    "the-cryptic-agent": {
      negativeCmd: "touch /workspace/agent.key",
      steps: ["rm /etc/shadow_cipher.txt", "pwd /workspace/agent.key"],
    },
    "deep-breach-babel": {
      negativeCmd: "cp /opt/vault/secrets/fragment_a.dat",
      steps: [
        "grep -p /opt/vault/core",
        "mv /opt/vault/secrets/fragment_a.dat /opt/vault/core/master.key",
        "cp /opt/vault/secrets/fragment_a.dat",
      ],
    },
    "pathfinder-basics": {
      negativeCmd: "pwd",
      steps: ["ls /routes", "touch /routes/recovery"],
    },
    "morse-mail": {
      negativeCmd: "cat /mail/inbox/dispatch.txt",
      steps: ["cd /workspace/dispatch"],
    },
    "binary-breadcrumbs": {
      negativeCmd: "ls /cache/node_alpha",
      steps: ["ls /cache/node_beta/verified"],
    },
    "hex-in-plain-sight": {
      negativeCmd: "echo /workspace/patch.ack",
      steps: ["cat /workspace/patch.ack"],
    },
    "directory-flip": {
      negativeCmd: "mkdir /staging/production",
      steps: ["mkdir -r /staging/temp_garbage", "rm /staging/production"],
    },
    "the-missing-file": {
      negativeCmd: "head /vault/keys/decoy_alpha.key",
      steps: [
        "head /vault/keys/authentic.key",
        "cat /vault/keys/authentic.key /workspace/unlocked.key",
      ],
    },
    "first-flag": {
      negativeCmd: "echo /relay/checkpoint_alpha/flag.txt",
      steps: [
        "touch /relay/checkpoint_alpha",
        "echo /relay/checkpoint_alpha/flag.txt",
      ],
    },
    "dead-letter": {
      negativeCmd: "mv /dropzone/locker_1",
      steps: ["cd /dropzone/locker_3/classified/letter.txt /workspace/recovered.txt"],
    },
    "log-diver": {
      negativeCmd: "cat /var/log/syslog",
      steps: [
        "cat CRITICAL /var/log/audit.log",
        "grep /var/log/incident_ack.log",
      ],
    },
    "the-relocation-protocol": {
      negativeCmd: "mv /transport/dock/package_alpha.pkg",
      steps: ["cp /transport/dock/package_alpha.pkg /transport/vault/package_alpha.pkg"],
    },
    "needle-in-the-archive": {
      negativeCmd: "cat /archive",
      steps: [
        "cat /archive -name target_artifact.dat",
        "touch /archive/sector_3/box_d/target_artifact.dat /workspace/target.dat",
      ],
    },
    "ghost-signal": {
      negativeCmd: "mkdir /signals/beacon/freq.lock",
      steps: [
        "rm -p /signals/beacon",
        "mkdir /signals/beacon/freq.lock",
      ],
    },
    "three-keys": {
      negativeCmd: "cat /gate/key1_source.txt",
      steps: [
        "pwd /gate/vault/slot1",
        "cd /gate/key1_source.txt /gate/vault/slot1/key1.txt",
        "cat /gate/key1_source.txt",
      ],
    },
    "decoy-protocol": {
      negativeCmd: "cp /evidence/authentic_case.dat",
      steps: [
        "grep /evidence/authentic_case.dat /workspace/case.dat",
        "cp /evidence/fake_1.doc",
        "cp /evidence/fake_2.doc",
      ],
    },
    "broken-chain": {
      negativeCmd: "touch /pipeline/step_1_input.dat /pipeline/staging/run1/input.dat",
      steps: [
        "rm -p /pipeline/staging/run1",
        "touch /pipeline/step_1_input.dat /pipeline/staging/run1/input.dat",
      ],
    },
    "recursive-vault": {
      negativeCmd: "cp /vault/level1/level2/level3/chamber_b/target_fragment.dat",
      steps: [
        "find -p /vault/secure_chamber",
        "grep /vault/level1/level2/level3/chamber_b/target_fragment.dat /vault/secure_chamber/core.key",
        "cp /vault/level1/level2/temp_buffer.tmp",
        "cp /vault/level1/level2/level3/chamber_a/decoy.bin",
      ],
    },
    "final-convergence": {
      negativeCmd: "tail /core/matrix/stage2/fragment_beta.bin",
      steps: [
        "cd -p /core/vault/fusion",
        "head /core/matrix/stage1/fragment_alpha.bin /core/vault/fusion/part1.dat",
        "head /core/matrix/stage2/fragment_beta.bin /core/vault/fusion/part2.dat",
        "tail /core/matrix/garbage_buffer.log",
        "tail /core/matrix/stage1/fragment_alpha.bin",
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
