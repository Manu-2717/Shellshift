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
import { FilesystemTree, FilesystemTreeItem } from "@/components/FilesystemTree";
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

interface ContextPanelProps {
  clues: Clue[];
  treeList?: FilesystemTreeItem[];
  currentWorkingDir?: string;
  runId: string;
  onRefreshVfs?: () => void;
  activeTab?: "clues" | "tree" | "reference" | "scratchpad";
  onTabChange?: (tab: "clues" | "tree" | "reference" | "scratchpad") => void;
}

export function ContextPanel({
  clues = [],
  treeList = [],
  currentWorkingDir = "/workspace",
  runId,
  onRefreshVfs,
  activeTab: controlledTab,
  onTabChange,
}: ContextPanelProps) {
  const [internalTab, setInternalTab] = useState<"clues" | "tree" | "reference" | "scratchpad">("clues");
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [investigatedClues, setInvestigatedClues] = useState<Record<string, boolean>>({});
  const [refCategory, setRefCategory] = useState<"morse" | "hex" | "rot13" | "base64" | "url">("morse");
  const [scratchpadText, setScratchpadText] = useState("");

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
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-800 bg-[#0e1016] font-mono text-xs shadow-2xl">
      {/* Header Tabs */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-[#07080b] px-3 py-2 select-none">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setTab("clues")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              tab === "clues"
                ? "border border-zinc-700 bg-[#161922] text-cyan-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <KeyRound className="size-3.5 text-cyan-400" />
            <span>Clues ({clues.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("tree")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              tab === "tree"
                ? "border border-zinc-700 bg-[#161922] text-cyan-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <FolderTree className="size-3.5 text-cyan-400" />
            <span>Filesystem</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("reference")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              tab === "reference"
                ? "border border-zinc-700 bg-[#161922] text-cyan-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <BookOpen className="size-3.5 text-cyan-400" />
            <span>Reference</span>
          </button>

          <button
            type="button"
            onClick={() => setTab("scratchpad")}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              tab === "scratchpad"
                ? "border border-zinc-700 bg-[#161922] text-cyan-300"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <PenLine className="size-3.5 text-cyan-400" />
            <span>Scratchpad</span>
          </button>
        </div>

        <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-zinc-500 sm:inline">
          Context
        </span>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* CLUES */}
        {tab === "clues" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <span className="text-xs font-bold text-white">ENCODED CIPHER CLUES</span>
                <p className="text-[10px] text-zinc-400">
                  Inspect to discover remapped commands. Decoders are disabled.
                </p>
              </div>
              <span className="rounded border border-cyan-800/60 bg-cyan-950/40 px-2 py-0.5 text-[11px] font-bold text-cyan-300">
                {clues.length} clues
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
                  className={`space-y-2 rounded-xl border p-3 transition ${
                    isInvestigated
                      ? "border-emerald-800/40 bg-emerald-950/10"
                      : "border-zinc-800 bg-[#07080b] hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-[10px] font-bold text-cyan-400">
                        #{idx + 1}
                      </span>
                      <span className="truncate text-xs font-semibold text-white">
                        {clue.title}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-2 py-0.5 text-[10px] text-zinc-400">
                        {meta.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleInvestigated(clue.id)}
                        className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium transition cursor-pointer ${
                          isInvestigated
                            ? "border-emerald-800 bg-emerald-950 text-emerald-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {isInvestigated ? (
                          <>
                            <CheckCircle2 className="size-3 text-emerald-400" />
                            <span>Solved</span>
                          </>
                        ) : (
                          <>
                            <Circle className="size-3" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="relative group">
                    <pre className="max-h-36 overflow-y-auto rounded-lg border border-zinc-800 bg-black/60 p-2.5 font-mono text-[11px] whitespace-pre-wrap break-all select-all text-cyan-300">
                      {clue.encodedContent}
                    </pre>

                    <button
                      type="button"
                      onClick={() => handleCopy(clue.encodedContent, clue.id)}
                      className="absolute top-2 right-2 flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[10px] font-medium text-zinc-200 transition hover:bg-zinc-700 cursor-pointer"
                    >
                      {copiedId === clue.id ? (
                        <>
                          <Check className="size-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="size-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FILESYSTEM TREE */}
        {tab === "tree" && (
          <div className="flex h-full flex-col space-y-2">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 pb-1.5">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <FolderTree className="size-3.5 text-cyan-400" />
                  Filesystem Explorer
                </span>
                <p className="text-[10px] text-zinc-400">
                  Read-only view of the isolated virtual filesystem sandbox.
                </p>
              </div>
            </div>

            <div className="min-h-[300px] flex-1">
              <FilesystemTree
                treeList={treeList}
                currentWorkingDir={currentWorkingDir}
                onRefresh={onRefreshVfs}
              />
            </div>
          </div>
        )}

        {/* REFERENCE */}
        {tab === "reference" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <BookOpen className="size-3.5 text-cyan-400" />
                  Static Cipher Reference
                </span>
                <p className="text-[10px] text-zinc-400">
                  Lookup tables to aid manual deciphering.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "morse", label: "Morse" },
                { id: "hex", label: "Hex & ASCII" },
                { id: "rot13", label: "ROT13" },
                { id: "base64", label: "Base64" },
                { id: "url", label: "URL Percent" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setRefCategory(cat.id as any)}
                  className={`rounded border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                    refCategory === cat.id
                      ? "border-zinc-700 bg-zinc-800 font-bold text-cyan-300"
                      : "border-zinc-800 bg-[#07080b] text-zinc-400 hover:text-white"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {refCategory === "morse" && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-[#07080b] p-3">
                <div className="text-[11px] font-bold text-cyan-300">Morse Alphabet</div>
                <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
                  {MORSE_ALPHABET.map((item) => (
                    <div key={item.char} className="rounded border border-zinc-800 bg-black/60 p-1.5 text-center">
                      <div className="text-[11px] font-bold text-white">{item.char}</div>
                      <div className="font-mono text-[10px] font-bold text-cyan-400">{item.morse}</div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-zinc-800">
                  <div className="text-[10px] text-zinc-400 mb-1 font-semibold">Digits:</div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {MORSE_DIGITS.map((item) => (
                      <div key={item.char} className="rounded border border-zinc-800 bg-black/60 p-1.5 text-center">
                        <div className="text-[11px] font-bold text-white">{item.char}</div>
                        <div className="font-mono text-[10px] font-bold text-cyan-400">{item.morse}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {refCategory === "hex" && (
              <div className="space-y-1 rounded-xl border border-zinc-800 bg-[#07080b] p-3">
                <div className="text-[11px] font-bold text-cyan-300 pb-1">ASCII Hex & Decimal</div>
                {ASCII_HEX_SAMPLES.map((s) => (
                  <div key={s.char} className="flex items-center justify-between rounded border border-zinc-800 bg-black/60 p-2 text-xs font-mono">
                    <span className="font-semibold text-white">{s.char}</span>
                    <div className="flex items-center gap-3 text-[11px] text-zinc-400">
                      <span>Hex: <strong className="text-cyan-300">{s.hex}</strong></span>
                      <span>Dec: <strong className="text-amber-300">{s.dec}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {refCategory === "rot13" && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-[#07080b] p-3">
                <div className="text-[11px] font-bold text-cyan-300">ROT13 Pairs</div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {ROT13_PAIRS.map(([l, r]) => (
                    <div key={l} className="flex items-center justify-center gap-2 rounded border border-zinc-800 bg-black/60 p-2 font-bold">
                      <span className="text-white">{l}</span>
                      <span className="text-zinc-500">↔</span>
                      <span className="text-emerald-400">{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {refCategory === "base64" && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-[#07080b] p-3 text-xs">
                <div className="text-[11px] font-bold text-cyan-300">Base64 Radix</div>
                <div className="space-y-2 text-zinc-300">
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-semibold">Alphabet:</span>
                    <span className="font-mono text-[11px] text-cyan-300">{BASE64_ALPHABET_SUMMARY.indices}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-zinc-500 uppercase font-semibold">Padding:</span>
                    <span className="text-[11px] text-zinc-300">{BASE64_ALPHABET_SUMMARY.padding}</span>
                  </div>
                </div>
              </div>
            )}

            {refCategory === "url" && (
              <div className="space-y-2 rounded-xl border border-zinc-800 bg-[#07080b] p-3">
                <div className="text-[11px] font-bold text-cyan-300">URL Percent Encoding</div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                  {URL_ENCODING_COMMON.map((u) => (
                    <div key={u.char} className="flex items-center justify-between rounded border border-zinc-800 bg-black/60 p-2 text-xs font-mono">
                      <span className="text-white">{u.char}</span>
                      <span className="font-bold text-cyan-300">{u.encoded}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SCRATCHPAD */}
        {tab === "scratchpad" && (
          <div className="flex h-full flex-col space-y-2">
            <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <PenLine className="size-3.5 text-cyan-400" />
                  Scratchpad
                </span>
                <p className="text-[10px] text-zinc-400">Notes auto-saved locally for this challenge.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(scratchpadText, "notes")}
                  className="flex items-center gap-1 rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-[10px] text-zinc-300 hover:bg-zinc-700 cursor-pointer"
                >
                  {copiedId === "notes" ? (
                    <>
                      <Check className="size-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleNotesChange("")}
                  className="flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[10px] text-zinc-400 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            <textarea
              value={scratchpadText}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder={"Jot down clues, deciphering steps, and mapped commands...\n\nExample:\n- cd -> mkdir\n- cat -> touch"}
              className="min-h-[260px] flex-1 resize-none rounded-xl border border-zinc-800 bg-[#07080b] p-3 font-mono text-xs leading-relaxed text-cyan-300 placeholder-zinc-600 focus:border-cyan-500 focus:outline-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
