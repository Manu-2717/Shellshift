"use client";

import { useEffect, useState } from "react";

export function GameCountdown({
  target,
  label,
}: {
  target: string;
  label: string;
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
