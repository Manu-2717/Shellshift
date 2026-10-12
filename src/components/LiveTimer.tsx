"use client";

import React, { useEffect, useState } from "react";
import { Timer, Trophy } from "lucide-react";

interface LiveTimerProps {
  startedAt: string | Date;
  completedAt?: string | Date | null;
  durationMs?: number | null;
  deadlineAt?: string | Date | null;
  timeLimitSeconds?: number | null;
  isExpired?: boolean;
}

export function LiveTimer({
  startedAt,
  completedAt,
  durationMs,
  deadlineAt,
  timeLimitSeconds,
  isExpired: initialExpired,
}: LiveTimerProps) {
  const getInitialMs = () => {
    if (durationMs !== undefined && durationMs !== null) return durationMs;
    if (completedAt) {
      return Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime());
    }
    return Math.max(0, Date.now() - new Date(startedAt).getTime());
  };

  const [elapsedMs, setElapsedMs] = useState<number>(getInitialMs);
  const isCompleted = !!completedAt || (durationMs !== undefined && durationMs !== null);

  useEffect(() => {
    if (durationMs !== undefined && durationMs !== null) return;
    if (completedAt) return;

    const startTimestamp = new Date(startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedMs(Math.max(0, Date.now() - startTimestamp));
    }, 100);

    return () => clearInterval(interval);
  }, [startedAt, completedAt, durationMs]);

  const totalSeconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const tenths = Math.floor((elapsedMs % 1000) / 100);

  // Remaining time calculation
  let remainingSeconds: number | null = null;
  let isExpired = initialExpired;

  if (deadlineAt) {
    const deadlineMs = new Date(deadlineAt).getTime();
    const configuredWindowMs = Math.max(0, deadlineMs - new Date(startedAt).getTime());
    const remainingMs = configuredWindowMs - elapsedMs;
    remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
    if (remainingMs <= 0 && !isCompleted) {
      isExpired = true;
    }
  } else if (timeLimitSeconds) {
    remainingSeconds = Math.max(0, timeLimitSeconds - totalSeconds);
    if (totalSeconds >= timeLimitSeconds && !isCompleted) {
      isExpired = true;
    }
  }

  const remMinutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : null;
  const remSecs = remainingSeconds !== null ? remainingSeconds % 60 : null;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono transition-colors ${
          isCompleted
            ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
            : isExpired
            ? "bg-rose-950/40 border-rose-500/50 text-rose-300"
            : "bg-[#18181b] border-[#27272a] text-cyan-400"
        }`}
      >
        {isCompleted ? (
          <Trophy className="w-4 h-4 text-emerald-400" />
        ) : (
          <Timer className={`w-4 h-4 ${isExpired ? "text-rose-400" : "text-cyan-400 animate-pulse"}`} />
        )}

        <div className="flex items-baseline gap-1.5">
          <span className="text-[10px] text-[#a1a1aa] font-sans tracking-wide uppercase">
            {isCompleted ? "Time" : isExpired ? "Expired" : "Timer"}
          </span>
          <span className="text-sm font-bold tracking-wider tabular-nums">
            {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}.
            <span className="text-xs text-[#a1a1aa]">{tenths}</span>
          </span>
        </div>
      </div>

      {!isCompleted && remainingSeconds !== null && (
        <div
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono tabular-nums ${
            isExpired || remainingSeconds <= 120
              ? "bg-rose-950/40 border-rose-800/80 text-rose-400 font-bold animate-pulse"
              : "bg-[#18181b] border-[#27272a] text-[#a1a1aa]"
          }`}
        >
          <span className="text-[10px] text-[#a1a1aa] uppercase font-sans">Remaining:</span>
          <span>
            {remMinutes?.toString().padStart(2, "0")}:{remSecs?.toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
