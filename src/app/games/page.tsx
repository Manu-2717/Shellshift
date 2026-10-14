import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatScheduleTime } from "@/lib/games/display";

export const dynamic = "force-dynamic";

export default async function Games() {
  const [user, games] = await Promise.all([
    getSession().catch(() => null),
    prisma.event
      .findMany({
        where: { visibility: "PUBLIC", status: { not: "DRAFT" } },
        orderBy: { startTime: "desc" },
        include: {
          challenges: true,
          _count: { select: { registrations: true } },
        },
      })
      .catch((err) => {
        console.error("[Games] Notice: Could not query games from database:", err?.message || err);
        return [];
      }),
  ]);

  return (
    <div className="min-h-screen bg-[#07080b] text-white">
      <Navbar user={user} />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm text-cyan-400">Competition network</p>
        <h1 className="mt-2 text-4xl font-semibold">Find your next game</h1>
        <p className="mt-3 text-zinc-500">
          Register individually, solve at your pace, and earn your place on the
          board.
        </p>
        <div className="mt-10 grid gap-4">
          {games.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-[#0e1016] p-8 text-center text-zinc-400">
              No public competitions active at the moment.
            </div>
          ) : (
            games.map((g) => (
              <Link
                key={g.id}
                href={`/games/${g.id}`}
                className="grid gap-5 rounded-2xl border border-zinc-800 bg-[#0e1016] p-6 transition hover:-translate-y-0.5 hover:border-zinc-700 sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div>
                  <StatusBadge tone={g.status === "ENDED" ? "neutral" : "info"}>
                    {g.status}
                  </StatusBadge>
                  <h2 className="mt-3 text-xl font-semibold">{g.name}</h2>
                  <p className="mt-2 text-sm text-zinc-500">{g.description}</p>
                  <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
                    <CalendarDays className="size-4" />
                    <span suppressHydrationWarning>
                      {g.startTime ? formatScheduleTime(g.startTime, g.timezone) : "Schedule pending"}
                    </span>{" "}
                    · {g.challenges.length} challenges ·{" "}
                    {g._count.registrations} registered
                  </p>
                </div>
                <span className="flex items-center gap-2 text-sm text-cyan-300">
                  Open game
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
