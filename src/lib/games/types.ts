export type StoredGameStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ENDED" | "ARCHIVED";

export type GamePhase =
  | StoredGameStatus
  | "REGISTRATION_OPEN"
  | "SCHEDULED"
  | "LIVE";

export interface GameScheduleInput {
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  startsAt: Date;
  endsAt: Date;
}

export interface GameSchedule extends GameScheduleInput {
  status: StoredGameStatus;
}

export interface ScheduleValidation {
  valid: boolean;
  errors: Partial<Record<keyof GameScheduleInput, string>>;
}

