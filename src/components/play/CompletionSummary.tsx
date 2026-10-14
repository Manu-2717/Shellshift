"use client";

import React from "react";
import Link from "next/link";
import { Trophy, ArrowRight, Clock, Terminal as TerminalIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CompletionSummaryProps {
  runData: any;
  finalDuration?: number | null;
  onNextChallenge?: () => void;
  startingNext?: boolean;
}

export function CompletionSummary({
  runData,
  finalDuration,
  onNextChallenge,
  startingNext = false,
}: CompletionSummaryProps) {
  const durationSec = finalDuration
    ? (finalDuration / 1000).toFixed(2)
    : runData.durationMs
    ? (runData.durationMs / 1000).toFixed(2)
    : "--";

  const nextChallenge = runData.nextChallenge;
  const gameId = runData.game?.id || runData.gameId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-emerald-500/40 bg-[#0e1016] p-6 text-center shadow-2xl sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-400">
          <Trophy className="size-7" />
        </div>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
            <CheckCircle2 className="size-3.5" />
            <span>Mission Accomplished</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Objective Satisfied</h2>
          <p className="text-xs text-zinc-400">
            Authoritative evaluation engine verified all conditions and computed individual standings.
          </p>
        </div>

        <div className="space-y-3 rounded-xl border border-zinc-800 bg-[#07080b] p-4 text-left font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="size-3.5 text-cyan-400" /> Verified Time
            </span>
            <span className="text-lg font-bold tabular-nums text-emerald-400">{durationSec}s</span>
          </div>

          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <span className="flex items-center gap-1.5 text-xs text-zinc-400">
              <TerminalIcon className="size-3.5 text-cyan-400" /> Commands Executed
            </span>
            <span className="text-sm font-bold text-white">{runData.commandCount}</span>
          </div>

          <div className="flex items-center justify-between pt-0.5">
            <span className="text-xs text-zinc-400">Final Score</span>
            <span className="text-xl font-extrabold tabular-nums text-cyan-300">
              {typeof runData.finalScore === "number" && runData.finalScore > 0
                ? (runData.finalScore % 1 === 0 ? runData.finalScore : runData.finalScore.toFixed(2))
                : (runData.objectivePoints || 0)}{" "}
              PTS
            </span>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          {nextChallenge ? (
            <Button
              onClick={onNextChallenge}
              disabled={startingNext}
              className="w-full justify-center gap-2 py-3 text-xs font-bold"
            >
              {startingNext ? (
                "Launching next mission..."
              ) : (
                <>
                  <span>Next Mission: {nextChallenge.title}</span>
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          ) : (
            <Link
              href={gameId ? `/games/${gameId}/standings` : "/games"}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-xs font-bold"
            >
              <span>View Final Standings</span>
              <Trophy className="size-4 text-amber-300" />
            </Link>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href={`/results/${runData.id}`}
              className="btn-secondary py-2 text-center font-semibold"
            >
              Score Breakdown
            </Link>
            <Link
              href={gameId ? `/games/${gameId}/lobby` : "/games"}
              className="btn-secondary py-2 text-center font-semibold"
            >
              Game Lobby
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
