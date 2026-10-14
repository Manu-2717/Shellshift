import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LeaderboardView, LeaderboardEntry } from "./LeaderboardView";

describe("Points-Only Event Leaderboard", () => {
  it("renders pure points leaderboard without first finish race", () => {
    const entries: LeaderboardEntry[] = [
      {
        userId: "p1",
        userName: "CyberNinja",
        totalScore: 1250.5,
        challengesCompleted: 3,
        aggregateDurationMs: 45000,
      },
      {
        userId: "p2",
        userName: "ByteCoder",
        totalScore: 980.25,
        challengesCompleted: 2,
        aggregateDurationMs: 30000,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(LeaderboardView, {
        entries,
        totalChallenges: 5,
        currentUserId: "p1",
        eventName: "ShellShift Invitational",
      })
    );

    // Verify it is strictly a Points Leaderboard
    expect(html).toContain("Points Leaderboard");
    expect(html).toContain("Ranked by: Total Points → Duration");
    expect(html).toContain("ShellShift Invitational");

    // Strictly verify "First Finish Race" is NOT present anywhere
    expect(html).not.toContain("First Finish Race");
    expect(html).not.toContain("First Finish");
    expect(html).not.toContain("Race to First");

    // Verify player scores and ranks
    expect(html).toContain("CyberNinja");
    expect(html).toContain("1,250.50 PTS");
    expect(html).toContain("3 / 5");
    expect(html).toContain("YOU");

    expect(html).toContain("ByteCoder");
    expect(html).toContain("980.25 PTS");
    expect(html).toContain("2 / 5");
  });

  it("strictly sorts contestants by total score descending", () => {
    const entries: LeaderboardEntry[] = [
      {
        userId: "low",
        userName: "Player Low",
        totalScore: 500,
        challengesCompleted: 4, // More completed, but fewer points
        aggregateDurationMs: 20000,
      },
      {
        userId: "high",
        userName: "Player High",
        totalScore: 1000,
        challengesCompleted: 2, // Fewer completed, but more points
        aggregateDurationMs: 40000,
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(LeaderboardView, {
        entries,
        totalChallenges: 5,
      })
    );

    // In points-only leaderboard, Player High must appear before Player Low
    const highIndex = html.indexOf("Player High");
    const lowIndex = html.indexOf("Player Low");
    expect(highIndex).toBeGreaterThan(-1);
    expect(lowIndex).toBeGreaterThan(-1);
    expect(highIndex).toBeLessThan(lowIndex);
  });
});
