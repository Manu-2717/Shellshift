"use client";

import React, { useState } from "react";
import {
  CIPHER_METADATA,
  CipherType,
  decodeCipher,
} from "@/lib/ciphers/ciphers";
import {
  Copy,
  Check,
  Code2,
  FolderTree,
  ListChecks,
  KeyRound,
  Folder,
  File,
  Sparkles,
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

interface ObjectiveDetail {
  description: string;
  passed: boolean;
}

interface CipherWorkspaceProps {
  clues: Clue[];
  treeList: TreeItem[];
  objectiveDetails?: ObjectiveDetail[];
  unlockedHints?: Array<{ id: string; title: string; content: string; penaltySeconds: number }>;
}

export function CipherWorkspace({
  clues,
  treeList,
  objectiveDetails = [],
  unlockedHints = [],
}: CipherWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"clues" | "decoder" | "tree" | "objectives">("clues");

  // Decoder State
  const [decoderInput, setDecoderInput] = useState("");
  const [selectedCipher, setSelectedCipher] = useState<CipherType>("base64");
  const [caesarShift, setCaesarShift] = useState(13);
  const [decodedOutput, setDecodedOutput] = useState("");
  const [copiedClueId, setCopiedClueId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedClueId(id);
    setTimeout(() => setCopiedClueId(null), 2000);
  };

  const handleSendToDecoder = (clue: Clue) => {
    setDecoderInput(clue.encodedContent);
    setSelectedCipher(clue.type);
    const result = decodeCipher(clue.type, clue.encodedContent, caesarShift);
    setDecodedOutput(result);
    setActiveTab("decoder");
  };

  const handleRunDecoder = () => {
    if (!decoderInput.trim()) {
      setDecodedOutput("");
      return;
    }
    const result = decodeCipher(selectedCipher, decoderInput, caesarShift);
    setDecodedOutput(result);
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs shadow-2xl">
      {/* Tab Navigation */}
      <div className="bg-neutral-900 border-b border-neutral-800 px-3 py-2 flex items-center gap-1 overflow-x-auto select-none">
        <button
          onClick={() => setActiveTab("clues")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "clues"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          Cipher Clues ({clues.length})
        </button>

        <button
          onClick={() => setActiveTab("decoder")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "decoder"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          Decoder Scratchpad
        </button>

        <button
          onClick={() => setActiveTab("tree")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "tree"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
          }`}
        >
          <FolderTree className="w-3.5 h-3.5" />
          VFS Tree
        </button>

        <button
          onClick={() => setActiveTab("objectives")}
          className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
            activeTab === "objectives"
              ? "bg-neutral-800 text-cyan-400 border border-neutral-700 shadow-sm"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
          }`}
        >
          <ListChecks className="w-3.5 h-3.5" />
          Objectives
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 p-4 overflow-y-auto">
        {/* CLUES TAB */}
        {activeTab === "clues" && (
          <div className="space-y-4">
            <div className="text-[11px] text-neutral-400 pb-1 border-b border-neutral-800 flex items-center justify-between">
              <span>DECODE THESE TRANSMISSIONS TO DISCOVER COMMAND REMAPPINGS</span>
              <span className="text-cyan-400 font-semibold">{clues.length} clue blocks</span>
            </div>

            {clues.map((clue, idx) => {
              const meta = CIPHER_METADATA[clue.type] || {
                name: clue.type,
                category: "Encoding",
                description: "",
              };

              return (
                <div
                  key={clue.id}
                  className="p-3 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-neutral-200 font-medium">{clue.title}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {meta.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950/70 text-cyan-300 border border-cyan-900/50">
                        {meta.category}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-cyan-300 whitespace-pre-wrap break-all text-[11px] select-all max-h-36 overflow-y-auto">
                      {clue.encodedContent}
                    </pre>

                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(clue.encodedContent, clue.id)}
                        className="p-1 rounded bg-neutral-900/90 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-700 transition-colors"
                        title="Copy Encoded String"
                      >
                        {copiedClueId === clue.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSendToDecoder(clue)}
                        className="px-2 py-1 rounded bg-cyan-950/90 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition-colors text-[10px] flex items-center gap-1"
                        title="Decode in Scratchpad"
                      >
                        <Sparkles className="w-3 h-3" />
                        Decode
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <span className="text-neutral-500">Note:</span>
                    <span>{clue.hintNote}</span>
                  </div>
                </div>
              );
            })}

            {unlockedHints.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5" />
                  Unlocked Hints
                </div>
                {unlockedHints.map((h) => (
                  <div
                    key={h.id}
                    className="p-2.5 rounded bg-amber-950/20 border border-amber-800/40 text-neutral-300 space-y-1 mb-2"
                  >
                    <div className="font-semibold text-amber-300 text-[11px]">{h.title}</div>
                    <div className="text-[11px] text-neutral-300">{h.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* DECODER SCRATCHPAD TAB */}
        {activeTab === "decoder" && (
          <div className="space-y-3">
            <div>
              <label className="text-neutral-400 text-[11px] block mb-1">Select Format / Cipher:</label>
              <select
                value={selectedCipher}
                onChange={(e) => setSelectedCipher(e.target.value as CipherType)}
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 text-xs"
              >
                {Object.entries(CIPHER_METADATA).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.name} ({meta.category})
                  </option>
                ))}
              </select>
            </div>

            {selectedCipher === "caesar" && (
              <div className="flex items-center gap-2">
                <label className="text-neutral-400 text-[11px]">Shift (1-25):</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value, 10) || 13)}
                  className="w-20 bg-neutral-900 border border-neutral-800 text-cyan-300 rounded px-2 py-1 outline-none text-xs"
                />
              </div>
            )}

            <div>
              <label className="text-neutral-400 text-[11px] block mb-1">Encoded Input String:</label>
              <textarea
                value={decoderInput}
                onChange={(e) => setDecoderInput(e.target.value)}
                rows={4}
                placeholder="Paste encoded text here..."
                className="w-full bg-neutral-900 border border-neutral-800 text-neutral-200 rounded p-2.5 outline-none focus:border-cyan-500 text-xs font-mono resize-y"
              />
            </div>

            <button
              onClick={handleRunDecoder}
              className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Decode String
            </button>

            {decodedOutput && (
              <div>
                <label className="text-emerald-400 text-[11px] font-semibold block mb-1">Decoded Output:</label>
                <div className="relative">
                  <pre className="p-3 rounded bg-neutral-900 border border-emerald-500/40 text-emerald-300 whitespace-pre-wrap break-words text-xs font-mono select-all">
                    {decodedOutput}
                  </pre>
                  <button
                    onClick={() => handleCopy(decodedOutput, "decoded-out")}
                    className="absolute top-2 right-2 p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                    title="Copy Decoded Output"
                  >
                    {copiedClueId === "decoded-out" ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VFS TREE TAB */}
        {activeTab === "tree" && (
          <div className="space-y-2">
            <div className="text-[11px] text-neutral-400 pb-1 border-b border-neutral-800 flex items-center justify-between">
              <span>SANDBOX DIRECTORY STRUCTURE</span>
              <span className="text-cyan-400 font-semibold">{treeList.length} nodes</span>
            </div>

            {treeList.length === 0 ? (
              <div className="text-neutral-500 italic py-4 text-center">Root directory is empty.</div>
            ) : (
              <div className="space-y-1 bg-neutral-900/60 p-3 rounded-lg border border-neutral-800">
                {treeList.map((item) => {
                  const depth = (item.path.match(/\//g) || []).length;
                  const indent = (depth - 1) * 16;

                  return (
                    <div
                      key={item.path}
                      style={{ paddingLeft: `${indent}px` }}
                      className="flex items-center gap-1.5 text-neutral-300 py-0.5 hover:text-cyan-300 transition-colors"
                    >
                      {item.type === "dir" ? (
                        <Folder className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      ) : (
                        <File className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      )}
                      <span className={item.type === "dir" ? "font-semibold text-cyan-200" : ""}>
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

        {/* OBJECTIVES TAB */}
        {activeTab === "objectives" && (
          <div className="space-y-3">
            <div className="text-[11px] text-neutral-400 pb-1 border-b border-neutral-800">
              MISSION WIN CRITERIA (SERVER VALIDATED)
            </div>

            {objectiveDetails.length === 0 ? (
              <div className="text-neutral-500 italic py-4">No objective rules defined.</div>
            ) : (
              <div className="space-y-2">
                {objectiveDetails.map((obj, i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg border flex items-start gap-2.5 transition-colors ${
                      obj.passed
                        ? "bg-emerald-950/20 border-emerald-500/40 text-emerald-300"
                        : "bg-neutral-900/80 border-neutral-800 text-neutral-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                        obj.passed
                          ? "bg-emerald-500/20 border-emerald-400 text-emerald-400"
                          : "border-neutral-700 bg-neutral-800"
                      }`}
                    >
                      {obj.passed && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      <span className={obj.passed ? "font-medium text-emerald-200 line-through opacity-80" : ""}>
                        {obj.description}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
