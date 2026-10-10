"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  Clock,
  Trophy,
  Target,
  ArrowRight,
  Play,
  Shield,
  Layers,
} from "lucide-react";
import { StartRunButton } from "./StartButton";

export interface LobbyChallengeItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  order: number;
  timeLimitSeconds: number;
  estimatedDuration?: string;
  scoringConfig: {
    maxBaseScore: number;
    difficultyMultiplier: number;
  };
  clueCount: number;
  objectiveDescription: string;
  runStatus?: "COMPLETED" | "IN_PROGRESS" | null;
  runId?: string | null;
  runDurationMs?: number | null;
  finalScore?: number | null;
}

interface LobbyCatalogProps {
  challenges: LobbyChallengeItem[];
}

export function LobbyCatalog({ challenges }: LobbyCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<"ALL" | "EASY" | "MEDIUM" | "HARD">("ALL");

  const filteredChallenges = useMemo(() => {
    return challenges.filter((c) => {
      const matchesSearch =
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.objectiveDescription.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDiff = difficultyFilter === "ALL" || c.difficulty === difficultyFilter;
      return matchesSearch && matchesDiff;
    });
  }, [challenges, searchQuery, difficultyFilter]);

  const easyChallenges = useMemo(
    () => filteredChallenges.filter((c) => c.difficulty === "EASY"),
    [filteredChallenges]
  );
  const mediumChallenges = useMemo(
    () => filteredChallenges.filter((c) => c.difficulty === "MEDIUM"),
    [filteredChallenges]
  );
  const hardChallenges = useMemo(
    () => filteredChallenges.filter((c) => c.difficulty === "HARD"),
    [filteredChallenges]
  );

  const formatDuration = (durationMs?: number | null) => {
    if (!durationMs && durationMs !== 0) return "--:--";
    const totalSeconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const renderChallengeCard = (challenge: LobbyChallengeItem) => {
    const isCompleted = challenge.runStatus === "COMPLETED";
    const isInProgress = challenge.runStatus === "IN_PROGRESS";
    const maxScore = Math.floor(
      (challenge.scoringConfig?.maxBaseScore || 1000) *
        (challenge.scoringConfig?.difficultyMultiplier || 1.0)
    );

    return (
      <div
        key={challenge.id}
        className={`flex flex-col justify-between p-5 rounded-xl border bg-[#121215] transition-all ${
          isCompleted
            ? "border-emerald-600/50 bg-[#0d1612]"
            : isInProgress
            ? "border-cyan-500 bg-[#0e161c]"
            : "border-neutral-800 hover:border-neutral-700"
        }`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              Level {challenge.order}
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded uppercase border ${
                challenge.difficulty === "EASY"
                  ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                  : challenge.difficulty === "MEDIUM"
                  ? "bg-amber-950 text-amber-300 border-amber-800"
                  : "bg-rose-950 text-rose-300 border-rose-800"
              }`}
            >
              {challenge.difficulty}
            </span>
          </div>

          <h3 className="font-bold text-white text-sm leading-snug">
            {challenge.title}
          </h3>

          {/* Quick Metrics Bar: Duration, Time Limit & Max Attainable Score */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-neutral-400 pt-1">
            <div className="p-2 rounded bg-[#09090b] border border-neutral-800/80 flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>Limit: {Math.floor(challenge.timeLimitSeconds / 60)}m</span>
            </div>
            <div className="p-2 rounded bg-[#09090b] border border-neutral-800/80 flex items-center gap-1.5">
              <Trophy className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Max: {maxScore} pts</span>
            </div>
          </div>

          {/* Prominent Mission Objective Preview */}
          <div className="p-2.5 rounded bg-[#09090b] border border-neutral-800 space-y-1">
            <div className="text-[10px] font-bold text-neutral-400 flex items-center gap-1.5 uppercase tracking-wide">
              <Target className="w-3 h-3 text-cyan-400" />
              Mission Objective
            </div>
            <div className="text-xs text-neutral-200 font-medium leading-relaxed">
              {challenge.objectiveDescription || "Inspect cipher clues & fulfill objective conditions"}
            </div>
          </div>

          <div className="text-[11px] text-neutral-500 flex items-center gap-2 font-mono">
            <span>{challenge.clueCount} Cipher Clues</span>
            <span>•</span>
            <span>Est: {challenge.estimatedDuration || "15 min"}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800 mt-4">
          {isCompleted ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Completed
                </span>
                <span>{formatDuration(challenge.runDurationMs)}</span>
              </div>
              <Link
                href={`/results/${challenge.runId}`}
                className="w-full py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                View Verified Result
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : isInProgress ? (
            <Link
              href={`/play/${challenge.runId}`}
              className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Resume Active Race
            </Link>
          ) : (
            <StartRunButton challengeId={challenge.id} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Difficulty Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121215] border border-neutral-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search missions by title, keywords or objective..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#09090b] border border-neutral-800 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-[#09090b] p-1 rounded-lg border border-neutral-800 text-xs">
          {(["ALL", "EASY", "MEDIUM", "HARD"] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficultyFilter(diff)}
              className={`px-3 py-1.5 rounded-md font-bold transition-colors ${
                difficultyFilter === diff
                  ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {diff === "ALL" ? `All (${challenges.length})` : diff}
            </button>
          ))}
        </div>
      </div>

      {/* No Results Fallback */}
      {filteredChallenges.length === 0 && (
        <div className="p-12 text-center bg-[#121215] border border-neutral-800 rounded-xl space-y-2">
          <Layers className="w-8 h-8 text-neutral-600 mx-auto" />
          <h4 className="text-sm font-bold text-neutral-300">No matching challenges found</h4>
          <p className="text-xs text-neutral-500">Try adjusting your search terms or filter selection.</p>
        </div>
      )}

      {/* SECTION 1: EASY (8 Challenges) */}
      {(difficultyFilter === "ALL" || difficultyFilter === "EASY") && easyChallenges.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                Easy Missions — Fundamental Protocols ({easyChallenges.length})
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">1.0x Multiplier • 20m Limits</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {easyChallenges.map(renderChallengeCard)}
          </div>
        </section>
      )}

      {/* SECTION 2: MEDIUM (9 Challenges) */}
      {(difficultyFilter === "ALL" || difficultyFilter === "MEDIUM") && mediumChallenges.length > 0 && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-amber-400">
                Medium Missions — Multi-Stage Transpositions ({mediumChallenges.length})
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">1.25x Multiplier • 25m Limits</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediumChallenges.map(renderChallengeCard)}
          </div>
        </section>
      )}

      {/* SECTION 3: HARD (3 Challenges) */}
      {(difficultyFilter === "ALL" || difficultyFilter === "HARD") && hardChallenges.length > 0 && (
        <section className="space-y-3 pt-4">
          <div className="flex items-center justify-between pb-1 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400">
                Hard Missions — Deep Breaches & Convergence ({hardChallenges.length})
              </h2>
            </div>
            <span className="text-[11px] text-neutral-500 font-mono">1.5x Multiplier • 30m Limits</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hardChallenges.map(renderChallengeCard)}
          </div>
        </section>
      )}
    </div>
  );
}
