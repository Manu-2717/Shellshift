/**
 * ShellShift Server-Authoritative Scoring Engine
 *
 * Deterministic, purely functional scoring engine adhering to official competition rules:
 * - Maximum base score: 1,000 points.
 * - Intermediate verified objectives: up to 500 points total.
 * - Full challenge completion bonus: 200 points.
 * - Maximum speed bonus: 300 points (roundScore(speedBonusMax * max(0, 1 - elapsedSeconds / timeLimitSeconds))).
 * - Total hint penalty: capped at 100 base points.
 * - Difficulty multipliers: Easy 1.00, Medium 1.25, Hard 1.50.
 *
 * Base score: max(0, roundScore(objectivePoints + completionBonus + speedBonus - hintPenalty))
 * Final score: min(roundScore(maxBaseScore * multiplier), roundScore(baseScore * multiplier))
 */

export type ChallengeDifficulty = "EASY" | "MEDIUM" | "HARD";

export type RunStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "EXPIRED"
  | "FAILED"
  | "ABANDONED";

export interface ScoringConfig {
  maxBaseScore: number;           // Default: 1000
  intermediateBudget: number;     // Default: 500
  completionBonus: number;        // Default: 200
  speedBonusMax: number;          // Default: 300
  hintPenaltyCap: number;         // Default: 100
  defaultHintPenalty: number;     // Default: 25
  difficultyMultiplier: number;   // Easy: 1.0, Medium: 1.25, Hard: 1.5
  timeLimitSeconds: number;       // Default: 1200 (20 min)
  partialCreditOnExpiry: boolean; // Default: true
  countsTowardLeaderboard: boolean; // Default: true
}

export interface ScoredObjective {
  id: string;
  description: string;
  points: number;
}

export interface ScoreBreakdown {
  objectivePoints: number;
  intermediateBudget: number;
  completionBonus: number;
  speedBonus: number;
  speedBonusMax: number;
  hintPenalty: number;
  hintPenaltyCap: number;
  hintCount: number;
  baseScore: number;
  difficultyMultiplier: number;
  finalScore: number;
  maxBaseScore: number;
  maxFinalScore: number;
  elapsedSeconds: number;
  timeLimitSeconds: number;
  isCompleted: boolean;
  isExpired: boolean;
  status: RunStatus;
}

export const DEFAULT_DIFFICULTY_MULTIPLIERS: Record<ChallengeDifficulty, number> = {
  EASY: 1.0,
  MEDIUM: 1.25,
  HARD: 1.5,
};

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  maxBaseScore: 1000,
  intermediateBudget: 500,
  completionBonus: 200,
  speedBonusMax: 300,
  hintPenaltyCap: 100,
  defaultHintPenalty: 25,
  difficultyMultiplier: 1.0,
  timeLimitSeconds: 1200, // 20 minutes
  partialCreditOnExpiry: true,
  countsTowardLeaderboard: true,
};

/**
 * Validates a scoring configuration structure.
 * Throws or returns an error string if invalid.
 */
export function validateScoringConfig(
  config: Partial<ScoringConfig>,
  objectives?: ScoredObjective[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const maxBase = config.maxBaseScore ?? DEFAULT_SCORING_CONFIG.maxBaseScore;
  const budget = config.intermediateBudget ?? DEFAULT_SCORING_CONFIG.intermediateBudget;
  const compBonus = config.completionBonus ?? DEFAULT_SCORING_CONFIG.completionBonus;
  const speedMax = config.speedBonusMax ?? DEFAULT_SCORING_CONFIG.speedBonusMax;
  const penaltyCap = config.hintPenaltyCap ?? DEFAULT_SCORING_CONFIG.hintPenaltyCap;
  const multiplier = config.difficultyMultiplier ?? DEFAULT_SCORING_CONFIG.difficultyMultiplier;
  const timeLimit = config.timeLimitSeconds ?? DEFAULT_SCORING_CONFIG.timeLimitSeconds;

  if (maxBase <= 0) errors.push("maxBaseScore must be greater than 0");
  if (budget < 0) errors.push("intermediateBudget cannot be negative");
  if (compBonus < 0) errors.push("completionBonus cannot be negative");
  if (speedMax < 0) errors.push("speedBonusMax cannot be negative");
  if (penaltyCap < 0) errors.push("hintPenaltyCap cannot be negative");
  if (multiplier <= 0) errors.push("difficultyMultiplier must be greater than 0");
  if (timeLimit <= 0) errors.push("timeLimitSeconds must be greater than 0");

  if (budget + compBonus + speedMax > maxBase) {
    errors.push(
      `Sum of intermediateBudget (${budget}) + completionBonus (${compBonus}) + speedBonusMax (${speedMax}) = ${
        budget + compBonus + speedMax
      } exceeds maxBaseScore (${maxBase})`
    );
  }

  if (objectives && objectives.length > 0) {
    const objectiveSum = objectives.reduce((sum, obj) => {
      if (obj.points < 0) {
        errors.push(`Objective '${obj.id}' cannot have negative points`);
      }
      return sum + Math.max(0, obj.points);
    }, 0);

    if (objectiveSum > budget) {
      errors.push(
        `Sum of objective points (${objectiveSum}) exceeds configured intermediateBudget (${budget})`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Rounds score value to 2 decimal places to ensure floating point stability
 * while strictly differentiating every single elapsed second.
 */
export function roundScore(val: number): number {
  return Math.round(val * 100) / 100;
}

/**
 * Calculates the speed bonus.
 * speedBonus = roundScore(speedBonusMax * max(0, 1 - elapsedSeconds / timeLimitSeconds))
 * Awarded ONLY for a successfully completed run within its time limit.
 * Guaranteed to strictly differentiate every single elapsed second.
 */
export function calculateSpeedBonus(
  speedBonusMax: number,
  elapsedSeconds: number,
  timeLimitSeconds: number,
  isCompleted: boolean
): number {
  if (!isCompleted) return 0;
  if (timeLimitSeconds <= 0) return 0;
  if (elapsedSeconds < 0) return 0;
  if (elapsedSeconds >= timeLimitSeconds) return 0;

  const ratio = Math.max(0, 1 - elapsedSeconds / timeLimitSeconds);
  return roundScore(speedBonusMax * ratio);
}

/**
 * Calculates the hint penalty.
 * Sum of penalties for distinct revealed hints, capped at hintPenaltyCap.
 */
export function calculateHintPenalty(
  revealedPenalties: number[],
  hintPenaltyCap: number
): number {
  if (hintPenaltyCap <= 0) return 0;
  const rawSum = revealedPenalties.reduce((sum, p) => sum + Math.max(0, p), 0);
  return Math.min(hintPenaltyCap, rawSum);
}

/**
 * Calculates the intermediate objective points earned based on verified objective IDs.
 */
export function calculateObjectivePoints(
  verifiedObjectiveIds: string[],
  availableObjectives: ScoredObjective[],
  intermediateBudget: number
): number {
  if (intermediateBudget <= 0 || !availableObjectives.length) return 0;

  const verifiedSet = new Set(verifiedObjectiveIds);
  let earned = 0;

  for (const obj of availableObjectives) {
    if (verifiedSet.has(obj.id)) {
      earned += Math.max(0, obj.points);
    }
  }

  return Math.min(intermediateBudget, earned);
}

/**
 * Evaluates the full deterministic score breakdown for a run.
 */
export function calculateRunScore(params: {
  status: RunStatus;
  startedAt: Date | string | number;
  completedAt?: Date | string | number | null;
  currentTimestamp?: Date | string | number;
  verifiedObjectiveIds: string[];
  revealedHintPenalties: number[];
  config: ScoringConfig;
  objectives: ScoredObjective[];
}): ScoreBreakdown {
  const {
    status,
    startedAt,
    completedAt,
    currentTimestamp,
    verifiedObjectiveIds,
    revealedHintPenalties,
    config,
    objectives,
  } = params;

  const startTimeMs = new Date(startedAt).getTime();
  const timeLimitSeconds = Math.max(1, config.timeLimitSeconds);

  let endTimeMs: number;
  if (status === "COMPLETED" && completedAt) {
    endTimeMs = new Date(completedAt).getTime();
  } else if (currentTimestamp) {
    endTimeMs = new Date(currentTimestamp).getTime();
  } else {
    endTimeMs = Date.now();
  }

  const rawElapsedMs = Math.max(0, endTimeMs - startTimeMs);
  const elapsedSeconds = Math.max(0, Math.floor(rawElapsedMs / 1000));

  const isCompleted = status === "COMPLETED";
  const isExpired =
    status === "EXPIRED" || (!isCompleted && elapsedSeconds >= timeLimitSeconds);

  // 1. Intermediate Objective Points (verified milestones)
  const objectivePoints = calculateObjectivePoints(
    verifiedObjectiveIds,
    objectives,
    config.intermediateBudget
  );

  // 2. Full Challenge Completion Bonus (only if completed within deadline)
  let completionBonus = 0;
  if (isCompleted && elapsedSeconds <= timeLimitSeconds) {
    completionBonus = Math.max(0, config.completionBonus);
  }

  // 3. Speed Bonus (only if completed within deadline)
  const speedBonus = calculateSpeedBonus(
    config.speedBonusMax,
    elapsedSeconds,
    timeLimitSeconds,
    isCompleted
  );

  // 4. Hint Penalty (distinct revealed hints, capped)
  const hintPenalty = calculateHintPenalty(
    revealedHintPenalties,
    config.hintPenaltyCap
  );

  // 5. Base Score calculation
  let baseScore = 0;
  if (isCompleted) {
    baseScore = Math.max(
      0,
      roundScore(objectivePoints + completionBonus + speedBonus - hintPenalty)
    );
  } else if (isExpired) {
    if (config.partialCreditOnExpiry) {
      baseScore = Math.max(0, roundScore(objectivePoints - hintPenalty));
    } else {
      baseScore = 0;
    }
  } else {
    // In progress: display current verified intermediate points minus hints
    baseScore = Math.max(0, roundScore(objectivePoints - hintPenalty));
  }

  // 6. Final Score with difficulty multiplier
  const multiplier = Math.max(0.1, config.difficultyMultiplier);
  const maxFinalScore = roundScore(config.maxBaseScore * multiplier);
  const finalScore = Math.min(maxFinalScore, roundScore(baseScore * multiplier));

  return {
    objectivePoints,
    intermediateBudget: config.intermediateBudget,
    completionBonus,
    speedBonus,
    speedBonusMax: config.speedBonusMax,
    hintPenalty,
    hintPenaltyCap: config.hintPenaltyCap,
    hintCount: revealedHintPenalties.length,
    baseScore,
    difficultyMultiplier: multiplier,
    finalScore,
    maxBaseScore: config.maxBaseScore,
    maxFinalScore,
    elapsedSeconds,
    timeLimitSeconds,
    isCompleted,
    isExpired,
    status,
  };
}
