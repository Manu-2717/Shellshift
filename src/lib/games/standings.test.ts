import { describe, expect, it } from "vitest";
import { rankIndividualRuns } from "./standings";

describe("individual standings", () => {
  it("keeps each user's best challenge score and applies deterministic tie breaks", () => {
    const ranked = rankIndividualRuns([
      { userId: "a", userName: "Alice", challengeId: "one", finalScore: 800, durationMs: 80_000, completedAt: new Date("2026-10-12T10:00:00Z") },
      { userId: "a", userName: "Alice", challengeId: "one", finalScore: 900, durationMs: 90_000, completedAt: new Date("2026-10-12T10:02:00Z") },
      { userId: "b", userName: "Bob", challengeId: "one", finalScore: 900, durationMs: 70_000, completedAt: new Date("2026-10-12T10:03:00Z") },
    ]);
    expect(ranked.map((row) => row.userId)).toEqual(["b", "a"]);
    expect(ranked[1].totalScore).toBe(900);
  });
});
