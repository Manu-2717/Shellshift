"use client";

import React, { useState } from "react";
import { Terminal, Activity, Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  enteredCommand: string;
  mappedOperation: string;
  timestamp: string | Date;
  executionTimeMs: number;
  run?: {
    id: string;
    user?: { name: string | null } | null;
    challenge?: { title: string } | null;
  } | null;
}

interface ActivityFeedProps {
  activity: ActivityItem[];
}

export function ActivityFeed({ activity = [] }: ActivityFeedProps) {
  const [filterCmd, setFilterCmd] = useState("");

  const filtered = activity.filter((item) => {
    if (!filterCmd) return true;
    const q = filterCmd.toLowerCase();
    const cmd = item.enteredCommand.toLowerCase();
    const player = (item.run?.user?.name || "").toLowerCase();
    const challenge = (item.run?.challenge?.title || "").toLowerCase();
    return cmd.includes(q) || player.includes(q) || challenge.includes(q);
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-zinc-400">
          <Activity className="size-3.5 text-cyan-400" />
          <span className="font-semibold text-white">Live Execution Feed</span>
          <span className="text-[10px] text-zinc-500">({activity.length} recent commands)</span>
        </div>

        <input
          type="text"
          placeholder="Filter by command or player..."
          value={filterCmd}
          onChange={(e) => setFilterCmd(e.target.value)}
          className="rounded-lg border border-zinc-800 bg-[#07080b] px-3 py-1 text-xs text-white placeholder-zinc-500 focus:border-cyan-500 focus:outline-none"
        />
      </div>

      <div className="max-h-96 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0e1016] divide-y divide-zinc-800">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No command telemetry recorded for this competition yet.
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="p-3 hover:bg-zinc-800/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-white">
                    {item.run?.user?.name || "Player"}
                  </span>
                  <span className="text-zinc-500">on</span>
                  <span className="text-zinc-300 font-semibold truncate max-w-xs">
                    {item.run?.challenge?.title || "Challenge"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 font-semibold text-cyan-300">
                    <Terminal className="size-3" />
                    <span>$ {item.enteredCommand}</span>
                  </span>
                  <span className="text-zinc-500">→</span>
                  <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.2 text-[10px] text-emerald-400 font-bold">
                    {item.mappedOperation}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-[10px] text-zinc-500 shrink-0 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {item.executionTimeMs}ms
                </span>
                <span>
                  {new Date(item.timestamp).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
