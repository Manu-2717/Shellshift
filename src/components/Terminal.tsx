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
  const terminalOutputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll inside terminal container only (never scrolling the parent window/viewport)
  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [lines, isExecuting]);

  // Keep cursor focused in terminal unless user explicitly focused another element or selected text
  useEffect(() => {
    if (!disabled) {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag !== "input" && activeTag !== "textarea" && !window.getSelection()?.toString()) {
        inputRef.current?.focus();
      }
    }
  }, [lines, disabled]);

  const handleContainerClick = () => {
    if (window.getSelection()?.toString()) return;
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

      if (!res.ok && !data.output) {
        setLines((prev) => [
          ...prev,
          {
            id: "err-" + Date.now(),
            type: "error",
            content: data.error || `[ERROR ${res.status}] Request could not be processed.`,
          },
        ]);
      } else {
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
      requestAnimationFrame(() => {
        if (!disabled) {
          inputRef.current?.focus();
        }
      });
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
      className={`flex flex-col h-full bg-[#08090f] border rounded-xl overflow-hidden font-mono text-xs select-text shadow-2xl transition-colors ${
        disabled
          ? "border-emerald-600/40 opacity-95"
          : "border-[#1e2434] cursor-text"
      }`}
    >
      {/* Terminal Title Bar */}
      <div className="bg-[#0d101a] border-b border-[#1e2434] px-4 py-2.5 flex items-center justify-between select-none shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-[#ef4444]" />
            <span className="size-2.5 rounded-full bg-[#f59e0b]" />
            <span className="size-2.5 rounded-full bg-[#10b981]" />
          </div>

          <span className="text-zinc-300 font-medium text-xs flex items-center gap-1.5 ml-0.5">
            <TerminalIcon className="size-3.5 text-cyan-400" />
            terminal — shiftsh
          </span>

          <span className="text-[10px] text-zinc-400 bg-[#121622] border border-[#23293a] px-2 py-0.5 rounded font-mono">
            cwd: {formatCwd()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Indicator */}
          {disabled ? (
            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800">
              <Lock className="size-3" />
              LOCKED
            </span>
          ) : isExecuting ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800 animate-pulse">
              <Loader2 className="size-3 animate-spin text-cyan-400" />
              EXECUTING
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 tracking-wider">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              READY
            </span>
          )}
        </div>
      </div>

      {/* Terminal Output Area */}
      <div ref={terminalOutputRef} className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-2.5">
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed font-mono">
            {line.type === "command" && (
              <div className="flex items-start gap-2 text-neutral-200">
                <span className="shrink-0 font-semibold select-none">
                  <span className="text-cyan-400">{safePlayer}</span>
                  <span className="text-zinc-400">@shellshift:</span>
                  <span className="text-emerald-400">{formatCwd(line.cwd)}</span>
                  <span className="text-white font-bold">$ </span>
                </span>
                <span className="text-white font-medium break-all">{line.content}</span>
              </div>
            )}
            {line.type === "output" && (
              <pre className="text-zinc-200 whitespace-pre-wrap break-all font-mono text-[11.5px] sm:text-[12px] leading-relaxed pl-1">
                {line.content}
              </pre>
            )}
            {line.type === "error" && (
              <pre className="text-rose-400 whitespace-pre-wrap break-all font-mono font-medium text-[11.5px] sm:text-[12px] pl-2 border-l-2 border-rose-500/80 my-1 py-0.5">
                {line.content}
              </pre>
            )}
            {line.type === "system" && (
              <div className="text-amber-200/90 bg-amber-950/20 border border-amber-500/30 px-3.5 py-2 rounded-lg my-1 text-xs leading-relaxed font-mono shadow-[0_0_10px_rgba(245,158,11,0.05)]">
                {line.content}
              </div>
            )}
          </div>
        ))}

        {/* Live Input Prompt or Locked State */}
        {disabled ? (
          <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-600/40 text-emerald-300 text-xs flex items-center gap-2 mt-2">
            <Lock className="size-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Run Completed:</strong> Terminal is locked. Review your execution history or view verified results.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 pt-1 text-xs">
            <span className="shrink-0 font-semibold select-none flex items-center">
              <span className="hidden sm:inline">
                <span className="text-cyan-400">{safePlayer}</span>
                <span className="text-zinc-400">@shellshift:</span>
              </span>
              <span className="text-emerald-400">{formatCwd()}</span>
              <span className="text-white font-bold">$ </span>
            </span>

            <div className="flex-1 flex items-center relative min-w-0">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={(e) => {
                  if (!isExecuting) setInputVal(e.target.value);
                }}
                onKeyDown={handleKeyDown}
                readOnly={isExecuting}
                autoFocus
                spellCheck={false}
                autoComplete="off"
                className="terminal-input w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0 ring-0 shadow-none text-white font-mono caret-cyan-400 text-xs font-medium placeholder-zinc-600 !min-h-0 !h-auto p-0 m-0"
                style={{
                  border: "none",
                  outline: "none",
                  boxShadow: "none",
                  minHeight: "unset",
                  height: "auto",
                  padding: 0,
                  margin: 0,
                  background: "transparent",
                }}
                placeholder=""
              />
            </div>
          </div>
        )}

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
