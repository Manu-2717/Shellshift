import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { getGameStandings } from "@/lib/games/standings";
import { Trophy, Gamepad2, ChevronRight, AlertCircle } from "lucide-react";
import { LeaderboardView, LeaderboardEntry } from "./LeaderboardView";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ gameId?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const requestedGameId = resolvedParams?.gameId;
  const session = await getSession().catch(() => null);

  // Fetch all competition events so contestants can view/switch between events
  let events: any[] = [];
  try {
    events = await prisma.event.findMany({
      orderBy: [{ createdAt: "desc" }],
      include: {
        challenges: true,
      },
    });
  } catch (err) {
    console.error("[Leaderboard] Events query error:", (err as Error)?.message || err);
  }

  // Pick target event: requested by query param, or active LIVE event, or most recent
  const selectedEvent = requestedGameId
    ? events.find((e) => e.id === requestedGameId || e.slug === requestedGameId)
    : events.find((e) => e.status === "PUBLISHED") || events[0];

  let entries: LeaderboardEntry[] = [];
  let teamEntries: any[] = [];
  let standingsError: string | null = null;
  let totalChallenges = 0;

  if (selectedEvent) {
    totalChallenges = selectedEvent.challenges?.length || 0;
    try {
      const standingsResult = await getGameStandings(selectedEvent.id, session?.id);
      if (standingsResult.error) {
        standingsError = standingsResult.error;
      } else {
        entries = standingsResult.standings.map((s) => ({
          userId: s.userId,
          userName: s.userName,
          totalScore: s.totalScore,
          challengesCompleted: s.challengesCompleted,
          aggregateDurationMs: s.aggregateDurationMs,
          lastCompletionMs: s.lastCompletionMs,
          rank: s.rank,
          isViewer: s.isViewer,
        }));
        teamEntries = standingsResult.teamStandings || [];
      }
    } catch (err) {
      console.error("[Leaderboard] Standings query error:", (err as Error)?.message || err);
    }
  }

  let sessionTeamId = session?.teamId;
  if (session?.id && !sessionTeamId) {
    const membership = await prisma.teamMembership.findFirst({
      where: { userId: session.id },
      select: { teamId: true },
    });
    if (membership) {
      sessionTeamId = membership.teamId;
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10 w-full flex-1 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#27272a] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
              <Link href="/games" className="hover:underline flex items-center gap-1">
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Competitions</span>
              </Link>
              <ChevronRight className="w-3 h-3 text-zinc-600" />
              <span className="text-zinc-400">Event Leaderboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5 tracking-tight">
              <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
              {selectedEvent ? selectedEvent.name : "Event Leaderboard"}
            </h1>
            <p className="text-xs text-[#a1a1aa] mt-0.5">
              Verified individual points standings for this competition event.
            </p>
          </div>

          {selectedEvent && (
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono self-start sm:self-auto">
              <span
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-semibold ${
                  selectedEvent.status === "PUBLISHED"
                    ? "text-emerald-400 bg-emerald-950/40 border-emerald-800/60"
                    : selectedEvent.status === "ENDED"
                    ? "text-zinc-400 bg-zinc-900/60 border-zinc-800"
                    : "text-amber-400 bg-amber-950/40 border-amber-800/60"
                }`}
              >
                {selectedEvent.status === "PUBLISHED" && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
                {selectedEvent.status === "PUBLISHED" ? "Live Event" : selectedEvent.status}
              </span>
              <span className="text-[#a1a1aa] bg-[#18181b] border border-[#27272a] px-2.5 py-1 rounded">
                {teamEntries.length > 0
                  ? `${teamEntries.length} Teams · ${entries.length} Contestants`
                  : `${entries.length} Contestants`}
              </span>
            </div>
          )}
        </div>

        {/* Event Selector when multiple events exist */}
        {events.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-zinc-500 font-mono shrink-0">Switch Event:</span>
            {events.map((ev) => {
              const isSelected = selectedEvent?.id === ev.id;
              return (
                <Link
                  key={ev.id}
                  href={`/leaderboard?gameId=${ev.id}`}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium shrink-0 transition-colors border ${
                    isSelected
                      ? "bg-cyan-950/60 border-cyan-500/60 text-cyan-300 shadow-sm"
                      : "bg-[#121215] border-[#27272a] text-zinc-400 hover:text-white hover:border-zinc-700"
                  }`}
                >
                  {ev.name}
                </Link>
              );
            })}
          </div>
        )}

        {/* Leaderboard or Empty/Error State */}
        {!selectedEvent ? (
          <div className="bg-[#121215] border border-[#27272a] rounded-xl p-12 text-center space-y-4">
            <Trophy className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No Competitions Found</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              No live or scheduled events are available at this moment. Check back soon or visit the competitions directory.
            </p>
            <Link
              href="/games"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Browse Competitions</span>
            </Link>
          </div>
        ) : standingsError ? (
          <div className="bg-[#121215] border border-amber-900/40 rounded-xl p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-sm font-bold text-white">Leaderboard Notice</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              {standingsError}
            </p>
          </div>
        ) : (
          <LeaderboardView
            entries={entries}
            teamEntries={teamEntries}
            totalChallenges={totalChallenges}
            currentUserId={session?.id}
            currentTeamId={sessionTeamId}
            eventName={selectedEvent.name}
            gameId={selectedEvent.id}
          />
        )}
      </main>
    </div>
  );
}
