import { describe, expect, it } from "vitest";
import { SEED_CHALLENGES, SeedChallengeDef } from "./seedData";
import { validateChallengeDefinition } from "./validator";
import { executeCommand } from "../vfs/engine";
import { evaluateObjective } from "../vfs/evaluator";
import { createInitialVfs } from "../vfs/vfs";
import { VfsState } from "../vfs/types";
import { calculateRunScore } from "../scoring/scoringEngine";
import { decodeCipher } from "../ciphers/ciphers";
import { CHALLENGE_SOLUTIONS, validateCatalogIntegrity } from "./solutions";

function setupInitialVfs(challenge: SeedChallengeDef): VfsState {
  return createInitialVfs(challenge.initialFilesystem);
}

describe("Challenge Catalog & Solvability Engine Verification", () => {
  it("requires one solution for every unique challenge slug and order", () => {
    expect(() =>
      validateCatalogIntegrity(SEED_CHALLENGES, CHALLENGE_SOLUTIONS),
    ).not.toThrow();

    const duplicateSlug = [
      { ...SEED_CHALLENGES[0], order: 999 },
      ...SEED_CHALLENGES,
    ];
    expect(() =>
      validateCatalogIntegrity(duplicateSlug, CHALLENGE_SOLUTIONS),
    ).toThrow("Duplicate challenge slug: operation-inversion");

    const duplicateOrder = [
      ...SEED_CHALLENGES,
      { ...SEED_CHALLENGES[0], slug: "duplicate-order" },
    ];
    expect(() =>
      validateCatalogIntegrity(duplicateOrder, CHALLENGE_SOLUTIONS),
    ).toThrow("Duplicate challenge order 1: duplicate-order");

    const missingSolution = { ...CHALLENGE_SOLUTIONS };
    delete missingSolution["operation-inversion"];
    expect(() =>
      validateCatalogIntegrity(SEED_CHALLENGES, missingSolution),
    ).toThrow("Missing solution for challenge: operation-inversion");
  });

  it("contains exactly 50 challenges with exact difficulty distribution", () => {
    expect(SEED_CHALLENGES).toHaveLength(50);

    const counts = { EASY: 0, MEDIUM: 0, HARD: 0 };
    for (const c of SEED_CHALLENGES) {
      expect(["EASY", "MEDIUM", "HARD"]).toContain(c.difficulty);
      counts[c.difficulty]++;
    }

    expect(counts.EASY).toBe(20);
    expect(counts.MEDIUM).toBe(20);
    expect(counts.HARD).toBe(10);
    expect(SEED_CHALLENGES.map((challenge) => challenge.order)).toEqual(
      Array.from({ length: 50 }, (_, index) => index + 1),
    );
  });

  it("enforces all remapped commands are strictly pairwise symmetric swaps with no open chains", () => {
    for (const challenge of SEED_CHALLENGES) {
      const mappings = challenge.commandMappings || {};
      for (const [cmd, target] of Object.entries(mappings)) {
        expect(
          mappings[target],
          `Challenge ${challenge.slug} has asymmetric mapping for '${cmd}' -> '${target}': missing reverse swap '${target}' -> '${cmd}'`,
        ).toBe(cmd);
      }
      expect(
        mappings.ls,
        `Challenge ${challenge.slug} should not remap 'ls'; standard navigation utilities must remain unmapped`,
      ).toBeUndefined();
    }
  });

  it("preserves stable IDs and details for the original 3 challenges", () => {
    const c1 = SEED_CHALLENGES.find((c) => c.slug === "operation-inversion");
    const c2 = SEED_CHALLENGES.find((c) => c.slug === "the-cryptic-agent");
    const c3 = SEED_CHALLENGES.find((c) => c.slug === "deep-breach-babel");

    expect(c1).toBeDefined();
    expect(c1?.order).toBe(1);
    expect(c1?.difficulty).toBe("EASY");

    expect(c2).toBeDefined();
    expect(c2?.order).toBe(9);
    expect(c2?.difficulty).toBe("MEDIUM");

    expect(c3).toBeDefined();
    expect(c3?.order).toBe(18);
    expect(c3?.difficulty).toBe("HARD");
  });

  it("uses concise beginner-friendly player instructions", () => {
    const unexplainedJargon =
      /\b(?:infiltration|provisioning|enclave|sanitization|dispatch|breach)\b/i;

    for (const challenge of SEED_CHALLENGES) {
      expect(
        challenge.title.length,
        `${challenge.slug} needs a short title`,
      ).toBeGreaterThan(0);
      expect(
        challenge.title.length,
        `${challenge.slug} title is too long`,
      ).toBeLessThanOrEqual(48);
      expect(
        challenge.title,
        `${challenge.slug} title uses unexplained jargon`,
      ).not.toMatch(unexplainedJargon);
      expect(
        challenge.description?.trim(),
        `${challenge.slug} needs a description`,
      ).toBeTruthy();
      expect(
        challenge.description!.length,
        `${challenge.slug} description is too long`,
      ).toBeLessThanOrEqual(180);
      expect(
        challenge.timeLimitSeconds,
        `${challenge.slug} time limit is too short`,
      ).toBeGreaterThanOrEqual(300);
      expect(
        challenge.timeLimitSeconds,
        `${challenge.slug} time limit is too long`,
      ).toBeLessThanOrEqual(1800);
      expect(
        challenge.hints.length,
        `${challenge.slug} needs two progressive hints`,
      ).toBeGreaterThanOrEqual(2);
      expect(
        challenge.objectiveConfig.description.trim(),
        `${challenge.slug} needs an objective`,
      ).toBeTruthy();
    }
  });

  it("passes server-side configuration validation for every single challenge", () => {
    for (const challenge of SEED_CHALLENGES) {
      const res = validateChallengeDefinition(challenge);
      expect(
        res.valid,
        `Challenge ${challenge.order} (${challenge.slug}) validation failed: ${res.errors.join(", ")}`,
      ).toBe(true);
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
        const decoded = decodeCipher(clue.type, clue.encodedContent);
        const normalize = (value: string) =>
          value.replace(/\s+/g, " ").trim().toUpperCase();
        expect(
          normalize(decoded),
          `Challenge ${challenge.order} (${challenge.slug}) clue ${clue.id} does not decode to its configured answer.`,
        ).toBe(normalize(clue.plaintextAnswer));
      }
    }
  });

  it("verifies path confinement preventing escape from VFS sandbox", () => {
    for (const challenge of SEED_CHALLENGES) {
      const vfs = setupInitialVfs(challenge);
      const res = executeCommand(
        vfs,
        "ls ../../../../../etc/passwd",
        challenge.commandMappings,
      );
      expect(res.newCwd.startsWith("/")).toBe(true);
      expect(res.newCwd.includes("..")).toBe(false);
    }
  });

  it("verifies every single challenge has a valid, working walkthrough and rejects negative path", () => {
    for (const challenge of SEED_CHALLENGES) {
      const sol = CHALLENGE_SOLUTIONS[challenge.slug];
      expect(
        sol,
        `Missing solution walkthrough for challenge: ${challenge.slug}`,
      ).toBeDefined();

      // Negative Test: Run incorrect command
      const negVfs = setupInitialVfs(challenge);
      executeCommand(negVfs, sol.negativeCmd, challenge.commandMappings);
      const negEval = evaluateObjective(negVfs, challenge.objectiveConfig, 1);
      expect(
        negEval.isCompleted,
        `Challenge ${challenge.slug} accidentally completed on incorrect command: ${sol.negativeCmd}`,
      ).toBe(false);

      // Positive Test: Execute solution walkthrough
      const posVfs = setupInitialVfs(challenge);
      let cmdCount = 0;
      for (const step of sol.steps) {
        cmdCount++;
        const res = executeCommand(posVfs, step, challenge.commandMappings);
        expect(
          res.exitCode,
          `Command failed in ${challenge.slug}: ${step} (output: ${res.output})`,
        ).toBe(0);
      }

      const posEval = evaluateObjective(
        posVfs,
        challenge.objectiveConfig,
        cmdCount,
      );
      expect(
        posEval.isCompleted,
        `Challenge ${challenge.slug} failed to complete. Passed ${posEval.completedRules}/${posEval.totalRules} rules.`,
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
      expect(scoreRes.objectivePoints).toBe(
        challenge.scoringConfig.intermediateBudget,
      );
      expect(scoreRes.finalScore).toBeGreaterThan(0);
      expect(scoreRes.speedBonus).toBeGreaterThan(0);
      expect(scoreRes.completionBonus).toBe(
        challenge.scoringConfig.completionBonus,
      );
    }
  });

  it("verifies every challenge objective rules sum to exactly the intermediate budget (500 pts)", () => {
    for (const challenge of SEED_CHALLENGES) {
      const sumPoints = challenge.objectiveConfig.rules.reduce(
        (sum, r) => sum + r.points,
        0,
      );
      expect(
        sumPoints,
        `Challenge ${challenge.order} (${challenge.slug}) rules sum (${sumPoints}) does not match intermediate budget (${challenge.scoringConfig.intermediateBudget})`,
      ).toBe(challenge.scoringConfig.intermediateBudget);
    }
  });

  it("verifies no challenge is pre-completed before running any commands", () => {
    for (const challenge of SEED_CHALLENGES) {
      const initVfs = setupInitialVfs(challenge);
      const initEval = evaluateObjective(initVfs, challenge.objectiveConfig, 0);
      expect(
        initEval.isCompleted,
        `Challenge ${challenge.order} (${challenge.slug}) is prematurely completed on initial state!`,
      ).toBe(false);
    }
  });

  it("verifies objective rules conform to evaluator schema with valid target paths and positive points", () => {
    const validRuleTypes = new Set([
      "dir_exists",
      "file_exists",
      "file_deleted",
      "dir_deleted",
      "file_contains",
      "file_exact",
      "file_moved",
      "min_commands",
      "cwd_equals",
    ]);

    for (const challenge of SEED_CHALLENGES) {
      for (const rule of challenge.objectiveConfig.rules) {
        expect(
          validRuleTypes.has(rule.type),
          `Challenge ${challenge.slug} rule ${rule.id} has invalid type: ${rule.type}`,
        ).toBe(true);
        expect(
          rule.points,
          `Challenge ${challenge.slug} rule ${rule.id} points must be positive`,
        ).toBeGreaterThan(0);
        expect(
          rule.description.trim().length,
          `Challenge ${challenge.slug} rule ${rule.id} needs description`,
        ).toBeGreaterThan(0);

        if (["dir_exists", "file_exists", "file_deleted", "dir_deleted", "file_moved", "cwd_equals"].includes(rule.type)) {
          expect(
            rule.path?.startsWith("/"),
            `Challenge ${challenge.slug} rule ${rule.id} path must be absolute: ${rule.path}`,
          ).toBe(true);
        }
        if (rule.type === "file_contains" || rule.type === "file_exact") {
          expect(
            rule.path?.startsWith("/"),
            `Challenge ${challenge.slug} rule ${rule.id} path must be absolute: ${rule.path}`,
          ).toBe(true);
          expect(
            rule.content,
            `Challenge ${challenge.slug} rule ${rule.id} needs content`,
          ).toBeDefined();
        }
      }
    }
  });
});
