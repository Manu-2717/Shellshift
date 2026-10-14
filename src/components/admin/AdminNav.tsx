"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Puzzle,
  Users,
} from "lucide-react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/games", label: "Games", icon: CalendarDays, exact: false },
  { href: "/admin/challenges", label: "Challenges", icon: Puzzle, exact: false },
  { href: "/admin/players", label: "Players", icon: Users, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="mt-6 grid grid-cols-4 gap-2 lg:grid-cols-1">
      {navItems.map(({ href, label, icon: Icon, exact }) => {
        const isActive = exact
          ? pathname === href
          : pathname === href || pathname.startsWith(`${href}/`);

        return (
          <Link
            key={label}
            href={href}
            className={`flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm transition lg:justify-start ${
              isActive
                ? "bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/30"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white border border-transparent"
            }`}
          >
            <Icon className={`size-4 ${isActive ? "text-cyan-400" : "text-zinc-400"}`} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
