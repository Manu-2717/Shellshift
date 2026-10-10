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
  KeyRound,
  Folder,
  File,
  Sparkles,
  HelpCircle,
  StickyNote,
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

interface CipherWorkspaceProps {
  clues: Clue[];
  treeList: TreeItem[];
  unlockedHints?: Array<{ id: string; title: string; content: string; penaltySeconds: number }>;
}

export function CipherWorkspace({
  clues,
  treeList,
  unlockedHints = [],
}: CipherWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"clues" | "decoder" | "tree">("clues");

  // Decoder State
  const [decoderInput, setDecoderInput] = useState("");
  const [selectedCipher, setSelectedCipher] = useState<CipherType>("base64");
  const [caesarShift, setCaesarShift] = useState(13);
  const [decodedOutput, setDecodedOutput] = useState("");
  const [scratchNotes, setScratchNotes] = useState("");
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
    <div className="flex flex-col h-full bg-[#0a0a0c] border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs shadow-xl">
      {/* Tab Navigation Header */}
      <div className="bg-[#121215] border-b border-neutral-800 px-3 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("clues")}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "clues"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Cipher Clues ({clues.length})
          </button>

          <button
            onClick={() => setActiveTab("decoder")}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "decoder"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Decoder & Notes
          </button>

          <button
            onClick={() => setActiveTab("tree")}
            className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === "tree"
                ? "bg-neutral-800 text-cyan-400 font-bold border border-neutral-700"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            VFS Tree
          </button>
        </div>

        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
          Challenge Tools
        </span>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {/* TAB 1: CLUES */}
        {activeTab === "clues" && (
          <div className="space-y-3.5">
            <div className="text-[11px] text-neutral-400 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
              <span>DECODE THESE CLUES TO DISCOVER COMMAND REMAPPINGS</span>
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
                  className="p-3 rounded-lg bg-[#121215] border border-neutral-800 space-y-2 hover:border-neutral-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-cyan-400 text-[10px] font-bold">
                        #{idx + 1}
                      </span>
                      <span className="text-white font-medium text-xs">{clue.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-neutral-900 text-neutral-300 border border-neutral-800">
                        {meta.name}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {meta.category}
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-2.5 rounded bg-[#0a0a0c] border border-neutral-800 text-cyan-300 whitespace-pre-wrap break-all text-[11px] select-all max-h-32 overflow-y-auto font-mono">
                      {clue.encodedContent}
                    </pre>

                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(clue.encodedContent, clue.id)}
                        className="p-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
                        title="Copy Encoded String"
                      >
                        {copiedClueId === clue.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSendToDecoder(clue)}
                        className="px-2 py-1 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 transition-colors text-[10px] flex items-center gap-1 font-bold"
                        title="Send to Decoder Scratchpad"
                      >
                        <Sparkles className="w-3 h-3" />
                        Decode
                      </button>
                    </div>
                  </div>

                  <div className="text-[10px] text-neutral-400 flex items-center gap-1.5">
                    <span className="text-neutral-500 font-semibold">Description:</span>
                    <span>{clue.hintNote}</span>
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

        {/* TAB 2: DECODER & SCRATCHPAD */}
        {activeTab === "decoder" && (
          <div className="space-y-3.5">
            <div>
              <label className="text-neutral-400 text-[11px] block mb-1 font-medium">
                Select Encoding / Cipher Format:
              </label>
              <select
                value={selectedCipher}
                onChange={(e) => setSelectedCipher(e.target.value as CipherType)}
                className="w-full bg-[#121215] border border-neutral-800 text-neutral-200 rounded px-2.5 py-1.5 outline-none focus:border-cyan-500 text-xs font-mono"
              >
                {Object.entries(CIPHER_METADATA).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.name} — {meta.category}
                  </option>
                ))}
              </select>
            </div>

            {selectedCipher === "caesar" && (
              <div className="flex items-center gap-2 bg-[#121215] p-2 rounded border border-neutral-800">
                <label className="text-neutral-400 text-[11px]">Rotational Shift (1-25):</label>
                <input
                  type="number"
                  min="1"
                  max="25"
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value, 10) || 13)}
                  className="w-16 bg-[#0a0a0c] border border-neutral-700 text-cyan-300 rounded px-2 py-0.5 outline-none text-xs font-bold"
                />
              </div>
            )}

            <div>
              <label className="text-neutral-400 text-[11px] block mb-1 font-medium">
                Encoded Clue String:
              </label>
              <textarea
                value={decoderInput}
                onChange={(e) => setDecoderInput(e.target.value)}
                rows={3}
                placeholder="Paste encoded text here to decode..."
                className="w-full bg-[#121215] border border-neutral-800 text-neutral-200 rounded p-2.5 outline-none focus:border-cyan-500 text-xs font-mono resize-y"
              />
            </div>

            <button
              onClick={handleRunDecoder}
              className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-1.5 text-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Decode String
            </button>

            {decodedOutput && (
              <div>
                <label className="text-emerald-400 text-[11px] font-bold block mb-1">
                  Decoded Plaintext Result:
                </label>
                <div className="relative">
                  <pre className="p-3 rounded bg-[#121215] border border-emerald-500/40 text-emerald-300 whitespace-pre-wrap break-words text-xs font-mono select-all">
                    {decodedOutput}
                  </pre>
                  <button
                    onClick={() => handleCopy(decodedOutput, "decoded-out")}
                    className="absolute top-2 right-2 p-1 rounded bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
                    title="Copy Decoded Output"
                  >
                    {copiedClueId === "decoded-out" ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Team Scratch Notes */}
            <div className="pt-2 border-t border-neutral-800">
              <label className="text-neutral-400 text-[11px] font-medium flex items-center gap-1.5 mb-1">
                <StickyNote className="w-3.5 h-3.5 text-amber-400" />
                Team Scratchpad (Hypotheses & Notes):
              </label>
              <textarea
                value={scratchNotes}
                onChange={(e) => setScratchNotes(e.target.value)}
                rows={3}
                placeholder="e.g. 'cd' makes folders, 'mkdir' deletes..."
                className="w-full bg-[#121215] border border-neutral-800 text-neutral-300 rounded p-2 outline-none focus:border-cyan-500 text-xs font-mono resize-y"
              />
            </div>
          </div>
        )}

        {/* TAB 3: VFS TREE EXPLORER */}
        {activeTab === "tree" && (
          <div className="space-y-2">
            <div className="text-[11px] text-neutral-400 pb-1.5 border-b border-neutral-800 flex items-center justify-between">
              <span>SANDBOX DIRECTORY STRUCTURE</span>
              <span className="text-cyan-400 font-semibold">{treeList.length} items</span>
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
