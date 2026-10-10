"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
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
  teamName: string;
  currentCwd: string;
  onCommandExecuted: (result: any) => void;
  disabled?: boolean;
}

export function Terminal({
  runId,
  teamName,
  currentCwd,
  onCommandExecuted,
  disabled = false,
}: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: "init-1",
      type: "system",
      content: "ShellShift Cipher Shell v2.4 (Simulated Sandbox). Type 'help' for command listing.",
    },
    {
      id: "init-2",
      type: "system",
      content: "WARNING: Command tokens may have remapped meanings. Decode the cipher sheet clues to reveal the active matrix.",
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
  }, [lines]);

  const handleContainerClick = () => {
    inputRef.current?.focus();
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
    inputRef.current?.focus();
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const cmd = inputVal;
      if (!cmd.trim() && cmd === "") return;

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

      if (cmd.trim().toLowerCase() === "clear") {
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
              content: `🏆 CHALLENGE SOLVED! Verified Time: ${(data.durationMs / 1000).toFixed(2)}s. Objective conditions fully satisfied!`,
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
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = historyIdx === -1 ? history.length - 1 : Math.max(0, historyIdx - 1);
      setHistoryIdx(nextIdx);
      setInputVal(history[nextIdx] || "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx === -1) return;
      const nextIdx = historyIdx + 1;
      if (nextIdx >= history.length) {
        setHistoryIdx(-1);
        setInputVal("");
      } else {
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx] || "");
      }
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      handleClear();
    }
  };

  const promptPrefix = (cwd: string = currentCwd) => {
    const displayPath = cwd.startsWith("/workspace")
      ? "~" + cwd.slice("/workspace".length)
      : cwd;
    return `${teamName.toLowerCase().replace(/\s+/g, "_")}@shellshift:${displayPath}$`;
  };

  return (
    <div
      onClick={handleContainerClick}
      className="flex flex-col h-full bg-[#0a0a0c] border border-neutral-800 rounded-lg overflow-hidden font-mono text-xs select-text cursor-text shadow-xl"
    >
      {/* Title Bar */}
      <div className="bg-[#121215] border-b border-neutral-800 px-3.5 py-2 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700 hover:bg-rose-500 transition-colors" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700 hover:bg-amber-500 transition-colors" />
            <span className="w-2.5 h-2.5 rounded-full bg-neutral-700 hover:bg-emerald-500 transition-colors" />
          </div>

          <span className="text-neutral-400 font-medium text-[11px] flex items-center gap-1.5 ml-1">
            <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
            terminal — shiftsh
          </span>

          <span className="text-[10px] text-neutral-500 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
            cwd: {currentCwd}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyHistory}
            type="button"
            className="px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors flex items-center gap-1 text-[10px]"
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
            className="p-1.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors"
            title="Clear terminal (Ctrl+L)"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {lines.map((line) => (
          <div key={line.id} className="leading-relaxed">
            {line.type === "command" && (
              <div className="flex items-start gap-2 text-neutral-200">
                <span className="text-cyan-400 font-semibold shrink-0">
                  {promptPrefix(line.cwd)}
                </span>
                <span className="text-white font-medium">{line.content}</span>
              </div>
            )}
            {line.type === "output" && (
              <pre className="text-neutral-300 whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed">
                {line.content}
              </pre>
            )}
            {line.type === "error" && (
              <pre className="text-rose-400 whitespace-pre-wrap break-words font-mono font-medium text-[12px]">
                {line.content}
              </pre>
            )}
            {line.type === "system" && (
              <div className="text-amber-300 bg-amber-950/20 border-l-2 border-amber-500 px-2.5 py-1 rounded-r my-1 text-[11px] leading-relaxed">
                {line.content}
              </div>
            )}
          </div>
        ))}

        {/* Live Input Prompt */}
        <div className="flex items-center gap-2 pt-1">
          <span className="text-cyan-400 font-semibold shrink-0">
            {promptPrefix()}
          </span>
          <div className="flex-1 flex items-center relative">
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled || isExecuting}
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-transparent outline-none text-white font-mono caret-cyan-400 text-xs"
              placeholder={
                disabled
                  ? "Run completed. Terminal locked."
                  : isExecuting
                  ? "Evaluating in sandbox..."
                  : ""
              }
            />
          </div>
        </div>

        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
