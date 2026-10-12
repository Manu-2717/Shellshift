import { describe, expect, it } from "vitest";
import { normalizeGameInput, validatePublishableGame } from "./service";

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
    expect(result.data?.startTime.toISOString()).toBe("2026-10-12T09:00:00.000Z");
    expect(result.data?.timezone).toBe("Asia/Kolkata");
  });

  it("rejects invalid IANA zones and invalid schedules", () => {
    expect(normalizeGameInput({ ...valid, timezone: "Moon/Base" }).fieldErrors).toHaveProperty("timezone");
    expect(normalizeGameInput({ ...valid, startsAt: "2026-10-09T09:00:00Z" }).fieldErrors).toHaveProperty("startsAt");
  });

  it("rejects publishing without a lineup", () => {
    expect(validatePublishableGame({ ...valid, challengeIds: [] })).toEqual({
      valid: false,
      fieldErrors: { challengeIds: "Choose at least one published challenge." },
    });
  });
});
