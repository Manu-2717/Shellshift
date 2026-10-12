import { describe, expect, it } from "vitest";
import { canRegisterForGame } from "./registration";

describe("individual registration eligibility", () => {
  it("allows only the half-open registration window", () => {
    const opens = new Date("2026-10-01T09:00:00Z");
    const closes = new Date("2026-10-10T09:00:00Z");
    expect(canRegisterForGame({ status: "PUBLISHED", registrationOpensAt: opens, registrationClosesAt: closes }, opens)).toBe(true);
    expect(canRegisterForGame({ status: "PUBLISHED", registrationOpensAt: opens, registrationClosesAt: closes }, closes)).toBe(false);
    expect(canRegisterForGame({ status: "PAUSED", registrationOpensAt: opens, registrationClosesAt: closes }, opens)).toBe(false);
  });
});
