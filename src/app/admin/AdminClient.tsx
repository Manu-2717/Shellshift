"use client";

import React, { useState } from "react";
import {
  Shield,
  Play,
  Pause,
  StopCircle,
  Eye,
  Plus,
} from "lucide-react";
import { formatDuration } from "../api/leaderboard/route";

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
  const [challenges, setChallenges] = useState(initialChallenges);
  const [runs, setRuns] = useState(initialRuns);
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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-neutral-900 border border-neutral-800 p-6 rounded-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">Administrator Command Console</h1>
          </div>
          <p className="text-xs text-neutral-400">
            Control competition status, inspect decoded answer keys, author challenges, and monitor live runs.
          </p>
        </div>

        {/* Status controls */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500 mr-2">Event Controls:</span>
          <button
            onClick={() => handleUpdateEventStatus("ACTIVE")}
            disabled={updatingEvent || event?.status === "ACTIVE"}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              event?.status === "ACTIVE"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            Active
          </button>
          <button
            onClick={() => handleUpdateEventStatus("PAUSED")}
            disabled={updatingEvent || event?.status === "PAUSED"}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              event?.status === "PAUSED"
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <Pause className="w-3.5 h-3.5" />
            Paused
          </button>
          <button
            onClick={() => handleUpdateEventStatus("ENDED")}
            disabled={updatingEvent || event?.status === "ENDED"}
            className={`px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors ${
              event?.status === "ENDED"
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold"
                : "bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            <StopCircle className="w-3.5 h-3.5" />
            Ended
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab("challenges")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "challenges"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Challenge Master Keys ({challenges.length})
        </button>
        <button
          onClick={() => setActiveTab("runs")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors ${
            activeTab === "runs"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          Live Team Runs ({runs.length})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-1.5 ${
            activeTab === "create"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Author New Challenge
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
                className={`p-4 rounded-xl border bg-neutral-900 cursor-pointer transition-all ${
                  selectedChallenge?.id === c.id
                    ? "border-cyan-500 bg-cyan-950/20 shadow-lg"
                    : "border-neutral-800 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-bold text-neutral-300">Level {c.order}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded uppercase font-bold bg-neutral-800 text-cyan-300">
                    {c.difficulty}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm">{c.title}</h3>
                <p className="text-xs text-neutral-400 line-clamp-2 mt-1">{c.description}</p>
                <div className="mt-3 text-[11px] text-cyan-400 flex items-center gap-1 font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  Click to inspect decoded answer keys & mappings
                </div>
              </div>
            ))}
          </div>

          {selectedChallenge && (
            <div className="p-6 rounded-xl bg-neutral-900 border border-neutral-800 space-y-6 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Master Key Preview: {selectedChallenge.title}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Private server verification parameters (never exposed in player API responses).
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded bg-rose-950 border border-rose-800 text-rose-300 text-xs font-bold uppercase">
                  CONFIDENTIAL ADMIN VIEW
                </span>
              </div>

              {/* Command Mappings */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Configured Command Mapping Matrix:
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(selectedChallenge.commandMappings).map(([entered, target]) => (
                    <div
                      key={entered}
                      className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-xs flex items-center justify-between"
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
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Decoded Clues & Answers:
                </h3>
                <div className="space-y-3">
                  {selectedChallenge.clues.map((clue: any, idx: number) => (
                    <div
                      key={clue.id || idx}
                      className="p-4 rounded-lg bg-neutral-950 border border-neutral-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-cyan-300">{clue.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-900 text-neutral-400 uppercase">
                          {clue.type}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block mb-0.5">Plaintext Solution:</span>
                        <span className="text-emerald-300 font-mono font-medium bg-emerald-950/30 px-2 py-1 rounded block">
                          {clue.plaintextAnswer}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block mb-0.5">Encoded String (Player Facing):</span>
                        <span className="text-neutral-400 font-mono break-all text-[11px]">
                          {clue.encodedContent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                  Objective Evaluation Rules:
                </h3>
                <pre className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-cyan-300 text-xs overflow-x-auto">
                  {JSON.stringify(selectedChallenge.objectiveConfig, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LIVE TEAM RUNS */}
      {activeTab === "runs" && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px]">
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
              <tbody className="divide-y divide-neutral-800/60 font-mono">
                {runs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-neutral-500 italic">
                      No active runs recorded.
                    </td>
                  </tr>
                ) : (
                  runs.map((run) => (
                    <tr key={run.id} className="hover:bg-neutral-800/40">
                      <td className="py-3 px-4 text-neutral-500 text-[10px]">
                        {run.id.slice(0, 8)}...
                      </td>
                      <td className="py-3 px-4 font-bold text-white">
                        {run.team.name}
                      </td>
                      <td className="py-3 px-4 text-neutral-300">
                        {run.challenge.title}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            run.status === "COMPLETED"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : run.status === "IN_PROGRESS"
                              ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                              : "bg-neutral-800 text-neutral-400"
                          }`}
                        >
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">
                        {formatDuration(run.durationMs)}
                      </td>
                      <td className="py-3 px-4 text-cyan-300">{run.commandCount}</td>
                      <td className="py-3 px-4 text-neutral-400 text-[11px] truncate max-w-xs">
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
        <form onSubmit={handleCreateChallenge} className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl space-y-4 text-xs">
          <div className="border-b border-neutral-800 pb-3">
            <h2 className="text-base font-bold text-white">Author Custom Challenge</h2>
            <p className="text-neutral-400 text-xs">
              Configure command mappings, encoded clues, virtual filesystem seeds, and objective rules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-neutral-400 block mb-1">Unique Slug:</label>
              <input
                type="text"
                required
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g. quantum-divergence"
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <div>
              <label className="text-neutral-400 block mb-1">Difficulty:</label>
              <select
                value={newDiff}
                onChange={(e) => setNewDiff(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white outline-none focus:border-cyan-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Challenge Title:</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Operation Quantum Divergence (Level 4)"
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div>
            <label className="text-neutral-400 block mb-1">Description / Briefing:</label>
            <textarea
              required
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Briefing instructions for competitors..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-white outline-none focus:border-cyan-500 font-mono"
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-cyan-400 font-semibold block mb-1">Clues (JSON Array with plaintext & encoded):</label>
              <textarea
                required
                rows={5}
                value={newCluesJson}
                onChange={(e) => setNewCluesJson(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-cyan-400 font-semibold block mb-1">Objective Evaluation Rules (JSON):</label>
              <textarea
                required
                rows={5}
                value={newObjJson}
                onChange={(e) => setNewObjJson(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-cyan-300 font-mono text-[11px] outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingChallenge}
            className="px-6 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition-colors disabled:opacity-50"
          >
            {savingChallenge ? "Saving Challenge..." : "Publish New Challenge"}
          </button>
        </form>
      )}
    </main>
  );
}
