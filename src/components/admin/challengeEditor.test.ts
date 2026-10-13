import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("safe challenge editor", () => {
  it("edits player details and keeps mechanics read-only", () => {
    const source = readFileSync(
      "src/components/admin/ChallengeDetailsEditor.tsx",
      "utf8",
    );
    for (const label of [
      "Title",
      "Description",
      "Difficulty",
      "Time limit",
      "Progressive hints",
      "Add hint",
      "Remove",
      "Move up",
    ])
      expect(source).toContain(label);
    for (const protectedLabel of [
      "Command mappings",
      "Filesystem seed",
      "Advanced JSON",
    ])
      expect(source).not.toContain(protectedLabel);
    expect(
      readFileSync(
        "src/components/admin/ChallengeTechnicalSummary.tsx",
        "utf8",
      ),
    ).toContain("read-only");
  });
});
