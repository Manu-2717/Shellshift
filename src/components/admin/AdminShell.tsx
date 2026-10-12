import Link from "next/link";
import { Activity, CalendarDays, LayoutDashboard, Puzzle, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";

const nav = [{ href: "/admin", label: "Overview", icon: LayoutDashboard }, { href: "/admin/games", label: "Games", icon: CalendarDays }, { href: "/admin/challenges", label: "Challenges", icon: Puzzle }, { href: "/admin", label: "Players", icon: Users }];

export function AdminShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-[#07080b] text-white lg:grid lg:grid-cols-[240px_1fr]"><aside className="border-b border-zinc-800 bg-[#0b0d12] p-4 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r"><Link href="/" className="flex items-center gap-3 text-sm font-semibold"><span className="grid size-9 place-items-center rounded-xl bg-cyan-400 text-black"><ShieldCheck className="size-5" /></span><span>ShellShift<br/><span className="text-xs font-normal text-zinc-500">Game control</span></span></Link><nav aria-label="Admin navigation" className="mt-6 grid grid-cols-4 gap-2 lg:grid-cols-1">{nav.map(({ href, label, icon: Icon }) => <Link key={label} href={href} className="flex min-h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm text-zinc-400 transition hover:bg-zinc-900 hover:text-white lg:justify-start"><Icon className="size-4"/><span>{label}</span></Link>)}</nav><div className="mt-8 hidden rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3 text-xs text-emerald-300 lg:flex lg:items-center lg:gap-2"><Activity className="size-4"/>Systems operational</div></aside><main className="min-w-0 p-4 sm:p-6 lg:p-10">{children}</main></div>;
}
