import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Terminal as TerminalIcon, ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-[#09090b] border border-[#27272a] rounded-lg overflow-hidden shadow-2xl">
          {/* Terminal Title Bar */}
          <div className="bg-[#121215] border-b border-[#27272a] px-3.5 py-2 flex items-center justify-between select-none">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              <span className="text-[#a1a1aa] font-medium text-[11px] ml-1 flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-cyan-400" />
                shiftsh — 404 not found
              </span>
            </div>
            <span className="text-[10px] text-rose-400 bg-rose-950/40 border border-rose-800/60 px-2 py-0.5 rounded font-bold">
              ERR_ROUTE_NOT_FOUND
            </span>
          </div>

          {/* Terminal Body */}
          <div className="p-5 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="text-[#a1a1aa]">
                <span className="text-cyan-400 font-bold">guest</span>
                <span>@shellshift:</span>
                <span className="text-emerald-400 font-bold">~</span>
                <span className="text-white font-bold">$ </span>
                <span className="text-white">resolve --path current_route</span>
              </div>
              <div className="text-rose-400 font-mono pl-2 border-l-2 border-rose-500">
                shiftsh: 404: The requested path does not exist in the virtual namespace.
              </div>
            </div>

            <div className="p-3 rounded bg-[#121215] border border-[#27272a] space-y-1 text-[#a1a1aa] text-[11px]">
              <div className="text-white font-bold mb-1">Available Valid Routes:</div>
              <div>· <Link href="/" className="text-cyan-400 hover:underline">/</Link> — Home & Protocol Briefing</div>
              <div>· <Link href="/lobby" className="text-cyan-400 hover:underline">/lobby</Link> — Mission Catalog (20 Challenges)</div>
              <div>· <Link href="/leaderboard" className="text-cyan-400 hover:underline">/leaderboard</Link> — Competition Leaderboard</div>
              <div>· <Link href="/register" className="text-cyan-400 hover:underline">/register</Link> — Team Profile & Call Sign</div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href="/lobby"
                className="btn-primary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                Enter Mission Lobby
              </Link>
              <Link
                href="/"
                className="btn-secondary py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
