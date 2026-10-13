import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("challenge lineup selector component", () => {
  it("provides search, difficulty grouping/filtering, selection count, and order controls", () => {
    const source = readFileSync(
      "src/components/admin/ChallengeLineupSelector.tsx",
      "utf8",
    );
    // Grouping, search, filters
    expect(source).toContain("Search challenges");
    expect(source).toContain("All difficulties");
    expect(source).toContain("EASY");
    expect(source).toContain("MEDIUM");
    expect(source).toContain("HARD");

    // Selected count summary
    expect(source).toContain("selected");

    // Move up, move down, remove ordering controls
    expect(source).toContain("Move up");
    expect(source).toContain("Move down");
    expect(source).toContain("Remove");
  });

  it("is integrated into the game builder", () => {
    const builder = readFileSync(
      "src/components/admin/GameBuilder.tsx",
      "utf8",
    );
    expect(builder).toContain("ChallengeLineupSelector");
  });
});
