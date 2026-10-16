"use client";

import React, { useState } from "react";
import {
  Shield,
  Play,
  Pause,
  StopCircle,
  Eye,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { formatDuration } from "@/lib/format";

interface AdminClientProps {
  initialEvent: any;
  initialChallenges: any[];
  initialRuns: any[];
}

export function AdminDashboardClient({
  initialEvent,
  initialChallenges,
  initialRuns,
}: AdminClientProps) {
  const [event, setEvent] = useState(initialEvent);
  const [challenges] = useState(initialChallenges);
  const [runs] = useState(initialRuns);
  const [activeTab, setActiveTab] = useState<"challenges" | "runs" | "create">("challenges");
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null);
  const [updatingEvent, setUpdatingEvent] = useState(false);

  // New Challenge Form State
  const [newSlug, setNewSlug] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiff, setNewDiff] = useState("MEDIUM");
  const [newMappingJson, setNewMappingJson] = useState('{\n  "cd": "mkdir",\n  "ls": "cat"\n}');
  const [newCluesJson, setNewCluesJson] = useState('[\n  {\n    "id": "c1",\n    "title": "Protocol Note",\n    "type": "base64",\n    "plaintextAnswer": "Use cd to make directory",\n    "encodedContent": "VXNlIGNkIHRvIG1ha2UgZGlyZWN0b3J5",\n    "hintNote": "Base64 encoding"\n  }\n]');
  const [newSeedJson, setNewSeedJson] = useState('{\n  "/workspace/target.txt": "FLAG{SAMPLE_KEY}"\n}');
  const [newObjJson, setNewObjJson] = useState('{\n  "description": "Create /workspace/done",\n  "rules": [\n    {\n      "type": "dir_exists",\n      "path": "/workspace/done",\n      "description": "Folder /workspace/done created"\n    }\n  ]\n}');
  const [savingChallenge, setSavingChallenge] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);

  const handleValidateForm = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const payload = {
        slug: newSlug,
        title: newTitle,
        description: newDesc,
        difficulty: newDiff,
        order: challenges.length + 1,
        timeLimitSeconds: newDiff === "HARD" ? 1800 : newDiff === "MEDIUM" ? 1500 : 1200,
        scoringConfig: {
          maxBaseScore: 1000,
          intermediateBudget: 500,
          completionBonus: 200,
          speedBonusMax: 300,
          hintPenaltyCap: 100,
          defaultHintPenalty: 25,
          difficultyMultiplier: newDiff === "HARD" ? 1.5 : newDiff === "MEDIUM" ? 1.25 : 1.0,
          timeLimitSeconds: newDiff === "HARD" ? 1800 : newDiff === "MEDIUM" ? 1500 : 1200,
          partialCreditOnExpiry: true,
          countsTowardLeaderboard: true,
        },
        commandMappings: JSON.parse(newMappingJson),
        clues: JSON.parse(newCluesJson),
        initialFilesystem: JSON.parse(newSeedJson),
        objectiveConfig: JSON.parse(newObjJson),
      };

      const res = await fetch("/api/admin/challenges/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setValidationResult(data);
    } catch (err) {
      setValidationResult({
        valid: false,
        errors: ["JSON Syntax Error: " + (err as Error).message],
        warnings: [],
      });
    } finally {
      setValidating(false);
    }
  };

  const handleUpdateEventStatus = async (status: string) => {
    setUpdatingEvent(true);
    try {
      const res = await fetch("/api/admin/event", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvent(data.event);
      }
    } catch (err) {
      alert("Failed to update event: " + (err as Error).message);
    } finally {
      setUpdatingEvent(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChallenge(true);
    try {
      const payload = {
        slug: newSlug,
        title: newTitle,
        description: newDesc,
        difficulty: newDiff,
        order: challenges.length + 1,
        commandMappings: JSON.parse(newMappingJson),
        clues: JSON.parse(newCluesJson),
        initialFilesystem: JSON.parse(newSeedJson),
        objectiveConfig: JSON.parse(newObjJson),
      };

      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Challenge created successfully!");
        window.location.reload();
      } else {
        alert(data.error || "Failed to create challenge.");
      }
    } catch (err) {
      alert("Invalid JSON or server error: " + (err as Error).message);
    } finally {
      setSavingChallenge(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full flex-1 space-y-6">
      {/* Admin Title & Event Control */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-[#121215] border border-[#27272a] p-5 sm:p-6 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">Admin Console</h1>
          </div>
          <p className="text-xs text-[#a1a1aa]">
            Control tournament state, inspect decoded answer keys, author challenges, and monitor active runs.
          </p>
        </div>

        {/* Status controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full lg:w-auto">
          <span className="text-[#a1a1aa] mr-1 text-[11px] font-semibold uppercase tracking-wider">Tournament:</span>
          <button
            type="button"
            onClick={() => handleUpdateEventStatus("ACTIVE")}
            disabled={updatingEvent || event?.status === "ACTIVE"}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              event?.status === "ACTIVE"
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-bold"
                : "bg-[#18181b] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Active
          </button>
          <button
            type="button"
            onClick={() => handleUpdateEventStatus("PAUSED")}
            disabled={updatingEvent || event?.status === "PAUSED"}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              event?.status === "PAUSED"
                ? "bg-amber-950/60 text-amber-400 border border-amber-800 font-bold"
                : "bg-[#18181b] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            Paused
          </button>
          <button
            type="button"
            onClick={() => handleUpdateEventStatus("ENDED")}
            disabled={updatingEvent || event?.status === "ENDED"}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              event?.status === "ENDED"
                ? "bg-rose-950/60 text-rose-400 border border-rose-800 font-bold"
                : "bg-[#18181b] text-[#a1a1aa] hover:text-white border border-[#27272a]"
            }`}
          >
            <StopCircle className="w-3.5 h-3.5" />
            Ended
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#27272a] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("challenges")}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "challenges"
              ? "bg-[#18181b] text-cyan-400 border border-[#27272a]"
              : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          Challenge Master Keys ({challenges.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("runs")}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "runs"
              ? "bg-[#18181b] text-cyan-400 border border-[#27272a]"
              : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          Active Runs ({runs.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("create")}
          className={`px-3.5 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "create"
              ? "bg-[#18181b] text-cyan-400 border border-[#27272a]"
              : "text-[#a1a1aa] hover:text-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Author Challenge
        </button>
      </div>

      {/* TAB 1: CHALLENGES & PRIVATE ANSWER KEYS */}
      {activeTab === "challenges" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {challenges.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedChallenge(c)}
                className={`p-4 rounded-xl border bg-[#121215] cursor-pointer transition-colors ${
                  selectedChallenge?.id === c.id
                    ? "border-cyan-500 bg-[#18181b]"
                    : "border-[#27272a] hover:border-[#3f3f46]"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-[#fafafa]">#{String(c.order).padStart(2, "0")}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                    c.difficulty === "EASY"
                      ? "badge-easy"
                      : c.difficulty === "MEDIUM"
                      ? "badge-medium"
                      : "badge-hard"
                  }`}>
                    {c.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{c.title}</h3>
                {c.objectiveConfig?.description && (
                  <p className="text-xs text-[#a1a1aa] line-clamp-2 mt-1">
                    {c.objectiveConfig.description}
                  </p>
                )}
                <div className="mt-3 text-[11px] text-cyan-400 flex items-center gap-1 font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  Inspect master keys & mappings
                </div>
              </div>
            ))}
          </div>

          {selectedChallenge && (
            <div className="p-6 rounded-xl bg-[#121215] border border-[#27272a] space-y-6">
              <div className="flex items-center justify-between border-b border-[#27272a] pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Master Key Preview: {selectedChallenge.title}
                  </h2>
                  <p className="text-xs text-[#a1a1aa]">
                    Confidential server verification parameters (never exposed in public API responses).
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold uppercase">
                  CONFIDENTIAL ADMIN VIEW
                </span>
              </div>

              {/* Command Mappings */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
                  Configured Command Mapping Matrix:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(selectedChallenge.commandMappings).map(([entered, target]) => (
                    <div
                      key={entered}
                      className="p-2.5 rounded bg-[#18181b] border border-[#27272a] text-xs flex items-center justify-between font-mono"
                    >
                      <span className="text-rose-400 font-bold">&quot;{entered}&quot;</span>
                      <span className="text-neutral-500">→</span>
                      <span className="text-emerald-400 font-bold">&quot;{target as string}&quot;</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decoded Clues with Plaintext Answers */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
                  Decoded Clues & Answers:
                </h3>
                <div className="space-y-3">
                  {selectedChallenge.clues.map((clue: any, idx: number) => (
                    <div
                      key={clue.id || idx}
                      className="p-4 rounded-lg bg-[#18181b] border border-[#27272a] space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-400">{clue.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#121215] text-[#a1a1aa] uppercase border border-[#27272a]">
                          {clue.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#a1a1aa] block mb-0.5">Plaintext Solution:</span>
                        <span className="text-emerald-300 font-mono font-medium bg-emerald-950/30 px-2 py-1 rounded block">
                          {clue.plaintextAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="text-[#a1a1aa] block mb-0.5">Encoded String (Player Facing):</span>
                        <span className="text-cyan-300 font-mono break-all text-[11px]">
                          {clue.encodedContent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#fafafa] uppercase tracking-wider">
                  Objective Evaluation Rules:
                </h3>
                <pre className="p-3 rounded-lg bg-[#18181b] border border-[#27272a] text-cyan-300 text-xs overflow-x-auto font-mono">
                  {JSON.stringify(selectedChallenge.objectiveConfig, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE TEAM RUNS */}
      {activeTab === "runs" && (
        <div className="bg-[#121215] border border-[#27272a] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#18181b] border-b border-[#27272a] text-[#a1a1aa] font-semibold uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Challenge</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Commands</th>
                  <th className="py-3 px-4">Recent Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#27272a]">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#a1a1aa] italic">
                      No active runs recorded.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="hover:bg-[#18181b]/50">
                      <td className="py-3 px-4 text-[#a1a1aa] text-[10px]">
                        {run.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-sans">
                        {run.team.name}
                      </td>
                      <td className="py-3 px-4 text-[#fafafa]">
                        {run.challenge.title}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            run.status === "COMPLETED"
                              ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                              : run.status === "IN_PROGRESS"
                              ? "bg-cyan-950/60 text-cyan-400 border border-cyan-800"
                              : "bg-[#18181b] text-[#a1a1aa] border border-[#27272a]"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold tabular-nums">
                        {formatDuration(run.durationMs)}
                      </td>
                      <td className="py-3 px-4 text-cyan-400 tabular-nums">{run.commandCount}</td>
                      <td className="py-3 px-4 text-[#a1a1aa] text-[11px] truncate max-w-xs">
                        {run.commandLogs[0] ? (
                          <span>
                            $ {run.commandLogs[0].enteredCommand} → {run.commandLogs[0].mappedOperation}
                          </span>
                        ) : (
                          <span className="text-neutral-600">None</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUTHOR NEW CHALLENGE */}
      {activeTab === "create" && (
        <form onSubmit={handleCreateChallenge} className="bg-[#121215] border border-[#27272a] p-6 rounded-xl space-y-4 text-xs">
          <div className="border-b border-[#27272a] pb-3">
            <h2 className="text-base font-bold text-white">Author Custom Challenge</h2>
            <p className="text-[#a1a1aa] text-xs">
              Configure command mappings, encoded clues, virtual filesystem seeds, and objective rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[#a1a1aa] block mb-1">Unique Slug:</label>
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. quantum-divergence"
                className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-[#a1a1aa] block mb-1">Difficulty:</label>
              <select
                value={newDiff}
                onChange={(e) => setNewDiff(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-white outline-none focus:border-cyan-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[#a1a1aa] block mb-1">Challenge Title:</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Operation Quantum Divergence (Level 4)"
              className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="text-[#a1a1aa] block mb-1">Description / Briefing:</label>
            <textarea
              required
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Briefing instructions for competitors..."
              className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-cyan-400 font-semibold block mb-1">Command Mappings (JSON):</label>
              <textarea
                required
                rows={5}
                value={newMappingJson}
                onChange={(e) => setNewMappingJson(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-cyan-400 font-semibold block mb-1">Clues (JSON Array):</label>
              <textarea
                required
                rows={5}
                value={newCluesJson}
                onChange={(e) => setNewCluesJson(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-cyan-400 font-semibold block mb-1">Initial Filesystem Seed (JSON):</label>
              <textarea
                required
                rows={5}
                value={newSeedJson}
                onChange={(e) => setNewSeedJson(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-cyan-400 font-semibold block mb-1">Objective Evaluation Rules (JSON):</label>
              <textarea
                required
                rows={5}
                value={newObjJson}
                onChange={(e) => setNewObjJson(e.target.value)}
                className="w-full bg-[#18181b] border border-[#27272a] rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Validation Feedback Banner */}
          {validationResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                validationResult.valid
                  ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                  : "bg-rose-950/40 border-rose-800 text-rose-300"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {validationResult.valid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Configuration Validated:
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    Validation Errors Found:
                  </>
                )}
              </div>
              {validationResult.valid ? (
                <p className="text-[11px] text-emerald-400">
                  All commands, filesystem entries, objective budget, and difficulty rules are verified.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-300">
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleValidateForm}
              disabled={validating || savingChallenge}
              className="px-5 py-2.5 rounded-lg btn-secondary text-xs font-bold transition-colors disabled:opacity-50"
            >
              {validating ? "Validating..." : "Validate Rules (Server Check)"}
            </button>
            <button
              type="submit"
              disabled={savingChallenge || validating}
              className="px-6 py-2.5 rounded-lg btn-primary text-xs font-bold transition-colors disabled:opacity-50"
            >
              {savingChallenge ? "Saving Challenge..." : "Publish New Challenge"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
