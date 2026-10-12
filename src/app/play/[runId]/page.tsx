"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PlayShell } from "@/components/play/PlayShell";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function PlayChallengePage() {
  const params = useParams();
  const runId = params?.runId as string;

  const router = useRouter();
  const [runData, setRunData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalDuration, setFinalDuration] = useState<number | null>(null);
  const [startingNext, setStartingNext] = useState(false);

  // Fetch run state from server
  const fetchRunState = useCallback(async () => {
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
  }, [runId]);

  useEffect(() => {
    if (runId) {
      fetchRunState();
    }
  }, [runId, fetchRunState]);

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

  const handleGoToNextProblem = async () => {
    if (!runData?.nextChallenge) {
      const gameId = runData?.game?.id || runData?.gameId;
      router.push(gameId ? `/games/${gameId}/standings` : "/games");
      return;
    }

    setStartingNext(true);
    try {
      const res = await fetch("/api/runs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: runData.nextChallenge.id,
          gameId: runData.game?.id || runData.gameId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.run?.id) {
        router.push(`/play/${data.run.id}`);
      } else {
        const gameId = runData.game?.id || runData.gameId;
        router.push(gameId ? `/games/${gameId}/lobby` : "/games");
      }
    } catch {
      router.push("/games");
    } finally {
      setStartingNext(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080b] font-mono text-white">
        <div className="flex items-center gap-2.5 text-xs text-cyan-400">
          <span className="size-2 animate-ping rounded-full bg-cyan-400" />
          <span>Mounting isolated sandbox filesystem...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !runData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07080b] p-4 font-mono text-white">
        <div className="w-full max-w-md space-y-4 rounded-xl border border-zinc-800 bg-[#0e1016] p-6 text-center shadow-xl">
          <AlertTriangle className="mx-auto size-8 text-rose-400" />
          <h2 className="text-base font-bold text-white">Challenge Access Error</h2>
          <p className="text-xs text-zinc-400">{errorMsg || "Unable to access run session."}</p>
          <div className="pt-2">
            <Link
              href="/games"
              className="btn-secondary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
            >
              <ArrowLeft className="size-3.5" />
              <span>Return to Games</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PlayShell
      runData={runData}
      isCompleted={isCompleted}
      finalDuration={finalDuration}
      onCommandExecuted={handleCommandExecuted}
      onNextChallenge={handleGoToNextProblem}
      startingNext={startingNext}
      onRefreshRun={fetchRunState}
    />
  );
}
