import { describe, expect, it } from "vitest";
import {
  canTransitionGame,
  deriveGamePhase,
  validateGameSchedule,
} from "./lifecycle";
import type { GameSchedule } from "./types";

const schedule = (status: GameSchedule["status"]): GameSchedule => ({
  status,
  registrationOpensAt: new Date("2026-10-01T09:00:00.000Z"),
  registrationClosesAt: new Date("2026-10-10T09:00:00.000Z"),
  startsAt: new Date("2026-10-12T09:00:00.000Z"),
  endsAt: new Date("2026-10-12T11:00:00.000Z"),
});

describe("deriveGamePhase", () => {
  it("gives manual states precedence", () => {
    expect(deriveGamePhase(schedule("DRAFT"), new Date("2026-10-12T10:00:00Z"))).toBe("DRAFT");
    expect(deriveGamePhase(schedule("PAUSED"), new Date("2026-10-12T10:00:00Z"))).toBe("PAUSED");
    expect(deriveGamePhase(schedule("ENDED"), new Date("2026-10-01T10:00:00Z"))).toBe("ENDED");
    expect(deriveGamePhase(schedule("ARCHIVED"), new Date("2026-10-01T10:00:00Z"))).toBe("ARCHIVED");
  });

  it("derives all time-driven phases at exact boundaries", () => {
    const game = schedule("PUBLISHED");
    expect(deriveGamePhase(game, new Date("2026-10-01T08:59:59.999Z"))).toBe("PUBLISHED");
    expect(deriveGamePhase(game, new Date("2026-10-01T09:00:00.000Z"))).toBe("REGISTRATION_OPEN");
    expect(deriveGamePhase(game, new Date("2026-10-10T09:00:00.000Z"))).toBe("SCHEDULED");
    expect(deriveGamePhase(game, new Date("2026-10-12T09:00:00.000Z"))).toBe("LIVE");
    expect(deriveGamePhase(game, new Date("2026-10-12T11:00:00.000Z"))).toBe("ENDED");
  });
});

describe("validateGameSchedule", () => {
  it("accepts ordered timestamps and rejects invalid ordering", () => {
    expect(validateGameSchedule(schedule("PUBLISHED"))).toEqual({ valid: true, errors: {} });
    expect(
      validateGameSchedule({ ...schedule("PUBLISHED"), startsAt: new Date("2026-10-09T09:00:00Z") }),
    ).toEqual({
      valid: false,
      errors: { startsAt: "Competition must start after registration closes." },
    });
  });
});

describe("canTransitionGame", () => {
  it("allows deliberate lifecycle transitions and blocks reopening ended games", () => {
    expect(canTransitionGame("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransitionGame("PUBLISHED", "PAUSED")).toBe(true);
    expect(canTransitionGame("PAUSED", "PUBLISHED")).toBe(true);
    expect(canTransitionGame("PUBLISHED", "ENDED")).toBe(true);
    expect(canTransitionGame("ENDED", "ARCHIVED")).toBe(true);
    expect(canTransitionGame("ENDED", "PUBLISHED")).toBe(false);
  });
});
