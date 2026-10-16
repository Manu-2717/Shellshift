"use client";

import { useEffect, useState } from "react";

export function GameCountdown({
  target,
  label,
  isEnded = false,
}: {
  target: string;
  label: string;
  isEnded?: boolean;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const targetMs = new Date(target).getTime();
  const currentMs = now ?? targetMs;
  const left = Math.max(0, targetMs - currentMs);
  const d = Math.floor(left / 864e5);
  const h = Math.floor(left / 36e5) % 24;
  const m = Math.floor(left / 6e4) % 60;
  const s = Math.floor(left / 1000) % 60;

  if (isEnded || (now !== null && left === 0 && label === "Time remaining")) {
    return (
      <div className="font-mono" aria-live="off">
        <span className="block text-[11px] uppercase tracking-wider text-rose-400 font-semibold">
          Competition Status
        </span>
        <strong
          className="mt-1 block text-xl font-bold text-rose-400"
          suppressHydrationWarning
        >
          Event Ended
        </strong>
      </div>
    );
  }

  if (now !== null && left === 0 && label === "Competition begins in") {
    return (
      <div className="font-mono" aria-live="off">
        <span className="block text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
          Competition Status
        </span>
        <strong
          className="mt-1 block text-xl font-bold text-emerald-400"
          suppressHydrationWarning
        >
          Competition Live
        </strong>
      </div>
    );
  }

  return (
    <div className="font-mono" aria-live="off">
      <span className="block text-[11px] uppercase tracking-wider text-zinc-500">
        {label}
      </span>
      <strong
        className="mt-1 block text-xl tabular-nums text-white"
        suppressHydrationWarning
      >
        {now === null
          ? "--:--:--"
          : `${d ? `${d}d ` : ""}${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`}
      </strong>
    </div>
  );
}
