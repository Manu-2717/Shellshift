import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const schema = readFileSync("prisma/schema.prisma", "utf8");

describe("individual competition schema", () => {
  it("adds game challenge and individual registration uniqueness", () => {
    expect(schema).toContain("model EventChallenge");
    expect(schema).toContain("@@unique([eventId, challengeId])");
    expect(schema).toContain("model GameRegistration");
    expect(schema).toContain("@@unique([eventId, userId])");
  });

  it("supports user-owned event-scoped runs while preserving legacy ownership", () => {
    expect(schema).toMatch(/userId\s+String\?/);
    expect(schema).toMatch(/eventId\s+String\?/);
    expect(schema).toMatch(/legacyTeamId\s+String\?/);
    expect(schema).toMatch(/legacyIndividualEligible\s+Boolean/);
  });
});
