"use client";

import React, { useState, useMemo } from "react";
import { Trophy, Medal, User, Flag } from "lucide-react";
import { formatDuration } from "../api/leaderboard/route";

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  totalScore: number;
  challengesCompleted: number;
  aggregateDurationMs: number;
  lastCompletionMs: number;
}

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  totalChallenges: number;
  currentTeamId?: string | null;
}

export function LeaderboardView({
  entries,
  totalChallenges,
  currentTeamId,
}: LeaderboardViewProps) {
  const [mode, setMode] = useState<"points" | "race">("points");

  // Sorted list based on active mode
  const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      if (mode === "points") {
        // Points Tournament: Score desc, Completed desc, Duration asc, LastCompletion asc
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        if (b.challengesCompleted !== a.challengesCompleted) return b.challengesCompleted - a.challengesCompleted;
        if (a.aggregateDurationMs !== b.aggregateDurationMs) return a.aggregateDurationMs - b.aggregateDurationMs;
        return a.lastCompletionMs - b.lastCompletionMs;
      } else {
        // First Finish Race: Solved Count desc, Aggregate Duration asc, Score desc
        if (b.challengesCompleted !== a.challengesCompleted) return b.challengesCompleted - a.challengesCompleted;
        if (a.aggregateDurationMs !== b.aggregateDurationMs) return a.aggregateDurationMs - b.aggregateDurationMs;
        return b.totalScore - a.totalScore;
      }
    });
  }, [entries, mode]);

  return (
    <div className="space-y-4">
      {/* View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-1.5 bg-[#121215] border border-[#27272a] rounded-lg">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode("points")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
              mode === "points"
                ? "bg-[#18181b] text-cyan-400 border border-[#27272a] shadow-sm"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Points Tournament</span>
          </button>

          <button
            type="button"
            onClick={() => setMode("race")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 ${
              mode === "race"
                ? "bg-[#18181b] text-cyan-400 border border-[#27272a] shadow-sm"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>First Finish Race</span>
          </button>
        </div>

        <div className="text-[11px] text-[#a1a1aa] px-2 font-mono">
          {mode === "points" ? (
            <span>Ranked by: Total Points → Duration</span>
          ) : (
            <span>Ranked by: Missions Solved → Lowest Time</span>
          )}
        </div>
      </div>

      {sortedEntries.length === 0 ? (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center space-y-3">
          <Trophy className="w-8 h-8 text-[#a1a1aa] mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-white">No Verified Submissions Yet</h3>
          <p className="text-xs text-[#a1a1aa] max-w-md mx-auto">
            Solve challenges from the mission catalog to record verified standings on the official board.
          </p>
        </div>
      ) : (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#18181b] border-b border-[#27272a] text-[#a1a1aa] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-3 sm:px-4 w-14 sm:w-16">Rank</th>
                  <th className="py-3 px-3 sm:px-4">Team</th>
                  <th className="py-3 px-3 sm:px-4">{mode === "points" ? "Score" : "Solved"}</th>
                  <th className="py-3 px-3 sm:px-4">{mode === "points" ? "Solved" : "Score"}</th>
                  <th className="py-3 px-3 sm:px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a] font-mono">
                {sortedEntries.map((t, idx) => {
                  const isCurrentTeam = currentTeamId && t.teamId === currentTeamId;

                  return (
                    <tr
                      key={t.teamId}
                      className={`transition-colors ${
                        isCurrentTeam
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
                            {t.teamName}
                          </span>
                          {isCurrentTeam && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {mode === "points" ? (
                        <>
                          <td className="py-3.5 px-3 sm:px-4 font-extrabold text-cyan-400 text-sm tabular-nums">
                            {t.totalScore} PTS
                          </td>
                          <td className="py-3.5 px-3 sm:px-4 text-[#fafafa] tabular-nums">
                            {t.challengesCompleted} / {totalChallenges}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3.5 px-3 sm:px-4 font-extrabold text-emerald-400 text-sm tabular-nums">
                            {t.challengesCompleted} / {totalChallenges}
                          </td>
                          <td className="py-3.5 px-3 sm:px-4 text-cyan-400 tabular-nums">
                            {t.totalScore} PTS
                          </td>
                        </>
                      )}

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
