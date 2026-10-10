"use client";

import React from "react";
import { Target, CheckCircle2, Circle, Trophy } from "lucide-react";

interface ObjectiveRuleDetail {
  description: string;
  passed: boolean;
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

  return (
    <div
      className={`border-b px-4 py-2.5 transition-colors select-none font-mono ${
        isCompleted
          ? "bg-emerald-950/30 border-emerald-500/40"
          : "bg-neutral-900/90 border-neutral-800"
      }`}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Main Objective Title & Description */}
        <div className="flex items-start md:items-center gap-2.5 min-w-0">
          <div
            className={`w-7 h-7 rounded flex items-center justify-center shrink-0 border ${
              isCompleted
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                : "bg-cyan-950 border-cyan-800 text-cyan-400"
            }`}
          >
            {isCompleted ? (
              <Trophy className="w-4 h-4" />
            ) : (
              <Target className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">
                Primary Mission Objective
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isCompleted
                    ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                    : "bg-neutral-800 text-cyan-300 border-neutral-700"
                }`}
              >
                {isCompleted ? "COMPLETED" : `${completedCount}/${totalCount} TASKS DONE`}
              </span>
            </div>
            <p className="text-xs font-semibold text-neutral-100 truncate">
              {description}
            </p>
          </div>
        </div>

        {/* Right: Live Objective Rule Checklist Pills */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] transition-colors ${
                rule.passed
                  ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                  : "bg-neutral-950 border-neutral-800 text-neutral-400"
              }`}
            >
              {rule.passed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-neutral-600 shrink-0" />
              )}
              <span className={rule.passed ? "font-medium text-emerald-200" : ""}>
                {rule.description}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
