import type {
  GamePhase,
  GameSchedule,
  GameScheduleInput,
  ScheduleValidation,
  StoredGameStatus,
} from "./types";

const transitions: Record<StoredGameStatus, ReadonlySet<StoredGameStatus>> = {
  DRAFT: new Set(["PUBLISHED", "ARCHIVED"]),
  PUBLISHED: new Set(["DRAFT", "PAUSED", "ENDED"]),
  PAUSED: new Set(["PUBLISHED", "ENDED"]),
  ENDED: new Set(["ARCHIVED"]),
  ARCHIVED: new Set(),
};

export function deriveGamePhase(game: GameSchedule, now: Date): GamePhase {
  if (game.status !== "PUBLISHED") return game.status;

  const time = now.getTime();
  if (time >= game.endsAt.getTime()) return "ENDED";
  if (time >= game.startsAt.getTime()) return "LIVE";
  if (time >= game.registrationClosesAt.getTime()) return "SCHEDULED";
  if (time >= game.registrationOpensAt.getTime()) return "REGISTRATION_OPEN";
  return "PUBLISHED";
}

export function validateGameSchedule(input: GameScheduleInput): ScheduleValidation {
  const errors: ScheduleValidation["errors"] = {};
  const opens = input.registrationOpensAt.getTime();
  const closes = input.registrationClosesAt.getTime();
  const starts = input.startsAt.getTime();
  const ends = input.endsAt.getTime();

  if (![opens, closes, starts, ends].every(Number.isFinite)) {
    return { valid: false, errors: { startsAt: "Enter valid schedule dates." } };
  }
  if (closes <= opens) errors.registrationClosesAt = "Registration must close after it opens.";
  else if (starts <= closes) errors.startsAt = "Competition must start after registration closes.";
  else if (ends <= starts) errors.endsAt = "Competition must end after it starts.";

  return { valid: Object.keys(errors).length === 0, errors };
}

export function canTransitionGame(from: StoredGameStatus, to: StoredGameStatus): boolean {
  return from === to || transitions[from].has(to);
}

