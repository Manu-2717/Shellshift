import { describe, expect, it } from "vitest";
import { validateChallengeMetadata } from "./adminMetadata";
const valid = {
  title: "A clear title",
  description: "A clear description for beginners.",
  difficulty: "EASY",
  timeLimitSeconds: 600,
  isPublished: true,
  hints: [
    {
      title: "Start",
      content: "Look at the files.",
      penaltySeconds: 15,
      pointPenalty: 20,
      order: 1,
    },
    {
      title: "Try this",
      content: "Use mkdir.",
      penaltySeconds: 30,
      pointPenalty: 30,
      order: 2,
    },
  ],
};
describe("challenge metadata", () => {
  it("accepts safe details", () =>
    expect(validateChallengeMetadata(valid).errors).toEqual([]));
  it("rejects protected mechanics without a partial value", () => {
    const result = validateChallengeMetadata({
      ...valid,
      commandMappings: { ls: "rm" },
    });
    expect(result.value).toBeUndefined();
    expect(result.errors[0]).toContain("commandMappings");
  });
  it("requires beginner-safe bounds", () =>
    expect(
      validateChallengeMetadata({ ...valid, title: "x", hints: [] }).errors
        .length,
    ).toBeGreaterThan(1));
});
