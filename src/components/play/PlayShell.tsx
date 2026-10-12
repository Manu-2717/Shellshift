"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Terminal as TerminalComponent } from "@/components/Terminal";
import { ObjectiveBar } from "@/components/ObjectiveBar";
import { LiveTimer } from "@/components/LiveTimer";
import { ContextPanel } from "@/components/play/ContextPanel";
import { CompletionSummary } from "@/components/play/CompletionSummary";
import {
  ArrowLeft,
  Terminal as TerminalIcon,
  KeyRound,
  FolderTree,
  Wifi,
  AlertTriangle,
  User,
  PauseCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface PlayShellProps {
  runData: any;
  isCompleted: boolean;
  finalDuration: number | null;
  onCommandExecuted: (result: any) => void;
  onNextChallenge: () => void;
  startingNext?: boolean;
  onRefreshRun?: () => void;
}

export function PlayShell({
  runData,
  isCompleted,
  finalDuration,
  onCommandExecuted,
  onNextChallenge,
  startingNext = false,
  onRefreshRun,
}: PlayShellProps) {
  const [mobileTab, setMobileTab] = useState<"terminal" | "ciphers" | "tree">("terminal");

  const challenge = runData.challenge;
  const game = runData.game;
  const isGamePaused = game?.status === "PAUSED";
  const isGameEnded = game?.status === "ENDED" || game?.status === "ARCHIVED";
  const playerName = runData.player?.name || runData.team?.name || "Contestant";
  const clueCount = challenge.clues?.length || 0;
  const gameId = game?.id || runData.gameId;

  return (
    <div className="flex min-h-screen flex-col bg-[#07080b] font-mono text-[#fafafa] selection:bg-cyan-500 selection:text-black lg:h-screen">
      {/* 1. Top Status Command Bar */}
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-[#0e1016] px-3 py-2 select-none sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Link
            href={gameId ? `/games/${gameId}/lobby` : "/games"}
            className="flex items-center gap-2 group shrink-0"
            title="Return to Game Lobby"
          >
            <div className="flex size-7 items-center justify-center rounded-lg border border-zinc-800 bg-[#161922] text-cyan-400 transition group-hover:border-cyan-500/50">
              <TerminalIcon className="size-3.5" />
            </div>
            <span className="hidden font-mono text-xs font-bold tracking-wider text-white md:inline">
              SHELL<span className="text-cyan-400">SHIFT</span>
            </span>
          </Link>

          <Link
            href={gameId ? `/games/${gameId}/lobby` : "/games"}
            className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-[#161922] text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
            title="Back to game overview"
          >
            <ArrowLeft className="size-3.5" />
          </Link>

          <div className="flex min-w-0 items-center gap-2 truncate">
            {game?.name && (
              <span className="hidden text-xs text-zinc-500 truncate xl:inline">
                {game.name} ·
              </span>
            )}
            <span className="truncate text-xs font-bold tracking-wide text-white">
              {challenge.title}
            </span>
            <StatusBadge
              tone={
                challenge.difficulty === "HARD"
                  ? "danger"
                  : challenge.difficulty === "MEDIUM"
                  ? "warning"
                  : "success"
              }
            >
              {challenge.difficulty}
            </StatusBadge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-1.5 text-[10px] text-emerald-400 xl:flex">
            <Wifi className="size-3.5" />
            <span>Connected</span>
          </div>

          <LiveTimer
            startedAt={runData.startedAt}
            completedAt={runData.completedAt}
            durationMs={finalDuration}
            deadlineAt={runData.deadlineAt}
            timeLimitSeconds={runData.timeLimitSeconds}
            isExpired={runData.status === "EXPIRED"}
          />

          <div className="hidden border-l border-zinc-800 pl-3 text-right md:block">
            <div className="text-[9px] uppercase tracking-widest text-zinc-500">Score</div>
            <div className="text-xs font-bold tabular-nums text-cyan-300">
              {runData.finalScore || runData.objectivePoints || 0} PTS
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-[#161922] px-2 py-1 text-xs">
            <User className="size-3.5 text-cyan-400 shrink-0" />
            <span className="hidden text-zinc-500 sm:inline">Player:</span>
            <span className="max-w-[100px] truncate text-[11px] font-bold text-cyan-300 sm:max-w-none sm:text-xs">
              {playerName}
            </span>
          </div>
        </div>
      </header>

      {/* Paused / Ended Warning Banner */}
      {isGamePaused && (
        <div className="flex items-center gap-2 border-b border-amber-800/80 bg-amber-950/60 px-4 py-2 text-xs font-semibold text-amber-300">
          <PauseCircle className="size-4 shrink-0 text-amber-400" />
          <span>Game is currently PAUSED by tournament hosts. Commands are temporarily halted.</span>
        </div>
      )}
      {isGameEnded && (
        <div className="flex items-center gap-2 border-b border-rose-800/80 bg-rose-950/60 px-4 py-2 text-xs font-semibold text-rose-300">
          <AlertTriangle className="size-4 shrink-0 text-rose-400" />
          <span>Competition has ENDED. New commands are no longer accepted.</span>
        </div>
      )}

      {/* 2. Mission Objective Rail */}
      <ObjectiveBar
        description={challenge.objective?.description || "Satisfy challenge objective criteria"}
        rules={runData.objectiveEvaluation?.details || []}
        isCompleted={isCompleted}
      />

      {/* Mobile/Tablet Workspace Switcher */}
      <div className="flex items-center justify-around border-b border-zinc-800 bg-[#0e1016] px-3 py-1.5 select-none lg:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("terminal")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-bold transition cursor-pointer ${
            mobileTab === "terminal"
              ? "border border-zinc-700 bg-zinc-800 text-cyan-300"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <TerminalIcon className="size-3.5" />
          <span>Terminal</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("ciphers")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-bold transition cursor-pointer ${
            mobileTab === "ciphers"
              ? "border border-zinc-700 bg-zinc-800 text-cyan-300"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <KeyRound className="size-3.5" />
          <span>Clues ({clueCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab("tree")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded py-1.5 text-xs font-bold transition cursor-pointer ${
            mobileTab === "tree"
              ? "border border-zinc-700 bg-zinc-800 text-cyan-300"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          <FolderTree className="size-3.5" />
          <span>Files</span>
        </button>
      </div>

      {/* 3. Main Split-Screen Workspace (Dominant Terminal) */}
      <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-12">
        {/* Terminal Surface (7 cols on desktop) */}
        <div
          className={`h-[520px] flex-col overflow-hidden p-2 lg:col-span-7 lg:h-full lg:p-2.5 ${
            mobileTab === "terminal" ? "flex" : "hidden lg:flex"
          }`}
        >
          <TerminalComponent
            runId={runData.id}
            playerName={playerName}
            currentCwd={runData.currentWorkingDir}
            onCommandExecuted={onCommandExecuted}
            disabled={isCompleted || isGamePaused || isGameEnded}
          />
        </div>

        {/* Context Panel (5 cols on desktop) */}
        <div
          className={`h-[520px] flex-col overflow-hidden p-2 lg:col-span-5 lg:h-full lg:p-2.5 lg:pl-0 ${
            mobileTab === "ciphers" || mobileTab === "tree" ? "flex" : "hidden lg:flex"
          }`}
        >
          <ContextPanel
            clues={challenge.clues || []}
            treeList={runData.treeList || []}
            currentWorkingDir={runData.currentWorkingDir || "/workspace"}
            runId={runData.id}
            onRefreshVfs={onRefreshRun}
            activeTab={mobileTab === "tree" ? "tree" : "clues"}
          />
        </div>
      </div>

      <footer className="hidden h-7 shrink-0 items-center justify-between border-t border-zinc-800 bg-[#0e1016] px-4 text-[10px] text-zinc-500 lg:flex">
        <span>Sandboxed virtual shell · Zero host execution</span>
        <span className="text-emerald-400">Deterministic scoring engine</span>
      </footer>

      {/* Completion Modal */}
      {isCompleted && (
        <CompletionSummary
          runData={runData}
          finalDuration={finalDuration}
          onNextChallenge={onNextChallenge}
          startingNext={startingNext}
        />
      )}
    </div>
  );
}
