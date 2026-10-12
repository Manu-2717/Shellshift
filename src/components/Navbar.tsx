"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  Gamepad2,
  LogOut,
  Shield,
  Trophy,
  UserRound,
} from "lucide-react";

export function Navbar({
  user,
}: {
  user?: { id: string; name: string; role: "USER" | "ADMIN" } | null;
}) {
  const path = usePathname();

  const navItems = [
    { href: "/games", label: "Competitions", icon: Gamepad2 },
    { href: "/leaderboard", label: "Standings", icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/90 bg-[#07080b]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo with Code Icon */}
        <div className="flex items-center gap-7">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-mono text-sm font-bold tracking-wider group transition"
          >
            <span className="grid size-8 place-items-center rounded-lg border border-cyan-500/40 bg-gradient-to-b from-cyan-950/80 to-[#090d14] text-cyan-400 shadow-sm shadow-cyan-950/50 group-hover:border-cyan-400 transition">
              <Code2 className="size-4" />
            </span>
            <span className="text-white group-hover:text-zinc-200 transition">
              SHELL<span className="text-cyan-400">SHIFT</span>
            </span>
          </Link>

          {/* Navigation Tabs */}
          <nav aria-label="Primary navigation" className="flex items-center gap-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = path.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition cursor-pointer ${
                    active
                      ? "border border-cyan-900/60 bg-cyan-950/30 text-cyan-300 shadow-sm shadow-cyan-950/20"
                      : "text-zinc-400 hover:bg-zinc-900/80 hover:text-white"
                  }`}
                >
                  <Icon className={`size-3.5 ${active ? "text-cyan-400" : "text-zinc-500"}`} />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Session / Profile Controls */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/profile"
                className={`flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition cursor-pointer ${
                  path === "/profile"
                    ? "border-cyan-900/60 bg-cyan-950/30 text-cyan-300"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:text-white"
                }`}
              >
                <UserRound className="size-3.5 text-cyan-400" />
                <span className="hidden sm:inline">{user.name}</span>
              </Link>

              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  aria-label="Admin console"
                  className={`grid size-9 place-items-center rounded-lg border text-xs font-medium transition cursor-pointer ${
                    path.startsWith("/admin")
                      ? "border-amber-800/60 bg-amber-950/30 text-amber-300"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-white"
                  }`}
                  title="Admin console"
                >
                  <Shield className="size-3.5 text-amber-400" />
                </Link>
              )}

              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  aria-label="Sign out"
                  title="Sign out"
                  className="grid size-9 place-items-center rounded-lg border border-zinc-800 bg-zinc-900/50 text-zinc-500 hover:border-rose-900/60 hover:bg-rose-950/20 hover:text-rose-300 transition cursor-pointer"
                >
                  <LogOut className="size-3.5" />
                </button>
              </form>
            </>
          ) : (
            <Link href="/api/auth/login" className="btn-primary !h-9 !py-0 !text-xs !px-4">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
