import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("live admin operations console", () => {
  it("provides LiveOperations console with pause, resume, end controls and confirmation", () => {
    const liveOps = readFileSync("src/components/admin/LiveOperations.tsx", "utf8");
    expect(liveOps).toContain("LiveOperations");
    expect(liveOps).toContain("Pause competition");
    expect(liveOps).toContain("End competition");
    expect(liveOps).toContain("Dialog");
  });

  it("provides ParticipantTable and ActivityFeed components", () => {
    const participantTable = readFileSync("src/components/admin/ParticipantTable.tsx", "utf8");
    expect(participantTable).toContain("ParticipantTable");
    expect(participantTable).toContain("Registered");

    const activityFeed = readFileSync("src/components/admin/ActivityFeed.tsx", "utf8");
    expect(activityFeed).toContain("ActivityFeed");
  });

  it("provides admin operations API endpoint returning metrics and live state", () => {
    const route = readFileSync("src/app/api/admin/games/[gameId]/operations/route.ts", "utf8");
    expect(route).toContain("GET");
    expect(route).toContain("registeredCount");
    expect(route).toContain("activeCount");
    expect(route).toContain("completedCount");
  });
});
