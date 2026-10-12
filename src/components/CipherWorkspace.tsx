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
import { FilesystemTree, FilesystemTreeItem } from "./FilesystemTree";
import {
  Copy,
  Check,
  KeyRound,
  BookOpen,
  CheckCircle2,
  Circle,
  PenLine,
  Trash2,
  FolderTree,
} from "lucide-react";

interface Clue {
  id: string;
  title: string;
  type: CipherType;
  encodedContent: string;
  hintNote?: string;
}

interface CipherWorkspaceProps {
  clues: Clue[];
  unlockedHints?: Array<{ id: string; title: string; content: string; penaltySeconds: number }>;
  runId?: string;
  treeList?: FilesystemTreeItem[];
  currentWorkingDir?: string;
  onRefreshVfs?: () => void;
  initialTab?: "clues" | "tree" | "reference" | "scratchpad";
}

export function CipherWorkspace({
  clues,
  runId = "default-run",
  treeList = [],
  currentWorkingDir = "/workspace",
  onRefreshVfs,
  initialTab = "clues",
}: CipherWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"clues" | "tree" | "reference" | "scratchpad">(initialTab);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Client-Side Investigation State (persisted per run)
  const [investigatedClues, setInvestigatedClues] = useState<Record<string, boolean>>({});
  const [refCategory, setRefCategory] = useState<"morse" | "hex" | "rot13" | "base64" | "url">("morse");
  const [scratchpadText, setScratchpadText] = useState("");

  // Load persisted investigated status & notes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedInvestigated = localStorage.getItem(`shellshift_inv_${runId}`);
      if (savedInvestigated) setInvestigatedClues(JSON.parse(savedInvestigated));
      const savedNotes = localStorage.getItem(`shellshift_notes_${runId}`);
      if (savedNotes) setScratchpadText(savedNotes);
    } catch (e) {
      console.warn("Could not load stored workspace state:", e);
    }
  }, [runId]);

  const handleNotesChange = (text: string) => {
    setScratchpadText(text);
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

  return (
    <div className="flex flex-col h-full bg-[#121215] border border-[#27272a] rounded-lg overflow-hidden font-mono text-xs shadow-2xl">
      {/* Workspace Tab Header */}
      <div className="bg-[#18181b] border-b border-[#27272a] px-2.5 py-1.5 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("clues")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "clues"
                ? "bg-[#121215] text-cyan-400 font-bold border border-[#27272a]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
            Clues ({clues.length})
          </button>

          <button
            onClick={() => setActiveTab("tree")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "tree"
                ? "bg-[#121215] text-cyan-400 font-bold border border-[#27272a]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            Filesystem
          </button>

          <button
            onClick={() => setActiveTab("reference")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "reference"
                ? "bg-[#121215] text-cyan-400 font-bold border border-[#27272a]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            Reference
          </button>

          <button
            onClick={() => setActiveTab("scratchpad")}
            className={`px-2.5 py-1.5 rounded transition-colors flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${
              activeTab === "scratchpad"
                ? "bg-[#121215] text-cyan-400 font-bold border border-[#27272a]"
                : "text-[#a1a1aa] hover:text-white"
            }`}
          >
            <PenLine className="w-3.5 h-3.5 text-cyan-400" />
            Scratchpad
          </button>
        </div>

        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold hidden sm:inline pl-2">
          Investigation
        </span>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* TAB 1: CIPHER CLUES */}
        {activeTab === "clues" && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-xs">ENCODED CIPHER CLUES</span>
                <p className="text-[10px] text-[#a1a1aa]">
                  Inspect clues to deduce command transpositions. Automated decoders are disabled.
                </p>
              </div>
              <span className="text-cyan-400 font-bold text-[11px] bg-cyan-950/40 border border-cyan-800/60 px-2 py-0.5 rounded">
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
                  className={`p-3 rounded-lg bg-[#18181b] border transition-colors space-y-2.5 ${
                    isInvestigated
                      ? "border-emerald-800/40 bg-emerald-950/10"
                      : "border-[#27272a] hover:border-[#3f3f46]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-[#121215] border border-[#27272a] flex items-center justify-center text-cyan-400 text-[10px] font-bold shrink-0">
                        #{idx + 1}
                      </span>
                      <span className="text-white font-semibold text-xs truncate">
                        {clue.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-[#121215] text-[#a1a1aa] border border-[#27272a]">
                        {meta.name}
                      </span>
                      <button
                        onClick={() => toggleInvestigated(clue.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-colors ${
                          isInvestigated
                            ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                            : "bg-[#121215] text-[#a1a1aa] border-[#27272a] hover:text-white"
                        }`}
                        title="Mark as investigated"
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
                    <pre className="p-2.5 rounded bg-[#09090b] border border-[#27272a] text-cyan-300 whitespace-pre-wrap break-all text-[11px] select-all max-h-40 overflow-y-auto font-mono">
                      {clue.encodedContent}
                    </pre>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(clue.encodedContent, clue.id)}
                        className="px-2.5 py-1 rounded bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] transition-colors flex items-center gap-1 text-[10px] font-medium"
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
                            <span>Copy Clue</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: VIRTUAL FILESYSTEM EXPLORER */}
        {activeTab === "tree" && (
          <div className="h-full flex flex-col space-y-2">
            <div className="pb-1.5 border-b border-[#27272a] flex items-center justify-between shrink-0">
              <div>
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
                  Virtual Filesystem Explorer
                </span>
                <p className="text-[10px] text-[#a1a1aa]">
                  Read-only live tree of the isolated virtual filesystem sandbox.
                </p>
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <FilesystemTree
                treeList={treeList}
                currentWorkingDir={currentWorkingDir}
                onRefresh={onRefreshVfs}
              />
            </div>
          </div>
        )}

        {/* TAB 3: STATIC CIPHER REFERENCE HANDBOOK */}
        {activeTab === "reference" && (
          <div className="space-y-3">
            <div className="pb-2 border-b border-[#27272a] flex items-center justify-between">
              <div>
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  Cipher Reference Tables
                </span>
                <p className="text-[10px] text-[#a1a1aa]">
                  Static manual reference guides to aid deciphering.
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
                      ? "bg-[#18181b] text-cyan-300 border-[#27272a] font-bold"
                      : "bg-[#121215] text-[#a1a1aa] border-[#27272a] hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Sub-view: Morse Code */}
            {refCategory === "morse" && (
              <div className="space-y-2.5 bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
                <div className="text-[11px] font-bold text-cyan-300">
                  International Morse Alphabet & Digits
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                  {MORSE_ALPHABET.map((item) => (
                    <div
                      key={item.char}
                      className="p-1.5 rounded bg-[#121215] border border-[#27272a] text-center"
                    >
                      <div className="text-white font-bold text-[11px]">{item.char}</div>
                      <div className="text-cyan-400 font-mono text-[10px] font-bold">{item.morse}</div>
                    </div>
                  ))}
                </div>
                <div className="pt-1.5 border-t border-[#27272a]">
                  <div className="text-[10px] text-[#a1a1aa] font-semibold mb-1">Digits:</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {MORSE_DIGITS.map((item) => (
                      <div
                        key={item.char}
                        className="p-1.5 rounded bg-[#121215] border border-[#27272a] text-center"
                      >
                        <div className="text-white font-bold text-[11px]">{item.char}</div>
                        <div className="text-cyan-400 font-mono text-[10px] font-bold">{item.morse}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Hex & ASCII */}
            {refCategory === "hex" && (
              <div className="space-y-2.5 bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
                <div className="text-[11px] font-bold text-cyan-300">
                  ASCII Character Hexadecimal & Binary Codes
                </div>
                <div className="space-y-1">
                  {ASCII_HEX_SAMPLES.map((sample) => (
                    <div
                      key={sample.char}
                      className="p-2 rounded bg-[#121215] border border-[#27272a] flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white font-semibold">{sample.char}</span>
                      <div className="flex items-center gap-3 text-[#a1a1aa] text-[11px]">
                        <span>Hex: <strong className="text-cyan-300">{sample.hex}</strong></span>
                        <span>Dec: <strong className="text-amber-300">{sample.dec}</strong></span>
                        <span>Bin: <strong className="text-emerald-300">{sample.bin}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view: ROT13 */}
            {refCategory === "rot13" && (
              <div className="space-y-2.5 bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
                <div className="text-[11px] font-bold text-cyan-300">
                  ROT13 Alphabet Transposition Pairs
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {ROT13_PAIRS.map(([left, right]) => (
                    <div
                      key={left}
                      className="p-2 rounded bg-[#121215] border border-[#27272a] flex items-center justify-center gap-2 font-bold"
                    >
                      <span className="text-white">{left}</span>
                      <span className="text-neutral-500">↔</span>
                      <span className="text-emerald-400">{right}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view: Base64 */}
            {refCategory === "base64" && (
              <div className="space-y-2.5 bg-[#18181b] p-3 rounded-lg border border-[#27272a] text-xs">
                <div className="text-[11px] font-bold text-cyan-300">
                  Base64 Radix Encoding Principles
                </div>
                <div className="p-3 rounded bg-[#121215] border border-[#27272a] space-y-2 text-neutral-300">
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
              <div className="space-y-2.5 bg-[#18181b] p-3 rounded-lg border border-[#27272a]">
                <div className="text-[11px] font-bold text-cyan-300">
                  Common URL Percent-Encoded Characters
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {URL_ENCODING_COMMON.map((item) => (
                    <div
                      key={item.char}
                      className="p-2 rounded bg-[#121215] border border-[#27272a] flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-white">{item.char}</span>
                      <span className="text-cyan-300 font-bold">{item.encoded}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INVESTIGATION SCRATCHPAD */}
        {activeTab === "scratchpad" && (
          <div className="space-y-3 h-full flex flex-col">
            <div className="pb-2 border-b border-[#27272a] flex items-center justify-between shrink-0">
              <div>
                <span className="text-white font-bold text-xs flex items-center gap-1.5">
                  <PenLine className="w-3.5 h-3.5 text-cyan-400" />
                  Investigation Scratchpad & Notes
                </span>
                <p className="text-[10px] text-[#a1a1aa]">
                  Notes are automatically saved locally for this run.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(scratchpadText, "notes")}
                  className="px-2 py-1 rounded bg-[#18181b] hover:bg-[#27272a] text-[#fafafa] border border-[#27272a] text-[10px] flex items-center gap-1 transition-colors"
                >
                  {copiedId === "notes" ? (
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
                  type="button"
                  onClick={() => handleNotesChange("")}
                  className="px-2 py-1 rounded bg-[#18181b] hover:bg-[#27272a] text-neutral-400 hover:text-rose-400 border border-[#27272a] text-[10px] flex items-center gap-1 transition-colors"
                  title="Clear scratchpad"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[260px] flex flex-col">
              <textarea
                value={scratchpadText}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder={"Jot down clues, deciphering steps, and mapped operations here...\n\nExample:\n- Clue 1: cd -> mkdir\n- Clue 2: cat -> touch\n- Working path: /workspace/project"}
                className="w-full flex-1 min-h-[260px] p-3 rounded-lg bg-[#09090b] border border-[#27272a] text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-500 leading-relaxed placeholder-neutral-600 resize-none shadow-inner"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
