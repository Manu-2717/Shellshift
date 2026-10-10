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
    expect(c2?.difficulty).toBe("EASY");

    expect(c3).toBeDefined();
    expect(c3?.order).toBe(3);
    expect(c3?.difficulty).toBe("EASY");
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

  // Comprehensive positive & negative solution walkthroughs for all 20 basic Ubuntu challenges
  const solutions: Record<string, { negativeCmd: string; steps: string[] }> = {
    "operation-inversion": {
      negativeCmd: "ls",
      steps: ["cd /workspace/system"],
    },
    "the-cryptic-agent": {
      negativeCmd: "cat /workspace/notes/config.ini",
      steps: [
        "cat /workspace/notes/config.ini",
        "touch /workspace/notes/inspected.log",
      ],
    },
    "deep-breach-babel": {
      negativeCmd: "mkdir /workspace/projects/dummy",
      steps: ["mkdir -p /workspace/projects/webapp/src"],
    },
    "pathfinder-basics": {
      negativeCmd: "touch /workspace/src/dummy.txt",
      steps: [
        "touch /workspace/src/index.html",
        "touch /workspace/src/app.js",
      ],
    },
    "morse-mail": {
      negativeCmd: "cp /workspace/config/settings.json /workspace/config/temp.json",
      steps: ["cp /workspace/config/settings.json /workspace/backups/settings.json.bak"],
    },
    "binary-breadcrumbs": {
      negativeCmd: "cp /workspace/downloads/draft_report.pdf /workspace/documents/report.pdf",
      steps: ["mv /workspace/downloads/draft_report.pdf /workspace/documents/report.pdf"],
    },
    "hex-in-plain-sight": {
      negativeCmd: "rm /workspace/cache/valid_cache.dat",
      steps: [
        "rm /workspace/cache/junk_01.tmp",
        "rm /workspace/cache/junk_02.tmp",
      ],
    },
    "directory-flip": {
      negativeCmd: "rm /workspace/staging/active.txt",
      steps: ["rm -r /workspace/obsolete"],
    },
    "the-missing-file": {
      negativeCmd: "cat /var/log/nginx/access.log",
      steps: [
        "grep 500 /var/log/nginx/access.log",
        "touch /workspace/reports/error_resolved.log",
      ],
    },
    "first-flag": {
      negativeCmd: "ls /etc/app",
      steps: [
        "find /etc -name database.conf",
        "cp /etc/app/deep/nested/sub/database.conf /workspace/database.conf",
      ],
    },
    "dead-letter": {
      negativeCmd: "ls /var/log",
      steps: [
        "head -n 5 /var/log/syslog",
        "touch /workspace/syslog_inspected.ack",
      ],
    },
    "log-diver": {
      negativeCmd: "head /var/log/auth.log",
      steps: [
        "tail -n 10 /var/log/auth.log",
        "touch /workspace/incident_mitigated.ack",
      ],
    },
    "the-relocation-protocol": {
      negativeCmd: "ls -a",
      steps: [
        "ls -a /workspace",
        "cp /workspace/.env.secret /workspace/backups/env_backup.txt",
      ],
    },
    "needle-in-the-archive": {
      negativeCmd: "tree /opt",
      steps: [
        "tree /opt/modules",
        "cp /opt/modules/net/client.js /workspace/dist/client.js",
      ],
    },
    "ghost-signal": {
      negativeCmd: "mkdir /workspace/release",
      steps: [
        "mkdir -p /workspace/release/v1",
        "cp /workspace/src/app.js /workspace/release/v1/app.js",
        "cp /workspace/src/style.css /workspace/release/v1/style.css",
      ],
    },
    "three-keys": {
      negativeCmd: "ls /var/log",
      steps: [
        "mv /var/log/access.log /var/log/archive/access.log.1",
        "touch /var/log/access.log",
        "rm /var/log/access.log.9.gz",
      ],
    },
    "decoy-protocol": {
      negativeCmd: "ls /etc/nginx",
      steps: [
        "cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak",
        "mv /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default",
      ],
    },
    "broken-chain": {
      negativeCmd: "cat /tmp/exploit.sh",
      steps: [
        "grep USER_ESCALATED /var/log/audit/session_02.log",
        "cp /var/log/audit/session_02.log /workspace/forensics/incident.log",
        "rm /tmp/exploit.sh",
      ],
    },
    "recursive-vault": {
      negativeCmd: "ls /mnt/legacy",
      steps: [
        "mkdir -p /srv/storage/production/data",
        "cp /mnt/legacy/db_master.sqlite /srv/storage/production/data/db.sqlite",
        "cp /mnt/legacy/schema.sql /srv/storage/production/data/schema.sql",
        "rm -r /mnt/legacy",
      ],
    },
    "final-convergence": {
      negativeCmd: "ls /workspace/staging",
      steps: [
        "mkdir -p /var/www/production/public",
        "mkdir -p /var/www/production/config",
        "cp /workspace/staging/index.html /var/www/production/public/index.html",
        "cp /workspace/staging/app.js /var/www/production/public/app.js",
        "touch /var/www/production/config/.env",
        "rm -r /workspace/staging",
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
