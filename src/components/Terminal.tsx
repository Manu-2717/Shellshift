"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  Loader2,
  Lock,
} from "lucide-react";

export interface TerminalLine {
  id: string;
  type: "command" | "output" | "error" | "system";
  content: string;
  cwd?: string;
  timestamp?: number;
}

interface TerminalProps {
  runId: string;
  teamName?: string;
  playerName?: string;
  currentCwd: string;
  onCommandExecuted: (result: any) => void;
  disabled?: boolean;
}

export function Terminal({
  runId,
  teamName = "player",
  playerName,
  currentCwd,
  onCommandExecuted,
  disabled = false,
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "init-1",
      type: "system",
      content: "ShellShift Cipher Shell v2.5. Type 'help' for commands.",
    },
    {
      id: "init-2",
      type: "system",
      content: "Command tokens may be remapped. Decode the clues before executing.",
    },
  ]);

  const [inputVal, setInputVal] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when lines change
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, isExecuting]);

  const handleContainerClick = () => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleCopyHistory = () => {
    const text = lines
      .map((l) => (l.type === "command" ? `$ ${l.content}` : l.content))
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setLines([]);
    if (!disabled) {
      inputRef.current?.focus();
    }
  };

  const handleHistoryUp = () => {
    if (history.length === 0) return;
    const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
    setHistoryIdx(nextIdx);
    setInputVal(history[nextIdx] || "");
  };

  const handleHistoryDown = () => {
    if (historyIdx === -1) return;
    const nextIdx = historyIdx + 1;
    if (nextIdx >= history.length) {
      setHistoryIdx(-1);
      setInputVal("");
    } else {
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || "");
    }
  };

  const executeCommandString = async (cmdText: string) => {
    if (disabled || isExecuting) return;
    const cmd = cmdText.trim();
    if (!cmd) return;

    setHistory((prev) => [...prev, cmd]);
    setHistoryIdx(-1);
    setInputVal("");

    const cmdId = "cmd-" + Date.now();
    setLines((prev) => [
      ...prev,
      {
        id: cmdId,
        type: "command",
        content: cmd,
        cwd: currentCwd,
      },
    ]);

    if (cmd.toLowerCase() === "clear") {
      setLines([]);
      return;
    }

    setIsExecuting(true);
    try {
      const res = await fetch(`/api/runs/${runId}/commands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd }),
      });

      const data = await res.json();

      if (data.clearScreen) {
        setLines([]);
      } else if (data.output) {
        setLines((prev) => [
          ...prev,
          {
            id: "out-" + Date.now(),
            type: data.exitCode !== 0 ? "error" : "output",
            content: data.output,
          },
        ]);
      }

      if (data.justCompleted) {
        setLines((prev) => [
          ...prev,
          {
            id: "win-" + Date.now(),
            type: "system",
            content: `[SUCCESS] Objective satisfied! Verified finish time: ${(data.durationMs / 1000).toFixed(2)}s. All conditions met.`,
          },
        ]);
      }

      onCommandExecuted(data);
    } catch (err) {
      setLines((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          type: "error",
          content: `Network error processing command: ${(err as Error).message}`,
        },
      ]);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || isExecuting) return;

    if (e.key === "Enter") {
      e.preventDefault();
      executeCommandString(inputVal);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleHistoryUp();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleHistoryDown();
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      handleClear();
    }
  };

  const formatCwd = (cwd: string = currentCwd) => {
    return cwd.startsWith("/workspace") ? "~" + cwd.slice("/workspace".length) : cwd;
  };

  const safePlayer = (playerName || teamName || "player").toLowerCase().replace(/\s+/g, "_");

  return (
    <div
      onClick={handleContainerClick}
      className={`flex flex-col h-full bg-[#09090b] border rounded-lg overflow-hidden font-mono text-xs select-text shadow-2xl transition-colors ${
        disabled
          ? "border-emerald-600/40 opacity-95"
          : "border-[#27272a] cursor-text"
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="bg-[#121215] border-b border-[#27272a] px-3.5 py-2 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>

          <span className="text-[#fafafa] font-medium text-[11px] flex items-center gap-1.5 ml-1">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            terminal — shiftsh
          </span>

          <span className="text-[10px] text-[#a1a1aa] bg-[#18181b] border border-[#27272a] px-2 py-0.5 rounded font-mono">
            cwd: {formatCwd()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {disabled ? (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800">
              <Lock className="w-3 h-3" />
              LOCKED
            </span>
          ) : isExecuting ? (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              EXECUTING
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#18181b] text-[#a1a1aa] border border-[#27272a]">
              READY
            </span>
          )}

          <button
            onClick={handleCopyHistory}
            type="button"
            className="px-2 py-1 rounded bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white border border-[#27272a] transition-colors flex items-center gap-1 text-[10px]"
            title="Copy terminal session"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            <span>Copy</span>
          </button>

          <button
            onClick={handleClear}
            type="button"
            className="p-1 rounded bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white border border-[#27272a] transition-colors"
            title="Clear terminal buffer (Ctrl+L)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-2">
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed font-mono">
            {line.type === "command" && (
              <div className="flex items-start gap-2 text-neutral-200">
                <span className="shrink-0 font-semibold select-none">
                  <span className="text-cyan-400">{safePlayer}</span>
                  <span className="text-[#a1a1aa]">@shellshift:</span>
                  <span className="text-emerald-400">{formatCwd(line.cwd)}</span>
                  <span className="text-white font-bold">$ </span>
                </span>
                <span className="text-white font-medium break-all">{line.content}</span>
              </div>
            )}
            {line.type === "output" && (
              <pre className="text-[#fafafa] whitespace-pre-wrap break-all font-mono text-[11.5px] sm:text-[12px] leading-relaxed pl-1">
                {line.content}
              </pre>
            )}
            {line.type === "error" && (
              <pre className="text-rose-400 whitespace-pre-wrap break-all font-mono font-medium text-[11.5px] sm:text-[12px] pl-1 border-l-2 border-rose-500/80 my-1 py-0.5">
                {line.content}
              </pre>
            )}
            {line.type === "system" && (
              <div className="text-amber-300 bg-amber-950/25 border-l-2 border-amber-500 px-2.5 py-1 rounded-r my-1 text-[11px] leading-relaxed font-mono">
                {line.content}
              </div>
            )}
          </div>
        ))}

        {/* Live Input Prompt or Locked State */}
        {disabled ? (
          <div className="p-3 rounded bg-emerald-950/30 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2 mt-2">
            <Lock className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Run Completed:</strong> Terminal is locked. Review your execution history or view verified results.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1 text-xs">
            <span className="shrink-0 font-semibold select-none flex items-center">
              <span className="hidden sm:inline">
                <span className="text-cyan-400">{safePlayer}</span>
                <span className="text-[#a1a1aa]">@shellshift:</span>
              </span>
              <span className="text-emerald-400">{formatCwd()}</span>
              <span className="text-white font-bold">$ </span>
            </span>

            <div className="flex-1 flex items-center relative min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isExecuting}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="w-full bg-transparent outline-none text-white font-mono caret-cyan-400 text-xs font-medium placeholder-[#52525b]"
                placeholder={
                  isExecuting
                    ? "Evaluating in sandbox..."
                    : "Type command (e.g. ls, cat, cd)..."
                }
              />
            </div>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
