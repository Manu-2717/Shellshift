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
  onTimeUp?: () => void;
}

export function LiveTimer({
  startedAt,
  completedAt,
  durationMs,
  deadlineAt,
  timeLimitSeconds,
  isExpired: initialExpired,
  onTimeUp,
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
  const hasTriggeredRef = React.useRef(false);

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
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onTimeUp?.();
      }
    }
  } else if (timeLimitSeconds) {
    remainingSeconds = Math.max(0, timeLimitSeconds - totalSeconds);
    if (totalSeconds >= timeLimitSeconds && !isCompleted) {
      isExpired = true;
      if (!hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onTimeUp?.();
      }
    }
  }

  const remMinutes = remainingSeconds !== null ? Math.floor(remainingSeconds / 60) : null;
  const remSecs = remainingSeconds !== null ? remainingSeconds % 60 : null;

  return (
    <div className="flex items-center gap-2.5 font-mono">
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs transition-colors shadow-[0_0_12px_rgba(6,182,212,0.08)] ${
          isCompleted
            ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
            : isExpired
            ? "bg-rose-950/50 border-rose-500/50 text-rose-300"
            : "bg-[#121622] border-[#23293a] text-cyan-400"
        }`}
      >
        {isCompleted ? (
          <Trophy className="size-3.5 text-emerald-400 shrink-0" />
        ) : (
          <Timer className={`size-3.5 ${isExpired ? "text-rose-400" : "text-cyan-400 animate-pulse"} shrink-0`} />
        )}

        <span className="font-bold tracking-wider tabular-nums text-xs sm:text-sm text-cyan-300" suppressHydrationWarning>
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}.
          <span className="text-xs text-cyan-400/70">{tenths}</span>
        </span>
      </div>

      {!isCompleted && remainingSeconds !== null && (
        <div
          className={`hidden sm:flex items-center gap-1.5 text-xs font-mono tabular-nums uppercase tracking-wider ${
            isExpired || remainingSeconds <= 120
              ? "text-rose-400 font-bold animate-pulse"
              : "text-zinc-400"
          }`}
        >
          <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold">REMAINING</span>
          <span className="font-bold text-zinc-300" suppressHydrationWarning>
            {remMinutes?.toString().padStart(2, "0")}:{remSecs?.toString().padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}
