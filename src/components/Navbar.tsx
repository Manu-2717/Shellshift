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
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
              <Terminal className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-bold text-sm tracking-wider text-neutral-100 group-hover:text-cyan-400 transition-colors">
                SHELL<span className="text-cyan-400">SHIFT</span>
              </span>
              <span className="text-[10px] text-neutral-500 tracking-tight font-mono">
                CIPHER RACE
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-mono">
            <Link
              href="/lobby"
              className={`px-3 py-1.5 rounded transition-colors ${
                isActive("/lobby")
                  ? "bg-neutral-800/80 text-cyan-400 border border-neutral-700"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
              }`}
            >
              Lobby
            </Link>
            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 rounded transition-colors flex items-center gap-1.5 ${
                isActive("/leaderboard")
                  ? "bg-neutral-800/80 text-cyan-400 border border-neutral-700"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
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
                    ? "bg-cyan-950/50 text-cyan-300 border border-cyan-800/50"
                    : "text-neutral-400 hover:text-cyan-300 hover:bg-neutral-900"
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-cyan-400" />
                Admin Panel
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          {user ? (
            <div className="flex items-center gap-3">
              {user.team ? (
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-neutral-400">Team:</span>
                  <span className="text-cyan-300 font-semibold">{user.team.name}</span>
                  <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
                    #{user.team.inviteCode}
                  </span>
                </div>
              ) : (
                <Link
                  href="/register"
                  className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors"
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
                    className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/api/auth/login?mock=true&role=user"
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-bold tracking-wide transition-colors flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                Sign In / Play
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
