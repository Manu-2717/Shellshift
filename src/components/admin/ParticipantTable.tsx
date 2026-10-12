"use client";

import React, { useState } from "react";
import { User, Search, ShieldCheck } from "lucide-react";

interface Participant {
  id: string;
  registeredAt: string | Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface ParticipantTableProps {
  participants: Participant[];
  standings?: Array<{
    userId: string;
    score: number;
    challengesCompleted: number;
    rank: number;
  }>;
}

export function ParticipantTable({
  participants = [],
  standings = [],
}: ParticipantTableProps) {
  const [query, setQuery] = useState("");

  const standingsMap = new Map(standings.map((s) => [s.userId, s]));

  const filtered = participants.filter((p) => {
    const q = query.toLowerCase();
    const name = (p.user.name || "").toLowerCase();
    const email = (p.user.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="space-y-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-3.5 text-zinc-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search participants..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-800 bg-[#07080b] text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-xs"
          />
        </div>
        <span className="text-[11px] text-zinc-500">
          {participants.length} Registered Contender{participants.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-[#0e1016]">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">
            No registered participants found.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="border-b border-zinc-800 bg-[#161922] text-[10px] uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="py-2.5 px-3">Player</th>
                <th className="py-2.5 px-3">Email</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Registered</th>
                <th className="py-2.5 px-3 text-right">Missions Solved</th>
                <th className="py-2.5 px-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((p) => {
                const s = standingsMap.get(p.user.id);
                return (
                  <tr key={p.id} className="hover:bg-zinc-800/30 transition">
                    <td className="py-2.5 px-3 font-bold text-white flex items-center gap-2">
                      <User className="size-3 text-cyan-400 shrink-0" />
                      <span>{p.user.name || "Anonymous Player"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-400">{p.user.email || "—"}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 rounded border border-emerald-800 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                        <ShieldCheck className="size-3" /> Registered
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 text-[11px]">
                      {new Date(p.registeredAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-zinc-300">
                      {s?.challengesCompleted ?? 0}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold tabular-nums text-cyan-300">
                      {s?.score ?? 0} PTS
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
