import Link from "next/link";
import { ArrowRight, CalendarDays, CircleAlert, Plus, Radio, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StartLiveGameModal } from "@/components/admin/StartLiveGameModal";

export const dynamic = "force-dynamic";

function formatScheduleTime(date: Date | null, timezone?: string | null): string {
  if (!date) return "Schedule not set";
  try {
    const formatted = date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone || "UTC",
    });
    return formatted.replace(/\u202f/g, " ");
  } catch {
    return date.toUTCString();
  }
}

export default async function AdminPage() {
  const [games, publishedChallenges] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { registrations: true, runs: true } } },
      take: 6,
    }),
    prisma.challenge.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        title: true,
        difficulty: true,
        timeLimitSeconds: true,
      },
    }),
  ]);

  const now = new Date();
  const live = games.find(
    (g) =>
      g.status === "PUBLISHED" &&
      g.startTime &&
      g.endTime &&
      now >= g.startTime &&
      now < g.endTime
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-cyan-400">Operations overview</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Game control</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-500">
            Schedule competitions, watch players progress, and keep every event running cleanly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StartLiveGameModal challenges={publishedChallenges} />
          <Link href="/admin/games/new" className="btn-secondary">
            <Plus className="size-4" />
            Schedule game
          </Link>
        </div>
      </header>

      {live ? (
        <section className="rounded-2xl border border-cyan-900/60 bg-gradient-to-br from-cyan-950/25 to-[#0e1016] p-6">
          <div className="flex items-center justify-between">
            <StatusBadge tone="success">
              <Radio className="size-3" />
              Live now
            </StatusBadge>
            <Link
              href={`/admin/games/${live.id}/live`}
              className="text-sm text-cyan-300 hover:text-cyan-200"
            >
              Open live console <ArrowRight className="ml-1 inline size-4" />
            </Link>
          </div>
          <h2 className="mt-5 text-2xl font-semibold">{live.name}</h2>
          <div className="mt-6 flex flex-wrap gap-8 text-sm">
            <div>
              <span className="block text-zinc-500">Registered</span>
              <strong className="mt-1 block text-2xl">{live._count.registrations}</strong>
            </div>
            <div>
              <span className="block text-zinc-500">Runs</span>
              <strong className="mt-1 block text-2xl">{live._count.runs}</strong>
            </div>
          </div>
        </section>
      ) : (
        <section className="flex items-center gap-4 rounded-2xl border border-zinc-800 bg-[#0e1016] p-5">
          <CircleAlert className="size-5 text-amber-400" />
          <div>
            <h2 className="font-medium">No game is live</h2>
            <p className="text-sm text-zinc-500">
              Your next scheduled game will appear here automatically.
            </p>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Competition schedule</h2>
          <Link href="/admin/games" className="text-sm text-zinc-400 hover:text-white">
            View all
          </Link>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e1016]">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/admin/games/${game.id}`}
              className="grid min-h-20 grid-cols-[1fr_auto] items-center gap-4 border-b border-zinc-800 px-5 last:border-0 hover:bg-zinc-900/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{game.name}</h3>
                  <StatusBadge tone={game.status === "PUBLISHED" ? "info" : "neutral"}>
                    {game.status}
                  </StatusBadge>
                </div>
                <p
                  className="mt-1 flex items-center gap-2 text-xs text-zinc-500"
                  suppressHydrationWarning
                >
                  <CalendarDays className="size-3" />
                  <span>{formatScheduleTime(game.startTime, game.timezone)}</span>
                </p>
              </div>
              <span className="flex items-center gap-2 text-sm text-zinc-500">
                <Users className="size-4" />
                {game._count.registrations}
              </span>
            </Link>
          ))}
          {games.length === 0 ? (
            <p className="p-10 text-center text-sm text-zinc-500">
              Create your first game to begin.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
