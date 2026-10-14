import { describe, expect, it } from "vitest";
import { evaluateRunAccess } from "./runAccess";
import { rankIndividualRuns } from "./standings";

describe("graceful competition end and standings", () => {
  it("evaluates GAME_ENDED when event reaches endTime", () => {
    const run = {
      userId: "player-1",
      deadlineAt: new Date("2026-10-14T15:00:00Z"),
      event: {
        status: "PUBLISHED",
        endTime: new Date("2026-10-14T12:00:00Z"),
      },
    };

    const beforeEnd = new Date("2026-10-14T11:59:59Z");
    const afterEnd = new Date("2026-10-14T12:00:01Z");

    expect(evaluateRunAccess(run, { id: "player-1", role: "USER" }, beforeEnd)).toBe("OK");
    expect(evaluateRunAccess(run, { id: "player-1", role: "USER" }, afterEnd)).toBe("GAME_ENDED");
  });

  it("evaluates GAME_ENDED when event status is explicitly ENDED", () => {
    const run = {
      userId: "player-1",
      deadlineAt: new Date("2026-10-14T15:00:00Z"),
      event: {
        status: "ENDED",
        endTime: new Date("2026-10-14T15:00:00Z"),
      },
    };

    expect(evaluateRunAccess(run, { id: "player-1", role: "USER" }, new Date())).toBe("GAME_ENDED");
  });

  it("ranks individual completed runs accurately for leaderboard", () => {
    const runs = [
      {
        userId: "u1",
        userName: "Alice",
        challengeId: "c1",
        finalScore: 800,
        durationMs: 45000,
        completedAt: new Date("2026-10-14T11:00:00Z"),
      },
      {
        userId: "u2",
        userName: "Bob",
        challengeId: "c1",
        finalScore: 950,
        durationMs: 30000,
        completedAt: new Date("2026-10-14T11:05:00Z"),
      },
      {
        userId: "u1",
        userName: "Alice",
        challengeId: "c2",
        finalScore: 700,
        durationMs: 50000,
        completedAt: new Date("2026-10-14T11:15:00Z"),
      },
    ];

    const standings = rankIndividualRuns(runs);
    expect(standings).toHaveLength(2);
    // Alice has 800 + 700 = 1500 points across 2 challenges
    // Bob has 950 points across 1 challenge
    expect(standings[0].userId).toBe("u1");
    expect(standings[0].totalScore).toBe(1500);
    expect(standings[0].challengesCompleted).toBe(2);
    expect(standings[0].rank).toBe(1);

    expect(standings[1].userId).toBe("u2");
    expect(standings[1].totalScore).toBe(950);
    expect(standings[1].challengesCompleted).toBe(1);
    expect(standings[1].rank).toBe(2);
  });
});
