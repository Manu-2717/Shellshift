"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Trophy,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Target,
  ListChecks,
} from "lucide-react";

export interface ObjectiveRuleDetail {
  description: string;
  passed: boolean;
  blocked?: boolean;
}

interface ObjectiveBarProps {
  challengeTitle?: string;
  challengeDescription?: string;
  description: string;
  rules: ObjectiveRuleDetail[];
  isCompleted: boolean;
  difficulty?: string;
}

function renderObjectiveText(text: string) {
  const parts = text.split(/(`[^`]+`|\/(?:workspace|bin|etc|var|tmp|home|usr)[\w\/\.\-_]*)/g);
  return parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("`") && part.endsWith("`")) {
      const code = part.slice(1, -1);
      return (
        <code
          key={i}
          className="mx-0.5 rounded border border-cyan-500/30 bg-[#0d1726] px-1.5 py-0.5 font-mono text-[11px] text-cyan-400 font-semibold"
        >
          {code}
        </code>
      );
    }
    if (part.startsWith("/")) {
      return (
        <code
          key={i}
          className="mx-0.5 rounded border border-cyan-500/30 bg-[#0d1726] px-1.5 py-0.5 font-mono text-[11px] text-cyan-400 font-semibold"
        >
          {part}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ObjectiveBar({
  challengeTitle = "Challenge Objective",
  challengeDescription,
  description,
  rules = [],
  isCompleted,
  difficulty = "EASY",
}: ObjectiveBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const completedCount = rules.filter((r) => r.passed).length;
  const totalCount = rules.length;

  const diffUpper = (difficulty || "EASY").toUpperCase();
  const diffBadgeClass =
    diffUpper === "HARD"
      ? "border-rose-500/40 bg-rose-950/40 text-rose-400"
      : diffUpper === "MEDIUM"
      ? "border-amber-500/40 bg-amber-950/40 text-amber-400"
      : "border-emerald-500/40 bg-emerald-950/40 text-emerald-400";

  return (
    <section
      aria-label="Mission Objective Status"
      className="mx-3 mt-2.5 mb-2 select-none font-mono sm:mx-4"
    >
      <div
        className={`rounded-xl border transition-colors shadow-xl ${
          isCompleted
            ? "border-emerald-500/50 bg-[#081510]"
            : "border-[#1e2434] bg-[#0d101a]"
        }`}
      >
        {isCollapsed ? (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">
                CHALLENGE:
              </span>
              <span className="truncate text-xs font-bold text-white">
                {challengeTitle}
              </span>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${diffBadgeClass}`}>
                {diffUpper}
              </span>
              <span className="hidden md:inline text-xs text-zinc-400 truncate max-w-md">
                — {description}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs font-bold text-cyan-400 font-mono">
                {completedCount} / {totalCount} OBJECTIVES
              </span>
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="flex items-center gap-1 rounded border border-[#23293a] bg-[#121622] px-2.5 py-1 text-[11px] text-cyan-400 hover:bg-[#1a2030] transition cursor-pointer"
              >
                <span>Expand</span>
                <ChevronDown className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 space-y-3.5">
            {/* Top Row: Challenge Name & Objectives Counter */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-[#1e2434] pb-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                  CHALLENGE
                </span>
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-white tracking-tight">
                  {challengeTitle}
                </h1>
                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${diffBadgeClass}`}>
                  {diffUpper}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    STATUS:
                  </span>
                  <span className="font-bold text-cyan-300">
                    {completedCount} / {totalCount} OBJECTIVES
                  </span>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                    isCompleted
                      ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                      : "bg-[#141824] text-zinc-400 border-[#23293a]"
                  }`}>
                    {isCompleted ? "COMPLETED" : "IN PROGRESS"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCollapsed(true)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition"
                  title="Minimize challenge header"
                >
                  <ChevronUp className="size-4" />
                </button>
              </div>
            </div>

            {/* Split Content: Mission Description & What To Do */}
            <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-12 items-start">
              {/* Left Column (7 cols): Challenge Story & Objective */}
              <div className="space-y-2 lg:col-span-7">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <Target className="size-3.5 text-cyan-400" />
                  <span>Mission Objective & Context</span>
                </div>

                {challengeDescription && challengeDescription !== description && (
                  <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                    {challengeDescription}
                  </p>
                )}

                <div className="rounded-lg border border-[#1e2434] bg-[#070910] p-3 text-xs sm:text-sm text-zinc-200 font-mono leading-relaxed">
                  <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider block mb-1">
                    PRIMARY DIRECTIVE:
                  </span>
                  {renderObjectiveText(description)}
                </div>
              </div>

              {/* Right Column (5 cols): What To Do Checklist */}
              <div className="space-y-2 lg:col-span-5 border-t border-[#1e2434] pt-3 lg:border-t-0 lg:border-l lg:border-[#1e2434] lg:pl-4 lg:pt-0">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <ListChecks className="size-3.5 text-emerald-400" />
                    <span>What To Do</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono normal-case">
                    {totalCount - completedCount === 0 ? "All verified" : `${totalCount - completedCount} remaining`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {rules.length === 0 ? (
                    <div className="rounded-lg border border-[#1e2434] bg-[#070910] p-2.5 text-[11px] text-zinc-400 italic">
                      Satisfy the primary directive using the terminal.
                    </div>
                  ) : (
                    rules.map((rule, idx) => {
                      const isPassed = rule.passed;
                      const isBlocked = !isPassed && rule.blocked;

                      return (
                        <div
                          key={idx}
                          className={`flex items-center justify-between gap-2.5 p-2 rounded-lg border text-xs font-mono transition ${
                            isPassed
                              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                              : "bg-[#070910] border-[#1e2434] text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isPassed ? (
                              <CheckCircle2 className="size-3.5 text-emerald-400 shrink-0" />
                            ) : isBlocked ? (
                              <AlertCircle className="size-3.5 text-neutral-500 shrink-0" />
                            ) : (
                              <Circle className="size-3.5 text-cyan-400 shrink-0" />
                            )}
                            <span
                              className={`truncate text-[11px] ${
                                isPassed
                                  ? "line-through text-emerald-300/70"
                                  : isBlocked
                                  ? "text-zinc-500"
                                  : "text-zinc-200"
                              }`}
                              title={rule.description}
                            >
                              {rule.description}
                            </span>
                          </div>

                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded tracking-wider shrink-0 border ${
                              isPassed
                                ? "bg-emerald-950/60 text-emerald-400 border-emerald-500/40"
                                : isBlocked
                                ? "bg-neutral-900 text-neutral-500 border-neutral-800"
                                : "bg-[#141824] text-cyan-400 border-cyan-800/40"
                            }`}
                          >
                            {isPassed ? "DONE" : isBlocked ? "BLOCKED" : "PENDING"}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


