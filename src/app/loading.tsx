import { Terminal } from "lucide-react";

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#080a0d] text-neutral-100 flex items-center justify-center p-6" aria-live="polite">
      <div className="flex flex-col items-center gap-4 reveal-up">
        <div className="w-11 h-11 rounded-lg border border-neutral-800 bg-[#12171d] flex items-center justify-center text-cyan-400">
          <Terminal className="w-5 h-5" />
        </div>
        <div className="space-y-2 text-center">
          <p className="font-mono text-xs font-bold text-neutral-200">Preparing ShellShift</p>
          <p className="font-mono text-[10px] text-neutral-500">Synchronizing authoritative game state…</p>
        </div>
        <div className="h-1 w-36 overflow-hidden rounded-full bg-neutral-900 border border-neutral-800">
          <div className="h-full w-1/2 bg-cyan-500 status-pulse" />
        </div>
      </div>
    </main>
  );
}
