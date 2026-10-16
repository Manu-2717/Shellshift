"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";

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
  currentUserId,
}: {
  rows: Standing[];
  gameId?: string;
  currentUserId?: string;
}) {
  const [dataRows, setDataRows] = useState<Standing[]>(rows);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const lastUpdatedRef = useRef<number>(Date.now());
  const isIdleRef = useRef<boolean>(false);
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDataRows(rows);
    lastUpdatedRef.current = Date.now();
  }, [rows]);

  const fetchLatest = useCallback(async () => {
    if (!gameId) return;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return;

    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/games/${encodeURIComponent(gameId)}/standings`, {
        cache: "default", // Allows browser and Vercel Edge CDN caching
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json?.standings)) {
          setDataRows(json.standings);
          lastUpdatedRef.current = Date.now();
          setSecondsAgo(0);
        }
      }
    } catch {
      // Tolerate background network fluctuations
    } finally {
      setIsRefreshing(false);
    }
  }, [gameId]);

  // Smart Polling with Vercel Free-Tier Optimization:
  // 1. 10s interval (reduces request volume by 70% compared to 3s).
  // 2. Pauses completely when tab is hidden or backgrounded.
  // 3. Pauses when user has been idle for > 3 minutes (saves thousands of calls).
  // 4. Instantly refreshes on tab refocus or user activity resumption.
  useEffect(() => {
    if (!gameId) return;

    // Track "Updated X seconds ago" ticker
    const tickerInterval = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdatedRef.current) / 1000));
    }, 1000);

    const resetIdle = () => {
      if (isIdleRef.current) {
        isIdleRef.current = false;
        fetchLatest();
      }
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      // Mark idle after 3 minutes of no user interaction
      idleTimeoutRef.current = setTimeout(() => {
        isIdleRef.current = true;
      }, 180000);
    };

    resetIdle();
    window.addEventListener("mousemove", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle, { passive: true });
    window.addEventListener("touchstart", resetIdle, { passive: true });

    // 10-second polling interval
    const intervalId = setInterval(() => {
      if (!isIdleRef.current) {
        fetchLatest();
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetIdle();
        fetchLatest();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(tickerInterval);
      clearInterval(intervalId);
      if (idleTimeoutRef.current) clearTimeout(idleTimeoutRef.current);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
      window.removeEventListener("touchstart", resetIdle);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gameId, fetchLatest]);

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
            <span className="hidden sm:inline text-[10px] text-zinc-500">
              · Updated {secondsAgo}s ago
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLatest()}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-400 transition hover:border-zinc-700 hover:text-white disabled:opacity-50"
              title="Refresh standings"
            >
              <RefreshCw className={`size-3 ${isRefreshing ? "animate-spin text-cyan-400" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
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
          {dataRows.map((r) => {
            const isViewer = r.isViewer || (currentUserId && r.userId === currentUserId);

            return (
              <tr
                key={r.userId}
                className={`border-t border-zinc-800 transition-colors ${
                  isViewer ? "bg-cyan-950/25" : "hover:bg-zinc-900/30"
                }`}
              >
                <td className="p-4 font-mono text-cyan-300">#{r.rank}</td>
                <td className="font-medium text-white">
                  {r.userName}
                  {isViewer ? (
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
            );
          })}
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
