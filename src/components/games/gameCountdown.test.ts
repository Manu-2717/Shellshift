import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GameCountdown } from "./GameCountdown";

describe("GameCountdown", () => {
  it("renders 'Event Ended' when isEnded is true", () => {
    const html = renderToStaticMarkup(
      React.createElement(GameCountdown, {
        target: new Date(Date.now() - 3600000).toISOString(),
        label: "Time remaining",
        isEnded: true,
      })
    );

    expect(html).toContain("Event Ended");
    expect(html).toContain("Competition Status");
    expect(html).not.toContain("00:00:00");
  });

  it("renders active countdown when target is in the future", () => {
    const future = new Date(Date.now() + 7200000).toISOString();
    const html = renderToStaticMarkup(
      React.createElement(GameCountdown, {
        target: future,
        label: "Competition begins in",
        isEnded: false,
      })
    );

    expect(html).toContain("Competition begins in");
    expect(html).not.toContain("Event Ended");
  });
});
