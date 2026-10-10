"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Terminal } from "@/components/Terminal";
import { CipherWorkspace } from "@/components/CipherWorkspace";
import { LiveTimer } from "@/components/LiveTimer";
import {
  Trophy,
  ArrowLeft,
  HelpCircle,
  AlertTriangle,
} from "lucide-react";

export default function PlayChallengePage() {
  const params = useParams();
  const runId = params?.runId as string;

  const [runData, setRunData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const [hintUnlocking, setHintUnlocking] = useState(false);

  // Fetch initial run data
  const fetchRunState = async () => {
    try {
      const res = await fetch(`/api/runs/${runId}`);
      if (!res.ok) {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to load challenge run.");
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRunData(data.run);
      if (data.run.status === "COMPLETED") {
        setIsCompleted(true);
        setFinalDuration(data.run.durationMs);
      }
    } catch (err) {
      setErrorMsg("Network error: " + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (runId) {
      fetchRunState();
    }
  }, [runId]);

  // Handle command execution updates from the terminal
  const handleCommandExecuted = (result: any) => {
    if (result.cwd && runData) {
      setRunData((prev: any) => ({
        ...prev,
        currentWorkingDir: result.cwd,
        commandCount: result.commandCount,
        objectiveEvaluation: result.objectiveEvaluation || prev.objectiveEvaluation,
      }));
    }

    if (result.isCompleted) {
      setIsCompleted(true);
      setFinalDuration(result.durationMs);
      // Refresh run state to get updated tree
      fetchRunState();
    } else {
      // Periodically refresh tree state on state mutations
      fetchRunState();
    }
  };

  const handleUnlockHint = async (hintId: string) => {
    if (hintUnlocking) return;
    if (!confirm("Unlocking this hint will add penalty seconds to your team's time. Proceed?")) {
      return;
    }

    setHintUnlocking(true);
    try {
      const res = await fetch(`/api/runs/${runId}/hints/${hintId}`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchRunState();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHintUnlocking(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-mono">
        <div className="text-cyan-400 animate-pulse text-sm">
          Loading virtual shell sandbox & clues...
        </div>
      </div>
    );
  }

  if (errorMsg || !runData) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center font-mono p-4">
        <div className="max-w-md w-full p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-4 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold text-white">Challenge Access Error</h2>
          <p className="text-xs text-neutral-400">{errorMsg || "Unable to access run."}</p>
          <Link
            href="/lobby"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-xs text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Lobby
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono overflow-hidden">
      {/* Top Workspace Header */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 px-4 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-4">
          <Link
            href="/lobby"
            className="p-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
            title="Return to Lobby"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white tracking-wide">
              {runData.challenge.title}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 font-bold uppercase">
              {runData.challenge.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Server-Synchronized Live Timer */}
          <LiveTimer
            startedAt={runData.startedAt}
            completedAt={runData.completedAt}
            durationMs={finalDuration}
          />

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-500">Team:</span>
            <span className="text-cyan-300 font-bold">{runData.team.name}</span>
          </div>

          {/* Hint Dropdown / Action */}
          {runData.challenge.hints && runData.challenge.hints.length > 0 && !isCompleted && (
            <div className="relative group">
              <button
                type="button"
                className="px-2.5 py-1.5 rounded bg-amber-950/40 hover:bg-amber-950 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Request Hint</span>
              </button>

              <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-900 border border-neutral-800 rounded-lg shadow-2xl p-2 hidden group-hover:block z-50">
                <div className="text-[10px] text-neutral-400 mb-2 font-bold px-1 uppercase tracking-wider">
                  Available Hints (+Penalty)
                </div>
                {runData.challenge.hints.map((hint: any) => {
                  const isUnlocked = runData.unlockedHints?.some((h: any) => h.id === hint.id);
                  return (
                    <div
                      key={hint.id}
                      className="p-2 rounded bg-neutral-950 border border-neutral-800/80 mb-1 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-neutral-200">{hint.title}</div>
                        <div className="text-[10px] text-amber-400">+{hint.penaltySeconds}s penalty</div>
                      </div>
                      {isUnlocked ? (
                        <span className="text-[10px] text-emerald-400 font-semibold">Unlocked</span>
                      ) : (
                        <button
                          onClick={() => handleUnlockHint(hint.id)}
                          disabled={hintUnlocking}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] transition-colors"
                        >
                          Unlock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Terminal Area (7 columns on large screens) */}
        <div className="lg:col-span-7 h-full p-2 lg:p-3 overflow-hidden flex flex-col">
          <Terminal
            runId={runId}
            teamName={runData.team.name}
            currentCwd={runData.currentWorkingDir}
            onCommandExecuted={handleCommandExecuted}
            disabled={isCompleted}
          />
        </div>

        {/* Cipher & Scratchpad Area (5 columns on large screens) */}
        <div className="lg:col-span-5 h-full p-2 lg:p-3 pl-0 overflow-hidden flex flex-col">
          <CipherWorkspace
            clues={runData.challenge.clues}
            treeList={runData.treeList || []}
            objectiveDetails={runData.objectiveEvaluation?.details || []}
            unlockedHints={runData.unlockedHints || []}
          />
        </div>
      </div>

      {/* Completion Modal Overlay */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-neutral-900 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 space-y-6 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/60 mx-auto flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-950/50">
              <Trophy className="w-8 h-8 animate-bounce" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold uppercase tracking-widest">
                Race Finished!
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight">
                Objective Accomplished
              </h2>
              <p className="text-xs text-neutral-400">
                Your team has successfully decoded the cipher and satisfied all virtual filesystem requirements.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
              <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold">
                Authoritative Finish Time
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                {finalDuration ? `${(finalDuration / 1000).toFixed(2)}s` : "--"}
              </div>
              <div className="text-xs text-neutral-400">
                Commands Executed: <span className="text-cyan-300 font-bold">{runData.commandCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href={`/results/${runId}`}
                className="flex-1 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
              >
                View Full Results & Rank
              </Link>
              <Link
                href="/leaderboard"
                className="py-3 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors"
              >
                Leaderboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
