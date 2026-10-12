import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin hosting UI", () => {
  it("provides the four-step builder and operations navigation", () => {
    const builder = readFileSync("src/components/admin/GameBuilder.tsx", "utf8");
    expect(builder).toContain("Basics");
    expect(builder).toContain("Schedule");
    expect(builder).toContain("Challenges & scoring");
    expect(builder).toContain("Review");
    expect(readFileSync("src/components/admin/AdminShell.tsx", "utf8")).toContain("Game control");
  });
});
