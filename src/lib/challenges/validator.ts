import { SeedChallengeDef } from "./seedData";
import { operations } from "../vfs/operations";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const SUPPORTED_DIFFICULTIES = ["EASY", "MEDIUM", "HARD"];
const SUPPORTED_OPERATIONS = new Set(Object.keys(operations));
const SUPPORTED_OBJECTIVE_TYPES = new Set([
  "dir_exists",
  "file_exists",
  "file_deleted",
  "dir_deleted",
  "file_contains",
  "file_exact",
  "file_moved",
  "min_commands",
]);

/**
 * Validates a challenge definition prior to publication or seeding.
 * Identifies configuration bugs, unsupported commands, invalid scoring,
 * or unreachable objective rules.
 */
export function validateChallengeDefinition(
  def: Partial<SeedChallengeDef>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Basic Metadata
  if (!def.slug || typeof def.slug !== "string" || def.slug.trim() === "") {
    errors.push("Challenge slug is required and must be non-empty.");
  } else if (!/^[a-z0-9-]+$/.test(def.slug)) {
    errors.push(`Challenge slug '${def.slug}' must contain only lowercase letters, numbers, and hyphens.`);
  }

  if (!def.title || typeof def.title !== "string" || def.title.trim() === "") {
    errors.push("Challenge title is required.");
  }

  if (!def.description || typeof def.description !== "string" || def.description.trim() === "") {
    errors.push("Challenge description is required.");
  }

  if (!def.difficulty || !SUPPORTED_DIFFICULTIES.includes(def.difficulty)) {
    errors.push(
      `Invalid difficulty '${def.difficulty}'. Must be one of: ${SUPPORTED_DIFFICULTIES.join(", ")}. Expert level is prohibited.`
    );
  }

  if (typeof def.order !== "number" || def.order < 1) {
    errors.push("Challenge order must be a positive integer.");
  }

  if (typeof def.timeLimitSeconds !== "number" || def.timeLimitSeconds < 60) {
    errors.push("Authoritative time limit must be at least 60 seconds.");
  }

  // 2. Scoring Configuration
  if (!def.scoringConfig) {
    errors.push("Scoring configuration is required.");
  } else {
    const sc = def.scoringConfig;
    if (typeof sc.maxBaseScore !== "number" || sc.maxBaseScore <= 0) {
      errors.push("Scoring maxBaseScore must be greater than zero.");
    }
    if (typeof sc.intermediateBudget !== "number" || sc.intermediateBudget < 0) {
      errors.push("Scoring intermediateBudget must be non-negative.");
    }
    if (typeof sc.completionBonus !== "number" || sc.completionBonus < 0) {
      errors.push("Scoring completionBonus must be non-negative.");
    }
    if (typeof sc.speedBonusMax !== "number" || sc.speedBonusMax < 0) {
      errors.push("Scoring speedBonusMax must be non-negative.");
    }
    if (typeof sc.hintPenaltyCap !== "number" || sc.hintPenaltyCap < 0) {
      errors.push("Scoring hintPenaltyCap must be non-negative.");
    }
  }

  // 3. Command Mappings
  if (def.commandMappings) {
    for (const [enteredCmd, mappedOp] of Object.entries(def.commandMappings)) {
      if (!enteredCmd || enteredCmd.trim() === "") {
        errors.push("Command mapping key cannot be empty.");
      }
      if (!SUPPORTED_OPERATIONS.has(mappedOp)) {
        errors.push(
          `Unsupported mapped operation '${mappedOp}' for command '${enteredCmd}'. Must be one of: ${Array.from(SUPPORTED_OPERATIONS).join(", ")}.`
        );
      }
    }
  }

  // 4. Initial Filesystem
  if (!def.initialFilesystem || typeof def.initialFilesystem !== "object") {
    errors.push("Initial virtual filesystem configuration is required.");
  } else {
    for (const [pathStr, content] of Object.entries(def.initialFilesystem)) {
      if (!pathStr.startsWith("/")) {
        errors.push(`Virtual filesystem path '${pathStr}' must be absolute (start with '/').`);
      }
      if (typeof content !== "string") {
        errors.push(`Content of file '${pathStr}' must be a string.`);
      }
    }
  }

  // 5. Clues
  if (Array.isArray(def.clues)) {
    const seenClueIds = new Set<string>();
    for (const clue of def.clues) {
      if (!clue.id) {
        errors.push("Every clue must have an id.");
      } else if (seenClueIds.has(clue.id)) {
        errors.push(`Duplicate clue id '${clue.id}'.`);
      } else {
        seenClueIds.add(clue.id);
      }
      if (!clue.encodedContent || typeof clue.encodedContent !== "string") {
        errors.push(`Clue '${clue.id || "unknown"}' missing encodedContent.`);
      }
    }
  }

  // 6. Objectives and Budget Verification
  if (!def.objectiveConfig || !Array.isArray(def.objectiveConfig.rules)) {
    errors.push("Objective configuration with a rules array is required.");
  } else {
    let totalObjectivePoints = 0;
    const seenRuleIds = new Set<string>();

    for (const rule of def.objectiveConfig.rules) {
      if (!rule.id) {
        warnings.push(`Rule '${rule.description}' has no explicit id.`);
      } else if (seenRuleIds.has(rule.id)) {
        errors.push(`Duplicate objective rule id '${rule.id}'.`);
      } else {
        seenRuleIds.add(rule.id);
      }

      if (!SUPPORTED_OBJECTIVE_TYPES.has(rule.type)) {
        errors.push(`Unsupported objective rule type '${rule.type}'.`);
      }

      if (typeof rule.points === "number") {
        totalObjectivePoints += rule.points;
      }

      if (
        ["dir_exists", "file_exists", "file_deleted", "dir_deleted", "file_contains", "file_exact", "file_moved"].includes(rule.type)
      ) {
        if (!rule.path || !rule.path.startsWith("/")) {
          errors.push(`Objective rule '${rule.description}' requires an absolute path starting with '/'.`);
        }
      }
    }

    if (
      def.scoringConfig &&
      typeof def.scoringConfig.intermediateBudget === "number" &&
      totalObjectivePoints > def.scoringConfig.intermediateBudget
    ) {
      errors.push(
        `Total objective points (${totalObjectivePoints}) exceeds the configured intermediate milestone budget (${def.scoringConfig.intermediateBudget}).`
      );
    }
  }

  // 7. Hints
  if (Array.isArray(def.hints)) {
    let lastOrder = 0;
    for (const hint of def.hints) {
      if (typeof hint.order === "number") {
        if (hint.order <= lastOrder) {
          errors.push(`Hint order must be strictly progressive. Found ${hint.order} after ${lastOrder}.`);
        }
        lastOrder = hint.order;
      }
      if (typeof hint.pointPenalty === "number" && hint.pointPenalty < 0) {
        errors.push(`Hint '${hint.title}' has negative point penalty.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
