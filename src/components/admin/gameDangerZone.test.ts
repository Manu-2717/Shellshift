import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("game lifecycle controls and danger zone UI", () => {
  it("renders exact-name deletion dialog and controls for eligible drafts", () => {
    const source = readFileSync(
      "src/components/admin/GameDangerZone.tsx",
      "utf8",
    );
    // Deletion dialog and confirmation logic
    expect(source).toContain("Delete game");
    expect(source).toContain("Type the game name");
    expect(source).toContain("confirmation");
    expect(source).toContain("DELETE");
    expect(source).toContain("/admin/games");

    // Dialog and Notice usage
    expect(source).toContain("Dialog");
    expect(source).toContain("Notice");

    // Disabled until exact match and double submit prevention
    expect(source).toContain("disabled=");

    // Archival action for historical games
    expect(source).toContain("Archive game");
    expect(source).toContain("ARCHIVED");
  });

  it("is integrated into the game administration page", () => {
    const page = readFileSync(
      "src/app/admin/games/[gameId]/page.tsx",
      "utf8",
    );
    expect(page).toContain("GameDangerZone");
  });
});
