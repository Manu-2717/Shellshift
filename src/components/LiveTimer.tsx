"use client";

import React, { useEffect, useState } from "react";
import { Timer, Trophy } from "lucide-react";

interface LiveTimerProps {
  startedAt: string | Date;
  completedAt?: string | Date | null;
  durationMs?: number | null;
}

export function LiveTimer({ startedAt, completedAt, durationMs }: LiveTimerProps) {
  const getInitialMs = () => {
    if (durationMs !== undefined && durationMs !== null) return durationMs;
    if (completedAt) {
      return Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
    }
    return Math.max(0, Date.now() - new Date(startedAt).getTime());
  };

  const [elapsedMs, setElapsedMs] = useState<number>(getInitialMs);

  useEffect(() => {
    if (durationMs !== undefined && durationMs !== null) return;
    if (completedAt) return;

    const startTimestamp = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startTimestamp));
    }, 60);

    return () => clearInterval(interval);
  }, [startedAt, completedAt, durationMs]);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((elapsedMs % 1000) / 100);

  const isCompleted = !!completedAt || (durationMs !== undefined && durationMs !== null);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition-colors ${
        isCompleted
          ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
          : "bg-neutral-900 border-neutral-800 text-cyan-300"
      }`}
    >
      {isCompleted ? (
        <Trophy className="w-4 h-4 text-emerald-400 animate-bounce" />
      ) : (
        <Timer className="w-4 h-4 text-cyan-400 animate-pulse" />
      )}

      <div className="flex items-baseline gap-1">
        <span className="text-[10px] text-neutral-400 font-sans tracking-wide uppercase">
          {isCompleted ? "Verified Time" : "Server Clock"}
        </span>
        <span className="text-sm font-bold tracking-wider">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}.
          <span className="text-xs text-neutral-400">{tenths}</span>
        </span>
      </div>
    </div>
  );
}
