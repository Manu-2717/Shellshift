"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Terminal } from "@/components/Terminal";
import { CipherWorkspace } from "@/components/CipherWorkspace";
import { ObjectiveBar } from "@/components/ObjectiveBar";
import { LiveTimer } from "@/components/LiveTimer";
import {
  Trophy,
  ArrowLeft,
  HelpCircle,
  AlertTriangle,
  Users,
  Terminal as TerminalIcon,
  KeyRound,
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
  const [mobileTab, setMobileTab] = useState<"terminal" | "ciphers">("terminal");

  // Fetch run data from server
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
      fetchRunState();
    } else {
      fetchRunState();
    }
  };

  const handleUnlockHint = async (hintId: string) => {
    if (hintUnlocking) return;
    if (
      !confirm(
        "Unlocking this hint will add penalty seconds to your team's official time. Proceed?"
      )
    ) {
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
      <div className="min-h-screen bg-[#09090b] text-neutral-100 flex items-center justify-center font-mono">
        <div className="text-cyan-400 text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Mounting isolated sandbox filesystem...
        </div>
      </div>
    );
  }

  if (errorMsg || !runData) {
    return (
      <div className="min-h-screen bg-[#09090b] text-neutral-100 flex items-center justify-center font-mono p-4">
        <div className="max-w-md w-full p-6 rounded-lg bg-[#121215] border border-neutral-800 space-y-4 text-center">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-base font-bold text-white">Challenge Access Error</h2>
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

  const clueCount = runData.challenge.clues?.length || 0;

  return (
    <div className="min-h-screen lg:h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      {/* 1. Compact Top Workspace Header */}
      <header className="border-b border-neutral-800 bg-[#121215] px-3 sm:px-4 py-2 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          {/* ShellShift Branding */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500 transition-colors">
              <TerminalIcon className="w-3 h-3" />
            </div>
            <span className="font-mono font-bold text-xs tracking-wider text-white hidden md:inline">
              SHELL<span className="text-cyan-400">SHIFT</span>
            </span>
          </Link>

          <Link
            href="/lobby"
            className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors shrink-0"
            title="Return to Competition Lobby"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Link>

          {/* Current Challenge Title & Difficulty */}
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="text-xs font-bold text-white tracking-wide truncate">
              {runData.challenge.title}
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold uppercase border border-neutral-700 shrink-0">
              {runData.challenge.difficulty}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Live Synchronized Authoritative Timer */}
          <LiveTimer
            startedAt={runData.startedAt}
            completedAt={runData.completedAt}
            durationMs={finalDuration}
          />

          {/* Team Identity Pill */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-xs">
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-neutral-400 hidden sm:inline">Team:</span>
            <span className="text-cyan-300 font-bold text-[11px] sm:text-xs max-w-[100px] sm:max-w-none truncate">
              {runData.team.name}
            </span>
          </div>

          {/* Hint Dropdown */}
          {runData.challenge.hints && runData.challenge.hints.length > 0 && !isCompleted && (
            <div className="relative group">
              <button
                type="button"
                className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1 transition-colors font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hints</span>
              </button>

              <div className="absolute right-0 top-full mt-1 w-64 bg-[#121215] border border-neutral-800 rounded-lg shadow-2xl p-2 hidden group-hover:block z-50">
                <div className="text-[10px] text-neutral-400 mb-2 font-bold px-1 uppercase tracking-wider">
                  Available Hints (+Penalty)
                </div>
                {runData.challenge.hints.map((hint: any) => {
                  const isUnlocked = runData.unlockedHints?.some((h: any) => h.id === hint.id);
                  return (
                    <div
                      key={hint.id}
                      className="p-2 rounded bg-neutral-950 border border-neutral-800 mb-1 flex items-center justify-between text-xs"
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
                          className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-black font-bold text-[10px] transition-colors"
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

      {/* 2. Prominent Mission Objective Panel Immediately Below Header */}
      <ObjectiveBar
        description={runData.challenge.objective?.description || "Satisfy challenge objective criteria"}
        rules={runData.objectiveEvaluation?.details || []}
        isCompleted={isCompleted}
      />

      {/* Mobile/Tablet Workspace Viewport Switcher (< lg) */}
      <div className="lg:hidden bg-[#121215] border-b border-neutral-800 px-3 py-1.5 flex items-center justify-around select-none">
        <button
          onClick={() => setMobileTab("terminal")}
          className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "terminal"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <TerminalIcon className="w-3.5 h-3.5" />
          Interactive Terminal
        </button>
        <button
          onClick={() => setMobileTab("ciphers")}
          className={`flex-1 py-1.5 text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === "ciphers"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Investigation & Clues ({clueCount})
        </button>
      </div>

      {/* 3. Main Split-Screen Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Terminal Area (7 columns on desktop, conditional on mobile) */}
        <div
          className={`lg:col-span-7 h-[500px] lg:h-full p-2 lg:p-2.5 overflow-hidden flex flex-col ${
            mobileTab === "terminal" ? "flex" : "hidden lg:flex"
          }`}
        >
          <Terminal
            runId={runId}
            teamName={runData.team.name}
            currentCwd={runData.currentWorkingDir}
            onCommandExecuted={handleCommandExecuted}
            disabled={isCompleted}
          />
        </div>

        {/* Cipher Investigation Area (5 columns on desktop, conditional on mobile) */}
        <div
          className={`lg:col-span-5 h-[500px] lg:h-full p-2 lg:p-2.5 lg:pl-0 overflow-hidden flex flex-col ${
            mobileTab === "ciphers" ? "flex" : "hidden lg:flex"
          }`}
        >
          <CipherWorkspace
            clues={runData.challenge.clues}
            treeList={runData.treeList || []}
            unlockedHints={runData.unlockedHints || []}
            runId={runId}
          />
        </div>
      </div>

      {/* Completion Modal Overlay */}
      {isCompleted && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#121215] border border-emerald-500/50 rounded-xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-emerald-950 border border-emerald-500/50 mx-auto flex items-center justify-center text-emerald-400">
              <Trophy className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold uppercase tracking-widest">
                Race Finished!
              </span>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Objective Accomplished
              </h2>
              <p className="text-xs text-neutral-400">
                Your team has successfully decoded the cipher and satisfied all virtual filesystem requirements.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#0a0a0c] border border-neutral-800 space-y-1.5">
              <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
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
                className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-neutral-950 font-bold text-xs transition-colors"
              >
                View Full Results & Rank
              </Link>
              <Link
                href="/leaderboard"
                className="py-2.5 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs transition-colors"
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
