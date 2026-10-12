import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("UI foundation", () => {
  it("defines focus, touch, and reduced-motion rules", () => {
    const css = readFileSync("src/app/globals.css", "utf8");
    expect(css).toContain("--accent-violet");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("prefers-reduced-motion");
  });

  it("uses semantic dialog and tab roles", () => {
    expect(readFileSync("src/components/ui/Dialog.tsx", "utf8")).toContain('role="dialog"');
    expect(readFileSync("src/components/ui/Tabs.tsx", "utf8")).toContain('role="tablist"');
    expect(readFileSync("src/components/ui/Field.tsx", "utf8")).toContain("aria-describedby");
  });
});
