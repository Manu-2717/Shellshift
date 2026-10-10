"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal, Trophy, Shield, Users, LogOut, UserCheck } from "lucide-react";

interface NavbarProps {
  user?: {
    id: string;
    name: string;
    role: "USER" | "ADMIN";
    team?: {
      id: string;
      name: string;
      inviteCode: string;
    } | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="border-b border-neutral-800 bg-[#09090b] sticky top-0 z-40 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-cyan-400 group-hover:border-cyan-500 transition-colors">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-mono font-bold text-sm tracking-wider text-white">
                SHELL<span className="text-cyan-400">SHIFT</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-mono tracking-tight">
                v2.4
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
            <Link
              href="/lobby"
              className={`px-3 py-1.5 rounded transition-colors ${
                isActive("/lobby")
                  ? "bg-neutral-800 text-cyan-400 font-semibold border border-neutral-700"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              Lobby
            </Link>
            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                isActive("/leaderboard")
                  ? "bg-neutral-800 text-cyan-400 font-semibold border border-neutral-700"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Leaderboard
            </Link>
            {user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                  isActive("/admin")
                    ? "bg-neutral-800 text-cyan-300 font-semibold border border-neutral-700"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Admin Console
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {user ? (
            <div className="flex items-center gap-2.5">
              {user.team ? (
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-[#121215] border border-neutral-800 text-neutral-300">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-neutral-400">Team:</span>
                  <span className="text-white font-semibold">{user.team.name}</span>
                  <span className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-700 px-1.5 py-0.2 rounded font-mono">
                    #{user.team.inviteCode}
                  </span>
                </div>
              ) : (
                <Link
                  href="/register"
                  className="px-2.5 py-1 rounded bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:bg-amber-900/40 transition-colors font-semibold"
                >
                  Join / Create Team
                </Link>
              )}

              <div className="flex items-center gap-2 text-neutral-400">
                <span className="hidden lg:inline text-neutral-300">{user.name}</span>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    title="Sign Out"
                    className="p-1 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/api/auth/login?mock=true&role=user"
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
