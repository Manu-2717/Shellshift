import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  Terminal,
  Trophy,
  Shield,
  Zap,
  ArrowRight,
  Code2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { CIPHER_METADATA } from "@/lib/ciphers/ciphers";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getSession();
  const currentEvent = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });
  const challengeCount = await prisma.challenge.count({
    where: { isPublished: true },
  });

  const mockAuthEnabled =
    process.env.MOCK_AUTH_ENABLED === "true" &&
    process.env.NODE_ENV !== "production";

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      {/* Hero Section */}
      <section className="border-b border-neutral-800 py-14 md:py-20 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-cyan-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Simulated Shell Speedrun Competition
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
              Decode the Hidden Clues.
              <br />
              <span className="text-cyan-400">Remap the Linux Shell.</span>
              <br />
              Race for the Fastest Time.
            </h1>

            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-2xl">
              In this timed wargame, familiar Linux commands perform surprising operations.
              Teams decipher encoded clue sheets, discover active command mappings,
              navigate an isolated virtual sandbox, and complete objectives under authoritative server timing.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {session ? (
                <Link
                  href="/lobby"
                  className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2"
                >
                  Enter Competition Lobby
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="flex flex-wrap items-center gap-2.5">
                  {mockAuthEnabled ? (
                    <>
                      <Link
                        href="/api/auth/login?mock=true&role=user"
                        className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" />
                        Quick Play (Dev Login)
                      </Link>
                      <Link
                        href="/api/auth/login?mock=true&role=admin"
                        className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 font-bold text-xs transition-colors flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Admin Console
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/api/auth/login"
                      className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold text-xs transition-colors flex items-center gap-2"
                    >
                      Sign In with OIDC Provider
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}

              <Link
                href="/leaderboard"
                className="px-4 py-2.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-bold text-xs transition-colors flex items-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                Live Leaderboard
              </Link>
            </div>
          </div>

          {/* Terminal Gameplay Preview Card */}
          <div className="bg-[#121215] border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#18181b] border-b border-neutral-800 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                <span className="text-neutral-400 ml-2 font-semibold text-[11px] truncate">
                  sandbox_session — Operation Inversion Preview
                </span>
              </div>
              <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Objective: Create /workspace/breach
              </span>
            </div>

            <div className="p-4 space-y-2 text-xs leading-relaxed font-mono">
              <div className="text-neutral-500 text-[11px]">
                # Clue Block decoded: &apos;cd&apos; creates directories. &apos;ls&apos; reads file content.
              </div>
              <div className="flex items-center gap-2 text-neutral-200">
                <span className="text-cyan-400 font-semibold shrink-0">team_alpha@shellshift:~$</span>
                <span className="text-white font-medium break-all">cd /workspace/breach</span>
              </div>
              <div className="text-neutral-400 pl-3.5 border-l-2 border-neutral-700 text-[11px]">
                Created directory: &apos;/workspace/breach&apos; [Mapped operation: mkdir]
              </div>
              <div className="flex items-center gap-2 text-neutral-200 pt-1">
                <span className="text-cyan-400 font-semibold shrink-0">team_alpha@shellshift:~$</span>
                <span className="text-white font-medium break-all">ls /clues/signal.txt</span>
              </div>
              <div className="text-emerald-300 pl-3.5 border-l-2 border-emerald-600/60 font-semibold text-[11px] break-all">
                SIGNAL CONFIRMED: Breach authorization code = INVERSION_OMEGA_99
              </div>
              <div className="text-amber-400 bg-amber-950/20 border-l-2 border-amber-500 px-2 py-1 mt-2 text-[11px] break-all">
                ✓ Objective satisfied! Server recorded verified finish duration: 00:42.18
              </div>
            </div>
          </div>

          {/* Event Status Bar */}
          <div className="p-3.5 rounded-lg bg-[#121215] border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="text-neutral-500">Active Event:</span>
              <span className="text-white font-bold">{currentEvent?.name || "ShellShift Championship"}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-bold">
                {currentEvent?.status || "ACTIVE"}
              </span>
            </div>
            <div className="text-neutral-400">
              <span className="text-cyan-400 font-bold">{challengeCount}</span> Solvable Challenges Configured
            </div>
          </div>
        </div>
      </section>

      {/* Mechanics Grid */}
      <section className="py-14 border-b border-neutral-800 bg-[#0c0c0e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="space-y-1 mb-8">
            <h2 className="text-xl font-bold text-white">How ShellShift Operates</h2>
            <p className="text-neutral-400 text-xs">
              Safe execution, cryptographic deduction, and server-side verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#121215] border border-neutral-800 space-y-2">
              <div className="text-cyan-400 font-black text-xs">01 / REGISTRATION</div>
              <h3 className="font-bold text-white text-xs">Team Authentication</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Sign in with OIDC credentials, name your team, or join teammates with a unique invite code.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#121215] border border-neutral-800 space-y-2">
              <div className="text-cyan-400 font-black text-xs">02 / DECODE</div>
              <h3 className="font-bold text-white text-xs">Cryptographic Deduction</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Decode clues via Base64, Morse, Hex, or Caesar to infer how commands have been remapped.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#121215] border border-neutral-800 space-y-2">
              <div className="text-cyan-400 font-black text-xs">03 / EXECUTE</div>
              <h3 className="font-bold text-white text-xs">Simulated Sandbox</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                Enter commands in the browser terminal. Commands operate strictly on an isolated virtual filesystem.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#121215] border border-neutral-800 space-y-2">
              <div className="text-cyan-400 font-black text-xs">04 / VERIFY</div>
              <h3 className="font-bold text-white text-xs">Authoritative Timer</h3>
              <p className="text-neutral-400 text-[11px] leading-relaxed">
                The server checks the resulting state and records your finish time atomically with race protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cipher Reference Table */}
      <section className="py-14 bg-[#09090b]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Supported Encoding & Cipher Standards</h2>
            <p className="text-neutral-400 text-xs">
              Every challenge employs standardized encodings with accurate technical definitions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {Object.values(CIPHER_METADATA).map((cipher) => (
              <div
                key={cipher.type}
                className="p-3.5 rounded-lg bg-[#121215] border border-neutral-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{cipher.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-900 text-cyan-300 border border-neutral-800">
                    {cipher.category}
                  </span>
                </div>
                <p className="text-neutral-400 text-[11px] leading-relaxed">
                  {cipher.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-800 py-6 bg-[#09090b] text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-white font-bold">ShellShift</span>
            <span>— Linux Command Cipher Race</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/lobby" className="hover:text-white transition-colors">
              Lobby
            </Link>
            <Link href="/leaderboard" className="hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
