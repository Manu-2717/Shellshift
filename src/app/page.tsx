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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-neutral-800 py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-neutral-950/0 to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            Competitive Linux Command Cipher Race
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Decode the Clues. Remap the Shell.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Race Against the Clock.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-neutral-400 text-sm md:text-base leading-relaxed">
            A sandboxed browser terminal competition inspired by Linux wargames. Familiar commands
            take on unexpected meanings. Teams decode cipher transmissions, infer active command
            matrices, and race for server-verified victory.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {session ? (
              <Link
                href="/lobby"
                className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
              >
                Enter Competition Lobby
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {mockAuthEnabled ? (
                  <>
                    <Link
                      href="/api/auth/login?mock=true&role=user"
                      className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      Sign In as Player (Dev Mock)
                    </Link>
                    <Link
                      href="/api/auth/login?mock=true&role=admin"
                      className="px-5 py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-cyan-300 transition-colors flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Admin Login
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/api/auth/login"
                    className="px-6 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2"
                  >
                    Authenticate via OIDC Provider
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

            <Link
              href="/leaderboard"
              className="px-5 py-3 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 transition-colors flex items-center gap-2"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              Live Leaderboard
            </Link>
          </div>

          {/* Event Status Banner */}
          <div className="pt-8">
            <div className="inline-flex items-center gap-4 px-4 py-2 rounded-lg bg-neutral-900/80 border border-neutral-800 text-xs">
              <span className="text-neutral-500 font-sans">Active Event:</span>
              <span className="text-neutral-200 font-bold">{currentEvent?.name || "ShellShift Event"}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 border border-emerald-500/40 text-emerald-300 uppercase font-semibold">
                {currentEvent?.status || "ACTIVE"}
              </span>
              <span className="text-neutral-500">|</span>
              <span className="text-cyan-400">{challengeCount} Challenges Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Mechanics Progression */}
      <section className="py-16 border-b border-neutral-800 bg-neutral-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white">How ShellShift Works</h2>
            <p className="text-neutral-400 text-xs max-w-xl mx-auto">
              Four steps from registration to server-verified leaderboard glory.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-neutral-200 text-sm">Team Registration</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Authenticate via OIDC, create your team, or join teammates with a unique invite code.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-neutral-200 text-sm">Decode Transmissions</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Inspect cipher clue blocks using the built-in scratchpad decoder to infer the remapped command matrix.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-neutral-200 text-sm">Simulated Execution</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Run commands in the sandboxed virtual shell. Commands never execute on the host machine.
              </p>
            </div>

            <div className="p-5 rounded-lg bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 font-bold text-sm">
                04
              </div>
              <h3 className="font-bold text-neutral-200 text-sm">Server Validation</h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                The backend evaluates the resulting filesystem state and timestamps completion with microsecond precision.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cipher Formats */}
      <section className="py-16 bg-neutral-900/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-10">
            <h2 className="text-2xl font-bold text-white">Supported Cipher & Encoding Systems</h2>
            <p className="text-neutral-400 text-xs max-w-xl mx-auto">
              Every challenge employs standardized encodings and classic ciphers with accurate technical distinctions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(CIPHER_METADATA).map((cipher) => (
              <div
                key={cipher.type}
                className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2 hover:border-cyan-500/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-neutral-200 text-xs">{cipher.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
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
      <footer className="mt-auto border-t border-neutral-800 py-8 bg-neutral-950 text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-neutral-400 font-bold">ShellShift</span>
            <span>— Competitive Linux Command Cipher Race</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/lobby" className="hover:text-cyan-400 transition-colors">
              Lobby
            </Link>
            <Link href="/leaderboard" className="hover:text-cyan-400 transition-colors">
              Leaderboard
            </Link>
            <Link href="/admin" className="hover:text-cyan-400 transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
