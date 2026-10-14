import { describe, it, expect } from "vitest";
import {
  calculateSpeedBonus,
  calculateHintPenalty,
  calculateObjectivePoints,
  calculateRunScore,
  validateScoringConfig,
  DEFAULT_SCORING_CONFIG,
  ScoredObjective,
  ScoringConfig,
} from "./scoringEngine";

describe("ShellShift Scoring Engine Unit Tests", () => {
  const sampleObjectives: ScoredObjective[] = [
    { id: "obj_dir", description: "Create breach directory", points: 250 },
    { id: "obj_file", description: "Read signal file", points: 250 },
  ];

  it("validates valid and invalid scoring configurations", () => {
    const validResult = validateScoringConfig(DEFAULT_SCORING_CONFIG, sampleObjectives);
    expect(validResult.valid).toBe(true);
    expect(validResult.errors).toHaveLength(0);

    // Sum of budget exceeds maxBaseScore
    const invalidBudget = validateScoringConfig({
      maxBaseScore: 1000,
      intermediateBudget: 600,
      completionBonus: 300,
      speedBonusMax: 300, // sum = 1200 > 1000
    });
    expect(invalidBudget.valid).toBe(false);
    expect(invalidBudget.errors.some((e) => e.includes("exceeds maxBaseScore"))).toBe(true);

    // Objectives exceed intermediateBudget
    const invalidObjectives = validateScoringConfig(
      { intermediateBudget: 400 },
      sampleObjectives // sum = 500 > 400
    );
    expect(invalidObjectives.valid).toBe(false);
    expect(invalidObjectives.errors.some((e) => e.includes("exceeds configured intermediateBudget"))).toBe(true);
  });

  describe("Exact Numerical Behavior from Prompt Specification", () => {
    // 1,000-point Easy challenge with a 20-minute limit (1200s):
    const easyConfig: ScoringConfig = {
      ...DEFAULT_SCORING_CONFIG,
      maxBaseScore: 1000,
      intermediateBudget: 500,
      completionBonus: 200,
      speedBonusMax: 300,
      hintPenaltyCap: 100,
      difficultyMultiplier: 1.0,
      timeLimitSeconds: 1200,
    };

    const baseStart = new Date("2026-10-10T12:00:00Z");

    it("evaluates: complete with all intermediate points in 5 minutes and no hints -> 925 points", () => {
      const completedAt = new Date(baseStart.getTime() + 5 * 60 * 1000); // 300 seconds
      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: easyConfig,
        objectives: sampleObjectives,
      });

      expect(result.objectivePoints).toBe(500);
      expect(result.completionBonus).toBe(200);
      expect(result.speedBonus).toBe(225); // floor(300 * (1 - 300/1200)) = 225
      expect(result.hintPenalty).toBe(0);
      expect(result.baseScore).toBe(925);
      expect(result.finalScore).toBe(925);
    });

    it("evaluates: complete with all intermediate points in 10 minutes and no hints -> 850 points", () => {
      const completedAt = new Date(baseStart.getTime() + 10 * 60 * 1000); // 600 seconds
      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: easyConfig,
        objectives: sampleObjectives,
      });

      expect(result.objectivePoints).toBe(500);
      expect(result.completionBonus).toBe(200);
      expect(result.speedBonus).toBe(150); // floor(300 * 0.5) = 150
      expect(result.hintPenalty).toBe(0);
      expect(result.baseScore).toBe(850);
      expect(result.finalScore).toBe(850);
    });

    it("evaluates: complete with all intermediate points in 15 minutes and no hints -> 775 points", () => {
      const completedAt = new Date(baseStart.getTime() + 15 * 60 * 1000); // 900 seconds
      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: easyConfig,
        objectives: sampleObjectives,
      });

      expect(result.objectivePoints).toBe(500);
      expect(result.completionBonus).toBe(200);
      expect(result.speedBonus).toBe(75); // floor(300 * 0.25) = 75
      expect(result.hintPenalty).toBe(0);
      expect(result.baseScore).toBe(775);
      expect(result.finalScore).toBe(775);
    });

    it("evaluates: complete at the deadline (20 minutes) with no hints -> 700 points", () => {
      const completedAt = new Date(baseStart.getTime() + 20 * 60 * 1000); // 1200 seconds
      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: easyConfig,
        objectives: sampleObjectives,
      });

      expect(result.objectivePoints).toBe(500);
      expect(result.completionBonus).toBe(200);
      expect(result.speedBonus).toBe(0); // 1 - 1200/1200 = 0
      expect(result.hintPenalty).toBe(0);
      expect(result.baseScore).toBe(700);
      expect(result.finalScore).toBe(700);
    });

    it("evaluates: reach all intermediate milestones but fail to complete / expired -> at most 500 points", () => {
      const expiredTime = new Date(baseStart.getTime() + 25 * 60 * 1000); // past 20 minutes
      const result = calculateRunScore({
        status: "EXPIRED",
        startedAt: baseStart,
        currentTimestamp: expiredTime,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: easyConfig,
        objectives: sampleObjectives,
      });

      expect(result.objectivePoints).toBe(500);
      expect(result.completionBonus).toBe(0); // no completion bonus
      expect(result.speedBonus).toBe(0); // no speed bonus
      expect(result.hintPenalty).toBe(0);
      expect(result.baseScore).toBe(500);
      expect(result.finalScore).toBe(500);
    });
  });

  describe("Hint Penalty & Capping", () => {
    it("caps total hint penalty at 100 base points", () => {
      // 4 hints of 30 points each = 120, capped at 100
      const penalties = [30, 30, 30, 30];
      const penalty = calculateHintPenalty(penalties, 100);
      expect(penalty).toBe(100);

      // 2 hints of 25 = 50 < 100
      expect(calculateHintPenalty([25, 25], 100)).toBe(50);
    });

    it("deducts capped hint penalties from total score", () => {
      const baseStart = new Date("2026-10-10T12:00:00Z");
      const completedAt = new Date(baseStart.getTime() + 10 * 60 * 1000); // 600s
      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [40, 40, 40], // 120 capped at 100
        config: DEFAULT_SCORING_CONFIG,
        objectives: sampleObjectives,
      });

      expect(result.hintPenalty).toBe(100);
      // Base score: 500 (obj) + 200 (comp) + 150 (speed) - 100 (hint) = 750
      expect(result.baseScore).toBe(750);
      expect(result.finalScore).toBe(750);
    });
  });

  describe("Difficulty Multipliers", () => {
    const baseStart = new Date("2026-10-10T12:00:00Z");
    const completedAt = new Date(baseStart.getTime() + 5 * 60 * 1000); // 300s -> 925 base

    it("applies Medium difficulty multiplier (1.25)", () => {
      const mediumConfig: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        difficultyMultiplier: 1.25,
      };

      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: mediumConfig,
        objectives: sampleObjectives,
      });

      expect(result.baseScore).toBe(925);
      // 925 * 1.25 = 1156.25
      expect(result.finalScore).toBe(1156.25);
      expect(result.maxFinalScore).toBe(1250); // 1000 * 1.25
    });

    it("applies Hard difficulty multiplier (1.50)", () => {
      const hardConfig: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        difficultyMultiplier: 1.5,
      };

      const result = calculateRunScore({
        status: "COMPLETED",
        startedAt: baseStart,
        completedAt,
        verifiedObjectiveIds: ["obj_dir", "obj_file"],
        revealedHintPenalties: [],
        config: hardConfig,
        objectives: sampleObjectives,
      });

      expect(result.baseScore).toBe(925);
      // 925 * 1.5 = 1387.5
      expect(result.finalScore).toBe(1387.5);
      expect(result.maxFinalScore).toBe(1500);
    });
  });

  describe("Strict Time-Differentiated Scoring (Even 1 Second Changes Score)", () => {
    const baseStart = new Date("2026-10-10T12:00:00Z");

    it("guarantees no two players finishing at different seconds have the same score", () => {
      const easyConfig = DEFAULT_SCORING_CONFIG;
      const seenScores = new Set<number>();

      for (let sec = 0; sec < easyConfig.timeLimitSeconds; sec++) {
        const completedAt = new Date(baseStart.getTime() + sec * 1000);
        const result = calculateRunScore({
          status: "COMPLETED",
          startedAt: baseStart,
          completedAt,
          verifiedObjectiveIds: ["obj_dir", "obj_file"],
          revealedHintPenalties: [],
          config: easyConfig,
          objectives: sampleObjectives,
        });

        expect(seenScores.has(result.finalScore)).toBe(false);
        seenScores.add(result.finalScore);
      }
    });

    it("ensures score strictly decreases with each passing second", () => {
      const easyConfig = DEFAULT_SCORING_CONFIG;
      let prevScore = Infinity;

      for (let sec = 0; sec < easyConfig.timeLimitSeconds; sec++) {
        const completedAt = new Date(baseStart.getTime() + sec * 1000);
        const result = calculateRunScore({
          status: "COMPLETED",
          startedAt: baseStart,
          completedAt,
          verifiedObjectiveIds: ["obj_dir", "obj_file"],
          revealedHintPenalties: [],
          config: easyConfig,
          objectives: sampleObjectives,
        });

        expect(result.finalScore).toBeLessThan(prevScore);
        prevScore = result.finalScore;
      }
    });

    it("preserves strict 1-second differentiation across Medium (1.25) and Hard (1.50) difficulties", () => {
      for (const mult of [1.25, 1.5]) {
        const config: ScoringConfig = {
          ...DEFAULT_SCORING_CONFIG,
          difficultyMultiplier: mult,
        };
        let prevScore = Infinity;

        for (let sec = 0; sec <= 60; sec++) {
          const completedAt = new Date(baseStart.getTime() + sec * 1000);
          const result = calculateRunScore({
            status: "COMPLETED",
            startedAt: baseStart,
            completedAt,
            verifiedObjectiveIds: ["obj_dir", "obj_file"],
            revealedHintPenalties: [],
            config,
            objectives: sampleObjectives,
          });

          expect(result.finalScore).toBeLessThan(prevScore);
          prevScore = result.finalScore;
        }
      }
    });
  });

  describe("Edge Cases and Incomplete Runs", () => {
    const baseStart = new Date("2026-10-10T12:00:00Z");

    it("produces 0 points when zero objectives completed and run not completed", () => {
      const result = calculateRunScore({
        status: "IN_PROGRESS",
        startedAt: baseStart,
        verifiedObjectiveIds: [],
        revealedHintPenalties: [],
        config: DEFAULT_SCORING_CONFIG,
        objectives: sampleObjectives,
      });

      expect(result.objectivePoints).toBe(0);
      expect(result.completionBonus).toBe(0);
      expect(result.speedBonus).toBe(0);
      expect(result.finalScore).toBe(0);
    });

    it("disallows negative base scores even if hints exceed objective points", () => {
      const result = calculateRunScore({
        status: "IN_PROGRESS",
        startedAt: baseStart,
        verifiedObjectiveIds: [], // 0 points
        revealedHintPenalties: [25, 25], // 50 penalty
        config: DEFAULT_SCORING_CONFIG,
        objectives: sampleObjectives,
      });

      expect(result.baseScore).toBe(0);
      expect(result.finalScore).toBe(0);
    });

    it("respects partialCreditOnExpiry = false", () => {
      const noPartialConfig: ScoringConfig = {
        ...DEFAULT_SCORING_CONFIG,
        partialCreditOnExpiry: false,
      };

      const result = calculateRunScore({
        status: "EXPIRED",
        startedAt: baseStart,
        verifiedObjectiveIds: ["obj_dir"], // 250 points
        revealedHintPenalties: [],
        config: noPartialConfig,
        objectives: sampleObjectives,
      });

      expect(result.baseScore).toBe(0);
      expect(result.finalScore).toBe(0);
    });
  });
});
