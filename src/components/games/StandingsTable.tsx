"use client";

import { useEffect, useState } from "react";

export interface Standing {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  challengesCompleted: number;
  aggregateDurationMs: number;
  isViewer?: boolean;
}

export function StandingsTable({
  rows,
  gameId,
}: {
  rows: Standing[];
  gameId?: string;
}) {
  const [dataRows, setDataRows] = useState<Standing[]>(rows);

  useEffect(() => {
    setDataRows(rows);
  }, [rows]);

  useEffect(() => {
    if (!gameId) return;

    let isMounted = true;

    const fetchLatest = async () => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") {
        return;
      }

      try {
        const res = await fetch(`/api/games/${encodeURIComponent(gameId)}/standings`, {
          cache: "no-store",
          headers: { "Cache-Control": "no-cache" },
        });
        if (res.ok) {
          const json = await res.json();
          if (isMounted && Array.isArray(json?.standings)) {
            setDataRows(json.standings);
          }
        }
      } catch {
        // Silently tolerate background poll hiccups
      }
    };

    const intervalId = setInterval(fetchLatest, 3000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameId]);

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-[#0e1016]">
      {gameId && (
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/40 px-4 py-2.5 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold tracking-wider">LIVE STANDINGS</span>
          </div>
          <span className="text-[10px] text-zinc-500">Auto-updating (3s)</span>
        </div>
      )}
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wider text-zinc-500">
          <tr>
            <th className="p-4">Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Completed</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {dataRows.map((r) => (
            <tr
              key={r.userId}
              className={`border-t border-zinc-800 transition-colors ${
                r.isViewer ? "bg-cyan-950/25" : "hover:bg-zinc-900/30"
              }`}
            >
              <td className="p-4 font-mono text-cyan-300">#{r.rank}</td>
              <td className="font-medium text-white">
                {r.userName}
                {r.isViewer ? (
                  <span className="ml-2 text-xs font-semibold text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/50">
                    You
                  </span>
                ) : null}
              </td>
              <td className="font-mono font-bold text-cyan-300">
                {r.totalScore % 1 === 0
                  ? r.totalScore.toLocaleString()
                  : r.totalScore.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                <span className="text-[10px] font-normal text-zinc-500">PTS</span>
              </td>
              <td>{r.challengesCompleted}</td>
              <td className="font-mono text-zinc-400">
                {Math.floor(r.aggregateDurationMs / 60000)}m{" "}
                {Math.floor(r.aggregateDurationMs / 1000) % 60}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {dataRows.length === 0 ? (
        <p className="p-10 text-center text-sm text-zinc-500">
          No verified finishes yet.
        </p>
      ) : null}
    </div>
  );
}
