"use client";

import React, { useMemo } from "react";
import { Trophy, Medal, User } from "lucide-react";
import { formatDuration } from "../api/leaderboard/route";

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  totalScore: number;
  challengesCompleted: number;
  aggregateDurationMs: number;
  lastCompletionMs?: number;
  rank?: number;
  isViewer?: boolean;
  // Backward compatibility aliases
  teamId?: string;
  teamName?: string;
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  totalChallenges: number;
  currentUserId?: string | null;
  eventName?: string;
}

export function LeaderboardView({
  entries,
  totalChallenges,
  currentUserId,
  eventName,
}: LeaderboardViewProps) {
  // Sorted list: Pure points tournament (Score desc, Completed desc, Duration asc, LastCompletion asc)
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.challengesCompleted !== a.challengesCompleted) return b.challengesCompleted - a.challengesCompleted;
      if (a.aggregateDurationMs !== b.aggregateDurationMs) return a.aggregateDurationMs - b.aggregateDurationMs;
      return (a.lastCompletionMs || 0) - (b.lastCompletionMs || 0);
    });
  }, [entries]);

  return (
    <div className="space-y-4">
      {/* View Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-[#121215] border border-[#27272a] rounded-lg">
        <div className="flex items-center gap-2 px-2 text-xs font-bold text-cyan-400">
          <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Points Leaderboard</span>
          {eventName && (
            <span className="text-zinc-500 font-normal truncate max-w-[200px] sm:max-w-none">
              · {eventName}
            </span>
          )}
        </div>

        <div className="text-[11px] text-[#a1a1aa] px-2 font-mono">
          <span>Ranked by: Total Points → Duration</span>
        </div>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center space-y-3">
          <Trophy className="w-8 h-8 text-[#a1a1aa] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-white">No Verified Submissions Yet</h3>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
            Solve challenges in this event to record verified points on the official leaderboard.
          </p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b] border-b border-[#27272a] text-[#a1a1aa] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 sm:px-4 w-14 sm:w-16">Rank</th>
                  <th className="py-3 px-3 sm:px-4">Player</th>
                  <th className="py-3 px-3 sm:px-4">Score</th>
                  <th className="py-3 px-3 sm:px-4">Solved</th>
                  <th className="py-3 px-3 sm:px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-mono">
                {sortedEntries.map((t, idx) => {
                  const id = t.userId || t.teamId;
                  const name = t.userName || t.teamName;
                  const isCurrent = t.isViewer || (currentUserId && id === currentUserId);

                  return (
                    <tr
                      key={id || idx}
                      className={`transition-colors ${
                        isCurrent
                          ? "bg-cyan-950/20 border-l-2 border-cyan-400 hover:bg-cyan-950/30"
                          : "hover:bg-[#18181b]/50"
                      }`}
                    >
                      <td className="py-3.5 px-3 sm:px-4 font-bold tabular-nums">
                        {idx === 0 ? (
                          <span className="flex items-center gap-1.5 text-amber-400 font-black">
                            <Medal className="w-4 h-4 text-amber-400 shrink-0" /> #1
                          </span>
                        ) : idx === 1 ? (
                          <span className="flex items-center gap-1.5 text-neutral-300 font-bold">
                            <Medal className="w-4 h-4 text-neutral-300 shrink-0" /> #2
                          </span>
                        ) : idx === 2 ? (
                          <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                            <Medal className="w-4 h-4 text-amber-600 shrink-0" /> #3
                          </span>
                        ) : (
                          <span className="text-[#a1a1aa]">#{idx + 1}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-cyan-400 shrink-0 hidden sm:inline" />
                          <span className="truncate max-w-[140px] sm:max-w-none text-white font-bold font-sans">
                            {name}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 font-extrabold text-cyan-400 text-sm tabular-nums">
                        {t.totalScore % 1 === 0
                          ? t.totalScore.toLocaleString()
                          : t.totalScore.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                        PTS
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 text-[#fafafa] tabular-nums">
                        {t.challengesCompleted} {totalChallenges > 0 ? `/ ${totalChallenges}` : ""}
                      </td>

                      <td className="py-3.5 px-3 sm:px-4 font-bold text-emerald-400 tabular-nums">
                        {formatDuration(t.aggregateDurationMs)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
