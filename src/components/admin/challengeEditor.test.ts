import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("structured challenge editor", () => {
  it("exposes structured sections and keeps JSON optional", () => {
    const source = readFileSync("src/components/admin/ChallengeEditor.tsx", "utf8");
    for (const label of ["Command mappings", "Encoded clues", "Filesystem seed", "Objectives", "Hints", "Scoring", "Advanced JSON"]) expect(source).toContain(label);
    expect(source).toContain("validationErrors");
  });
});
