import { describe, expect, it } from "vitest";
import {
  checkGameDeletionEligibility,
  normalizeGameInput,
  validateLineupChallenges,
  validatePublishableGame,
} from "./service";

const valid = {
  name: "Autumn Cipher Sprint",
  slug: "autumn-cipher-sprint",
  description: "Individual competition",
  timezone: "Asia/Kolkata",
  registrationOpensAt: "2026-10-01T09:00:00.000Z",
  registrationClosesAt: "2026-10-10T09:00:00.000Z",
  startsAt: "2026-10-12T09:00:00.000Z",
  endsAt: "2026-10-12T11:00:00.000Z",
  challengeIds: ["challenge-1"],
};

describe("game administration input", () => {
  it("normalizes UTC dates without changing instants", () => {
    const result = normalizeGameInput(valid);
    expect(result.data?.startTime.toISOString()).toBe(
      "2026-10-12T09:00:00.000Z",
    );
    expect(result.data?.timezone).toBe("Asia/Kolkata");
  });

  it("rejects invalid IANA zones and invalid schedules", () => {
    expect(
      normalizeGameInput({ ...valid, timezone: "Moon/Base" }).fieldErrors,
    ).toHaveProperty("timezone");
    expect(
      normalizeGameInput({ ...valid, startsAt: "2026-10-09T09:00:00Z" })
        .fieldErrors,
    ).toHaveProperty("startsAt");
  });

  it("rejects duplicate challenge IDs", () => {
    const result = normalizeGameInput({
      ...valid,
      challengeIds: ["challenge-1", "challenge-1"],
    });
    expect(result.fieldErrors).toHaveProperty("challengeIds");
    expect(result.fieldErrors.challengeIds).toContain("once");
  });

  it("preserves submitted challenge order", () => {
    const result = normalizeGameInput({
      ...valid,
      challengeIds: ["challenge-3", "challenge-1", "challenge-2"],
    });
    expect(result.data?.challengeIds).toEqual([
      "challenge-3",
      "challenge-1",
      "challenge-2",
    ]);
  });

  it("rejects publishing without a lineup", () => {
    expect(validatePublishableGame({ ...valid, challengeIds: [] })).toEqual({
      valid: false,
      fieldErrors: { challengeIds: "Choose at least one published challenge." },
    });
  });

  it("validates that new lineups exclude hidden challenges while edits can retain existing hidden challenges", () => {
    const catalog = [
      { id: "c-published-1", isPublished: true },
      { id: "c-published-2", isPublished: true },
      { id: "c-hidden-1", isPublished: false },
    ];

    // New game: cannot include hidden challenge
    const newGameCheck = validateLineupChallenges(
      ["c-published-1", "c-hidden-1"],
      catalog,
      [],
    );
    expect(newGameCheck.valid).toBe(false);
    expect(newGameCheck.error).toContain("Hidden");

    // Existing game edit: retaining existing hidden challenge is permitted
    const editRetainedCheck = validateLineupChallenges(
      ["c-published-1", "c-hidden-1"],
      catalog,
      ["c-hidden-1"], // was already in the game
    );
    expect(editRetainedCheck.valid).toBe(true);

    // Existing game edit: adding a NEW hidden challenge is rejected
    const editNewHiddenCheck = validateLineupChallenges(
      ["c-published-1", "c-hidden-1"],
      catalog,
      ["c-published-1"], // only published was previously in game
    );
    expect(editNewHiddenCheck.valid).toBe(false);
    expect(editNewHiddenCheck.error).toContain("Hidden");
  });
});

describe("game lifecycle and protected deletion", () => {
  const unusedDraft = {
    name: "Draft Cup",
    status: "DRAFT",
    registrationCount: 0,
    runCount: 0,
  };

  it("allows deletion for eligible unused draft with matching confirmation", () => {
    const result = checkGameDeletionEligibility(unusedDraft, "Draft Cup");
    expect(result.eligible).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects deletion when name confirmation does not match", () => {
    const result = checkGameDeletionEligibility(unusedDraft, "Wrong Name");
    expect(result.eligible).toBe(false);
    expect(result.status).toBe(400);
    expect(result.error).toContain("match");
  });

  it("rejects deletion when game is not in DRAFT status", () => {
    const publishedGame = { ...unusedDraft, status: "PUBLISHED" };
    const result = checkGameDeletionEligibility(publishedGame, "Draft Cup");
    expect(result.eligible).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain("draft");
  });

  it("rejects deletion when game has registrations", () => {
    const registeredGame = { ...unusedDraft, registrationCount: 3 };
    const result = checkGameDeletionEligibility(registeredGame, "Draft Cup");
    expect(result.eligible).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain("registrations");
  });

  it("rejects deletion when game has runs", () => {
    const playedGame = { ...unusedDraft, runCount: 1 };
    const result = checkGameDeletionEligibility(playedGame, "Draft Cup");
    expect(result.eligible).toBe(false);
    expect(result.status).toBe(409);
    expect(result.error).toContain("runs");
  });
});
