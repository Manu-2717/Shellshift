"use client";

import React from "react";
import { Target, CheckCircle2, Circle, Trophy, AlertCircle, ShieldCheck } from "lucide-react";

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
          : "bg-[#111116] border-neutral-800 text-neutral-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
          
          {/* LEFT SECTION (7 cols on lg): Primary Mission Brief & Progress */}
          <div className="lg:col-span-7 flex flex-col justify-between p-3 rounded-lg bg-[#0c0c10] border border-neutral-800/80">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${
                      isCompleted
                        ? "bg-emerald-950 border-emerald-500/60 text-emerald-400"
                        : "bg-cyan-950 border-cyan-800 text-cyan-400"
                    }`}
                  >
                    {isCompleted ? (
                      <Trophy className="w-3.5 h-3.5" />
                    ) : (
                      <Target className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                    Mission Directive — What to Achieve
                  </span>
                </div>

                {/* Progress Pill */}
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                      isCompleted
                        ? "bg-emerald-950 text-emerald-300 border-emerald-600/70"
                        : "bg-neutral-900 text-cyan-300 border-neutral-700"
                    }`}
                  >
                    {isCompleted ? (
                      "MISSION COMPLETE"
                    ) : (
                      `${completedCount} of ${totalCount} objectives complete`
                    )}
                  </span>
                </div>
              </div>

              {/* Full Mission Description (Never Truncated) */}
              <div className="pt-1">
                <p className="text-xs sm:text-sm font-semibold text-white leading-relaxed">
                  {description}
                </p>
              </div>
            </div>

            {/* Authoritative Progress Bar */}
            <div className="pt-2.5 mt-2 border-t border-neutral-800/60 flex items-center gap-3">
              <div className="flex-1 bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    isCompleted ? "bg-emerald-500" : "bg-cyan-500"
                  }`}
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-neutral-400 shrink-0">
                {percentComplete}% Satisfied
              </span>
            </div>
          </div>

          {/* RIGHT SECTION (5 cols on lg): Live Persistent Checklist */}
          <div className="lg:col-span-5 flex flex-col justify-between p-3 rounded-lg bg-[#0c0c10] border border-neutral-800/80">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider pb-1 border-b border-neutral-800/60">
                <span className="text-neutral-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  Criteria Checklist
                </span>
                <span className="text-[10px] text-neutral-500 normal-case font-normal">
                  {remainingCount === 0 ? "All verified" : `${remainingCount} remaining`}
                </span>
              </div>

              {/* Rule list with pending, completed, blocked states */}
              <div className="space-y-1.5">
                {rules.length === 0 ? (
                  <div className="text-[11px] text-neutral-500 italic py-1">
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
                            ? "bg-[#0b1c14] border-emerald-500/50 text-emerald-200"
                            : isBlocked
                            ? "bg-neutral-950 border-neutral-800/80 text-neutral-500"
                            : "bg-[#121217] border-neutral-800 text-neutral-300"
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

            <div className="text-[10px] text-neutral-500 pt-2 border-t border-neutral-800/40 flex items-center justify-between">
              <span>Authoritative verification</span>
              <span className="text-cyan-400">Live Server State</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
