export interface ClueItem {
  id: string;
  title: string;
  type:
    | "morse"
    | "binary"
    | "hex"
    | "base64"
    | "rot13"
    | "caesar"
    | "ascii_decimal"
    | "url_percent";
  encodedContent: string;
  plaintextAnswer: string;
  hintNote?: string;
}

export interface SeedChallengeDef {
  slug: string;
  title: string;
  description?: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  order: number;
  estimatedDuration: string;
  timeLimitSeconds: number;
  scoringConfig: {
    maxBaseScore: number;
    intermediateBudget: number;
    completionBonus: number;
    speedBonusMax: number;
    hintPenaltyCap: number;
    defaultHintPenalty: number;
    difficultyMultiplier: number;
    timeLimitSeconds: number;
    partialCreditOnExpiry: boolean;
    countsTowardLeaderboard: boolean;
  };
  commandMappings: Record<string, string>;
  clues: ClueItem[];
  initialFilesystem: Record<string, string>;
  objectiveConfig: {
    description: string;
    rules: Array<{
      id: string;
      points: number;
      type:
        | "file_exists"
        | "dir_exists"
        | "file_deleted"
        | "dir_deleted"
        | "file_contains"
        | "file_exact"
        | "file_moved"
        | "min_commands"
        | "cwd_equals";
      path?: string;
      content?: string;
      caseSensitive?: boolean;
      description: string;
    }>;
  };
  hints: Array<{
    title: string;
    content: string;
    penaltySeconds: number;
    pointPenalty: number;
    order: number;
  }>;
}
