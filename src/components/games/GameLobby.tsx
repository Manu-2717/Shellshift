"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Lock, Terminal, AlertCircle } from "lucide-react";

type ChallengeItem = {
  id: string;
  title: string;
  difficulty: string;
  order: number;
  runId?: string | null;
  status?: string | null;
};

export function GameLobby({
  gameId,
  challenges,
  live,
}: {
  gameId: string;
  challenges: ChallengeItem[];
  live: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState("");
  const [error, setError] = useState<string | null>(null);

  const start = async (id: string) => {
    setError(null);
    setLoading(id);
    try {
      const r = await fetch("/api/runs/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId, challengeId: id }),
      });
      const d = await r.json();
      setLoading("");
      if (r.ok && d.run?.id) {
        router.push(`/play/${d.run.id}`);
      } else {
        setError(d.error || "Unable to start challenge run. Please try again.");
      }
    } catch {
      setLoading("");
      setError("Network error while starting run. Check your connection.");
    }
  };

  return (
    <div className="grid gap-4">
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-800/80 bg-rose-950/40 p-4 text-sm text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs text-rose-400 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {challenges.map((c) => (
          <article
            key={c.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded-xl border border-zinc-800 bg-[#0e1016] p-4"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-zinc-900 font-mono text-xs text-cyan-300">
              {String(c.order).padStart(2, "0")}
            </span>
            <div>
              <h2 className="font-medium">{c.title}</h2>
              <p className="text-xs text-zinc-500">
                {c.difficulty} · {c.status || "Not started"}
              </p>
            </div>
            {!live ? (
              <Lock className="size-4 text-zinc-600" />
            ) : c.status === "COMPLETED" ? (
              <button
                className="btn-secondary"
                onClick={() => router.push(`/play/${c.runId}`)}
              >
                Review
                <ArrowRight className="size-4" />
              </button>
            ) : c.runId ? (
              <button
                className="btn-primary"
                onClick={() => router.push(`/play/${c.runId}`)}
              >
                Continue
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                className="btn-primary"
                onClick={() => start(c.id)}
                disabled={!!loading}
              >
                {loading === c.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Terminal className="size-4" />
                )}
                Start
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
