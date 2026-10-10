"use client";

import React, { useState, useEffect } from "react";
import { CIPHER_METADATA, CipherType } from "@/lib/ciphers/ciphers";
import {
  MORSE_ALPHABET,
  MORSE_DIGITS,
  ROT13_PAIRS,
  ASCII_HEX_SAMPLES,
  URL_ENCODING_COMMON,
  BASE64_ALPHABET_SUMMARY,
} from "@/lib/ciphers/referenceData";
import {
  Copy,
  Check,
  FolderTree,
  KeyRound,
  Folder,
  File,
  HelpCircle,
  FileText,
  BookOpen,
  ArrowRight,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
} from "lucide-react";

interface Clue {
  id: string;
  title: string;
  type: CipherType;
  encodedContent: string;
  hintNote: string;
}

interface TreeItem {
  path: string;
  name: string;
  type: "file" | "dir";
  size?: number;
}

interface SuspectedMapping {
  id: string;
  command: string;
  suspectedAction: string;
  tested: boolean;
}

interface CipherWorkspaceProps {
  clues: Clue[];
  treeList: TreeItem[];
  unlockedHints?: Array<{ id: string; title: string; content: string; penaltySeconds: number }>;
  runId?: string;
}

export function CipherWorkspace({
  clues,
  treeList,
  unlockedHints = [],
  runId = "default-run",
}: CipherWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"clues" | "scratchpad" | "reference" | "tree">("clues");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Client-Side Investigation State (scoped to runId in localStorage)
  const [investigatedClues, setInvestigatedClues] = useState<Record<string, boolean>>({});
  const [scratchNotes, setScratchNotes] = useState<string>("");
  const [suspectedMappings, setSuspectedMappings] = useState<SuspectedMapping[]>([]);
  const [newCmd, setNewCmd] = useState("");
  const [newAction, setNewAction] = useState("");
  const [refCategory, setRefCategory] = useState<"morse" | "hex" | "rot13" | "base64" | "url">("morse");

  // Load persisted notes and state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedNotes = localStorage.getItem(`shellshift_notes_${runId}`);
      if (savedNotes !== null) setScratchNotes(savedNotes);

      const savedInvestigated = localStorage.getItem(`shellshift_inv_${runId}`);
      if (savedInvestigated) setInvestigatedClues(JSON.parse(savedInvestigated));

      const savedMappings = localStorage.getItem(`shellshift_map_${runId}`);
      if (savedMappings) setSuspectedMappings(JSON.parse(savedMappings));
    } catch (e) {
      console.warn("Could not load stored workspace state:", e);
    }
  }, [runId]);

  // Persist notes changes
  const handleNotesChange = (text: string) => {
    setScratchNotes(text);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`shellshift_notes_${runId}`, text);
      } catch {}
    }
  };

  const toggleInvestigated = (clueId: string) => {
    setInvestigatedClues((prev) => {
      const next = { ...prev, [clueId]: !prev[clueId] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`shellshift_inv_${runId}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddMapping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCmd.trim() || !newAction.trim()) return;
    const item: SuspectedMapping = {
      id: Date.now().toString(),
      command: newCmd.trim().toLowerCase(),
      suspectedAction: newAction.trim(),
      tested: false,
    };
    const updated = [...suspectedMappings, item];
    setSuspectedMappings(updated);
    setNewCmd("");
    setNewAction("");
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`shellshift_map_${runId}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const handleToggleTested = (id: string) => {
    const updated = suspectedMappings.map((m) =>
      m.id === id ? { ...m, tested: !m.tested } : m
    );
    setSuspectedMappings(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`shellshift_map_${runId}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const handleRemoveMapping = (id: string) => {
    const updated = suspectedMappings.filter((m) => m.id !== id);
    setSuspectedMappings(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`shellshift_map_${runId}`, JSON.stringify(updated));
      } catch {}
    }
  };

  const handleSendClueToNotes = (clue: Clue, idx: number) => {
    const header = `\n--- Clue #${idx + 1}: ${clue.title} (${clue.type.toUpperCase()}) ---\nEncoded: ${clue.encodedContent}\nNotes: `;
    const updatedNotes = scratchNotes ? `${scratchNotes}\n${header}` : header.trim();
    handleNotesChange(updatedNotes);
    setActiveTab("scratchpad");
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs shadow-xl">
      {/* Workspace Tab Header */}
      <div className="bg-[#121215] border-b border-neutral-800 px-2.5 py-1.5 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("clues")}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "clues"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            Clues ({clues.length})
          </button>

          <button
            onClick={() => setActiveTab("scratchpad")}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "scratchpad"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            Scratchpad & Notes
            {suspectedMappings.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[10px] flex items-center justify-center font-bold">
                {suspectedMappings.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("reference")}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "reference"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Reference
          </button>

          <button
            onClick={() => setActiveTab("tree")}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "tree"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
            VFS Tree
          </button>
        </div>

        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold hidden sm:inline pl-2">
          Investigation
        </span>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* TAB 1: CIPHER CLUES (MANUAL DECODING) */}
        {activeTab === "clues" && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-xs">ENCODED CHALLENGE CLUES</span>
                <p className="text-[10px] text-neutral-400">
                  Decode manually to deduce how terminal commands are transposed.
                </p>
              </div>
              <span className="text-cyan-400 font-bold text-[11px] bg-cyan-950/50 border border-cyan-800/60 px-2 py-0.5 rounded">
                {clues.length} clue blocks
              </span>
            </div>

            {clues.map((clue, idx) => {
              const meta = CIPHER_METADATA[clue.type] || {
                name: clue.type,
                category: "Encoding",
                description: "",
              };
              const isInvestigated = !!investigatedClues[clue.id];

              return (
                <div
                  key={clue.id}
                  className={`p-3 rounded-lg bg-[#121215] border transition-colors space-y-2.5 ${
                    isInvestigated
                      ? "border-emerald-800/40 bg-emerald-950/10"
                      : "border-neutral-800 hover:border-neutral-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-cyan-400 text-[10px] font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-white font-semibold text-xs truncate">
                        {clue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-300 border border-neutral-800">
                        {meta.name}
                      </span>
                      <button
                        onClick={() => toggleInvestigated(clue.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                          isInvestigated
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                        }`}
                        title="Mark as investigated for your team"
                      >
                        {isInvestigated ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Investigated
                          </>
                        ) : (
                          <>
                            <Circle className="w-3 h-3" />
                            Unresolved
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Encoded Content Display */}
                  <div className="relative group">
                    <pre className="p-2.5 rounded bg-[#09090b] border border-neutral-800/80 text-cyan-300 whitespace-pre-wrap break-all text-[11px] select-all max-h-36 overflow-y-auto font-mono">
                      {clue.encodedContent}
                    </pre>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(clue.encodedContent, clue.id)}
                        className="px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 transition-colors flex items-center gap-1 text-[10px] font-medium"
                        title="Copy Encoded String"
                      >
                        {copiedId === clue.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleSendClueToNotes(clue, idx)}
                        className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors flex items-center gap-1 text-[10px]"
                        title="Send to Scratchpad"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        <span>Notes</span>
                      </button>
                    </div>
                  </div>

                  {/* Author Note / Hint */}
                  <div className="text-[10px] text-neutral-400 flex items-start gap-1.5 pt-0.5">
                    <span className="text-neutral-500 font-semibold shrink-0">Context:</span>
                    <span className="text-neutral-300">{clue.hintNote}</span>
                  </div>
                </div>
              );
            })}

            {unlockedHints.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Unlocked Clue Hints
                </div>
                {unlockedHints.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded bg-amber-950/20 border border-amber-800/50 text-neutral-300 space-y-1 mb-2"
                  >
                    <div className="font-bold text-amber-300 text-[11px]">{h.title}</div>
                    <div className="text-[11px] text-neutral-300">{h.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL INVESTIGATION SCRATCHPAD & HYPOTHESIS MAPPING */}
        {activeTab === "scratchpad" && (
          <div className="space-y-4">
            {/* Suspected Command Mappings Builder */}
            <div className="p-3 rounded-lg bg-[#121215] border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white font-bold text-xs flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    Suspected Command Mappings
                  </span>
                  <p className="text-[10px] text-neutral-400">
                    Record your hypotheses of how Linux commands behave in this level.
                  </p>
                </div>
                <span className="text-[10px] text-neutral-500">
                  {suspectedMappings.length} recorded
                </span>
              </div>

              {/* Add suspected mapping form */}
              <form onSubmit={handleAddMapping} className="flex gap-1.5 items-center pt-1">
                <input
                  type="text"
                  placeholder="Typed cmd (e.g. cd)"
                  value={newCmd}
                  onChange={(e) => setNewCmd(e.target.value)}
                  className="w-1/3 bg-[#09090b] border border-neutral-800 text-cyan-300 px-2.5 py-1.5 rounded outline-none focus:border-cyan-500 text-xs font-mono"
                />
                <span className="text-neutral-500 font-bold">→</span>
                <input
                  type="text"
                  placeholder="Suspected action (e.g. mkdir)"
                  value={newAction}
                  onChange={(e) => setNewAction(e.target.value)}
                  className="flex-1 bg-[#09090b] border border-neutral-800 text-emerald-300 px-2.5 py-1.5 rounded outline-none focus:border-cyan-500 text-xs font-mono"
                />
                <button
                  type="submit"
                  className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded text-xs font-medium flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5 text-cyan-400" />
                  Add
                </button>
              </form>

              {/* Suspected mapping list */}
              {suspectedMappings.length > 0 ? (
                <div className="space-y-1.5 pt-1 max-h-40 overflow-y-auto">
                  {suspectedMappings.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded bg-[#09090b] border border-neutral-800/80 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-cyan-300 font-bold">&quot;{m.command}&quot;</span>
                        <span className="text-neutral-500">maps to</span>
                        <span className="text-emerald-300 font-bold">&quot;{m.suspectedAction}&quot;</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleTested(m.id)}
                          className={`px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
                            m.tested
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : "bg-neutral-900 text-neutral-500 border-neutral-800 hover:text-neutral-300"
                          }`}
                        >
                          {m.tested ? "Verified ✓" : "Untested"}
                        </button>
                        <button
                          onClick={() => handleRemoveMapping(m.id)}
                          className="text-neutral-500 hover:text-rose-400 p-0.5"
                          title="Remove hypothesis"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-2 text-[10px] text-neutral-500 italic text-center">
                  No mappings recorded yet. Add hypotheses above as you decode clues.
                </div>
              )}
            </div>

            {/* Freeform Notes Scratchpad */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-white font-bold text-xs flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  Manual Decryption Notes & Scratchpad
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    Saved locally
                  </span>
                  {scratchNotes && (
                    <button
                      onClick={() => handleCopy(scratchNotes, "scratch-notes")}
                      className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedId === "scratch-notes" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copy Notes
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={scratchNotes}
                onChange={(e) => handleNotesChange(e.target.value)}
                rows={9}
                placeholder="Write your manual decoding steps, character translations, suspected flag locations, and team hypotheses here..."
                className="w-full bg-[#121215] border border-neutral-800 text-neutral-200 rounded-lg p-3 outline-none focus:border-cyan-500 text-xs font-mono resize-y leading-relaxed"
              />
              <p className="text-[10px] text-neutral-500">
                Notes persist across page refreshes for your current challenge session.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: STATIC CIPHER REFERENCE HANDBOOK */}
        {activeTab === "reference" && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Static Cipher Reference Handbook
                </span>
                <p className="text-[10px] text-neutral-400">
                  Lookup tables for manual deciphering. Use this guide to decode clues independently.
                </p>
              </div>
            </div>

            {/* Reference category selector */}
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
              {[
                { id: "morse", label: "Morse Code" },
                { id: "hex", label: "Hex & ASCII" },
                { id: "rot13", label: "ROT13 / Caesar" },
                { id: "base64", label: "Base64" },
                { id: "url", label: "URL Percent" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setRefCategory(cat.id as any)}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors whitespace-nowrap ${
                    refCategory === cat.id
                      ? "bg-neutral-800 text-cyan-300 border-neutral-700 font-bold"
                      : "bg-[#121215] text-neutral-400 border-neutral-800 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sub-view: Morse Code */}
            {refCategory === "morse" && (
              <div className="space-y-2.5 bg-[#121215] p-3 rounded-lg border border-neutral-800">
                <div className="text-[11px] font-bold text-cyan-300">
                  International Morse Alphabet & Digits
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {MORSE_ALPHABET.map((item) => (
                    <div
                      key={item.char}
                      className="p-1.5 rounded bg-[#09090b] border border-neutral-800 text-center"
                    >
                      <div className="text-white font-bold text-[11px]">{item.char}</div>
                      <div className="text-cyan-400 font-mono text-[10px] font-bold">{item.morse}</div>
                    </div>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-neutral-800">
                  <div className="text-[10px] text-neutral-400 font-semibold mb-1">Digits:</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {MORSE_DIGITS.map((item) => (
                      <div
                        key={item.char}
                        className="p-1.5 rounded bg-[#09090b] border border-neutral-800 text-center"
                      >
                        <div className="text-white font-bold text-[11px]">{item.char}</div>
                        <div className="text-cyan-400 font-mono text-[10px] font-bold">{item.morse}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 pt-1">
                  Convention: Single space separates letters; &quot;/&quot; or triple space separates words.
                </p>
              </div>
            )}

            {/* Sub-view: Hex & ASCII */}
            {refCategory === "hex" && (
              <div className="space-y-2.5 bg-[#121215] p-3 rounded-lg border border-neutral-800">
                <div className="text-[11px] font-bold text-cyan-300">
                  ASCII Character Hexadecimal & Binary Codes
                </div>
                <div className="space-y-1">
                  {ASCII_HEX_SAMPLES.map((sample) => (
                    <div
                      key={sample.char}
                      className="p-2 rounded bg-[#09090b] border border-neutral-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white font-semibold">{sample.char}</span>
                      <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                        <span>Hex: <strong className="text-cyan-300">{sample.hex}</strong></span>
                        <span>Dec: <strong className="text-amber-300">{sample.dec}</strong></span>
                        <span>Bin: <strong className="text-emerald-300">{sample.bin}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-500 pt-1">
                  Tip: Two hex characters equal 1 byte (e.g. 0x63 0x64 = &quot;cd&quot;).
                </p>
              </div>
            )}

            {/* Sub-view: ROT13 / Caesar */}
            {refCategory === "rot13" && (
              <div className="space-y-2.5 bg-[#121215] p-3 rounded-lg border border-neutral-800">
                <div className="text-[11px] font-bold text-cyan-300">
                  ROT13 Alphabet Transposition Pairs
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {ROT13_PAIRS.map(([left, right]) => (
                    <div
                      key={left}
                      className="p-2 rounded bg-[#09090b] border border-neutral-800 flex items-center justify-center gap-2 font-bold"
                    >
                      <span className="text-white">{left}</span>
                      <span className="text-neutral-500">↔</span>
                      <span className="text-emerald-400">{right}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-400 pt-1 leading-relaxed">
                  Formula: Each letter is rotated 13 positions forward in the 26-letter Latin alphabet. Applying ROT13 twice restores the original text.
                </p>
              </div>
            )}

            {/* Sub-view: Base64 */}
            {refCategory === "base64" && (
              <div className="space-y-2.5 bg-[#121215] p-3 rounded-lg border border-neutral-800 text-xs">
                <div className="text-[11px] font-bold text-cyan-300">
                  Base64 Radix Encoding Principles
                </div>
                <div className="p-3 rounded bg-[#09090b] border border-neutral-800 space-y-2 text-neutral-300">
                  <div>
                    <span className="text-neutral-500 block mb-0.5 font-semibold">Alphabet Range:</span>
                    <span className="text-cyan-300 font-mono text-[11px]">
                      {BASE64_ALPHABET_SUMMARY.indices}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5 font-semibold">Padding Rules:</span>
                    <span className="text-neutral-300 text-[11px]">
                      {BASE64_ALPHABET_SUMMARY.padding}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5 font-semibold">Quantum Block Ratio:</span>
                    <span className="text-emerald-300 text-[11px]">
                      {BASE64_ALPHABET_SUMMARY.ratio}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: URL Percent */}
            {refCategory === "url" && (
              <div className="space-y-2.5 bg-[#121215] p-3 rounded-lg border border-neutral-800">
                <div className="text-[11px] font-bold text-cyan-300">
                  Common URL Percent-Encoded Characters
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {URL_ENCODING_COMMON.map((item) => (
                    <div
                      key={item.char}
                      className="p-2 rounded bg-[#09090b] border border-neutral-800 flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white">{item.char}</span>
                      <span className="text-cyan-300 font-bold">{item.encoded}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-neutral-500 pt-1">
                  Format: &quot;%&quot; followed by the two-digit hexadecimal ASCII representation.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: VFS TREE EXPLORER */}
        {activeTab === "tree" && (
          <div className="space-y-2">
            <div className="text-[11px] text-neutral-400 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
              <span className="font-bold text-white">SANDBOX DIRECTORY STRUCTURE</span>
              <span className="text-cyan-400 font-semibold">{treeList.length} nodes</span>
            </div>

            {treeList.length === 0 ? (
              <div className="text-neutral-500 italic py-6 text-center">Root directory is empty.</div>
            ) : (
              <div className="space-y-0.5 bg-[#121215] p-3 rounded-lg border border-neutral-800 max-h-[480px] overflow-y-auto">
                {treeList.map((item) => {
                  const depth = (item.path.match(/\//g) || []).length;
                  const indent = (depth - 1) * 14;

                  return (
                    <div
                      key={item.path}
                      style={{ paddingLeft: `${indent}px` }}
                      className="flex items-center gap-1.5 text-neutral-300 py-1 hover:text-cyan-300 transition-colors"
                    >
                      {item.type === "dir" ? (
                        <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <File className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      )}
                      <span className={item.type === "dir" ? "font-bold text-cyan-200" : ""}>
                        {item.name}
                        {item.type === "dir" ? "/" : ""}
                      </span>
                      {item.size !== undefined && (
                        <span className="text-[10px] text-neutral-500 ml-auto">
                          {item.size} B
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
