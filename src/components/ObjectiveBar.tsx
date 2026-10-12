"use client";

import React, { useState } from "react";
import {
  Target,
  CheckCircle2,
  Circle,
  Trophy,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface ObjectiveRuleDetail {
  description: string;
  passed: boolean;
  blocked?: boolean;
}

interface ObjectiveBarProps {
  description: string;
  rules: ObjectiveRuleDetail[];
  isCompleted: boolean;
}

export function ObjectiveBar({
  description,
  rules = [],
  isCompleted,
}: ObjectiveBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const completedCount = rules.filter((r) => r.passed).length;
  const totalCount = rules.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (isCompleted ? 100 : 0);
  const remainingCount = totalCount - completedCount;

  return (
    <section
      aria-label="Mission Objective Status"
      className={`border-b select-none font-mono transition-colors ${
        isCompleted
          ? "bg-[#0b1a13] border-emerald-500/50 text-emerald-100"
          : "bg-[#121215] border-[#27272a] text-[#fafafa]"
      }`}
    >
      {isCollapsed ? (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                isCompleted
                  ? "bg-emerald-950 border-emerald-500/60 text-emerald-400"
                  : "bg-cyan-950/60 border-cyan-800 text-cyan-400"
              }`}
            >
              {isCompleted ? <Trophy className="w-3 h-3" /> : <Target className="w-3 h-3" />}
            </div>
            <span className="text-xs font-bold text-white truncate max-w-sm sm:max-w-md md:max-w-xl">
              {description}
            </span>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <div className="hidden xs:block w-16 sm:w-24 bg-[#18181b] h-1.5 rounded-full overflow-hidden border border-[#27272a]">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                  }`}
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-[11px] font-bold text-cyan-400 font-mono">
                {completedCount}/{totalCount}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] text-cyan-400 border border-[#27272a] transition-colors"
            >
              <span>Directives</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 py-2.5">
          <div className="flex items-center justify-between pb-1.5 text-[10px] text-[#a1a1aa] font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#a1a1aa]">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              Mission Directives
            </span>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="text-[#a1a1aa] hover:text-white flex items-center gap-1 lowercase text-[11px] font-normal transition-colors"
            >
              <span>minimize</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          
            {/* LEFT SECTION (7 cols on lg): Primary Mission Brief & Progress */}
            <div className="lg:col-span-7 flex flex-col justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                        isCompleted
                          ? "bg-emerald-950 border-emerald-500/60 text-emerald-400"
                          : "bg-cyan-950/60 border-cyan-800 text-cyan-400"
                      }`}
                    >
                      {isCompleted ? (
                        <Trophy className="w-3.5 h-3.5" />
                      ) : (
                        <Target className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#a1a1aa]">
                      Primary Directive
                    </span>
                  </div>

                  {/* Progress Pill */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                        isCompleted
                          ? "bg-emerald-950 text-emerald-300 border-emerald-600/70"
                          : "bg-[#121215] text-cyan-400 border-[#27272a]"
                      }`}
                    >
                      {isCompleted ? (
                        "OBJECTIVE COMPLETE"
                      ) : (
                        `${completedCount} / ${totalCount}`
                      )}
                    </span>
                  </div>
                </div>

                {/* Full Mission Description */}
                <div className="pt-1">
                  <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="pt-2.5 mt-2 border-t border-[#27272a] flex items-center gap-3">
                <div className="flex-1 bg-[#121215] h-1.5 rounded-full overflow-hidden border border-[#27272a]">
                  <div
                    className="h-full transition-all duration-300 bg-cyan-500"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-[#a1a1aa] shrink-0 font-mono">
                  {percentComplete}%
                </span>
              </div>
            </div>

            {/* RIGHT SECTION (5 cols on lg): Live Persistent Checklist */}
            <div className="lg:col-span-5 flex flex-col justify-between p-3 rounded-lg bg-[#18181b] border border-[#27272a]">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider pb-1 border-b border-[#27272a]">
                  <span className="text-[#a1a1aa] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    Validation Rules
                  </span>
                  <span className="text-[10px] text-[#a1a1aa] normal-case font-normal font-mono">
                    {remainingCount === 0 ? "All verified" : `${remainingCount} remaining`}
                  </span>
                </div>

                {/* Rule list with pending, completed, blocked states */}
                <div className="space-y-1.5">
                  {rules.length === 0 ? (
                    <div className="text-[11px] text-[#a1a1aa] italic py-1">
                      Inspecting server sandbox conditions...
                    </div>
                  ) : (
                    rules.map((rule, idx) => {
                      const isPassed = rule.passed;
                      const isBlocked = !isPassed && rule.blocked;

                      return (
                        <div
                          key={idx}
                          className={`flex items-start gap-2 p-2 rounded border text-xs leading-snug transition-colors ${
                            isPassed
                              ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-200"
                              : isBlocked
                              ? "bg-[#121215] border-[#27272a] text-[#71717a]"
                              : "bg-[#121215] border-[#27272a] text-[#fafafa]"
                          }`}
                        >
                          {isPassed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : isBlocked ? (
                            <AlertCircle className="w-4 h-4 text-neutral-600 shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          )}

                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <span className={`break-words font-mono text-[11px] ${isPassed ? "line-through text-emerald-300/80" : ""}`}>
                              {rule.description}
                            </span>
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase shrink-0 ${
                                isPassed
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-700/60"
                                  : isBlocked
                                  ? "bg-neutral-900 text-neutral-500 border border-neutral-800"
                                  : "bg-cyan-950 text-cyan-400 border border-cyan-800/60"
                              }`}
                            >
                              {isPassed ? "DONE" : isBlocked ? "BLOCKED" : "PENDING"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="text-[10px] text-[#a1a1aa] pt-2 border-t border-[#27272a] flex items-center justify-between font-mono">
                <span>Server-verified</span>
                <span className="text-cyan-400">Live Engine</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </section>
  );
}
