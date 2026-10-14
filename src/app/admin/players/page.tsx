import { prisma } from "@/lib/prisma";
import { formatScheduleDate } from "@/lib/games/display";
import { Users, Award, CheckCircle2, PlayCircle, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPlayersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          registrations: true,
          runs: true,
        },
      },
      runs: {
        select: {
          id: true,
          status: true,
          finalScore: true,
        },
      },
      registrations: {
        include: {
          event: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { registeredAt: "desc" },
        take: 3,
      },
    },
  });

  const totalUsers = users.length;
  const registeredUsers = users.filter((u) => u._count.registrations > 0).length;
  const totalRuns = users.reduce((acc, u) => acc + u._count.runs, 0);
  const completedRuns = users.reduce(
    (acc, u) => acc + u.runs.filter((r) => r.status === "COMPLETED").length,
    0
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
          Roster & Participation
        </p>
        <h1 className="text-3xl font-semibold">Player Directory</h1>
        <p className="text-sm text-zinc-400">
          Monitor user accounts, competition registrations, and challenge attempt histories.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs uppercase tracking-wider">Total Players</span>
            <Users className="size-4 text-cyan-400" />
          </div>
          <strong className="mt-2 block text-3xl font-mono">{totalUsers}</strong>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs uppercase tracking-wider">Competitors</span>
            <Award className="size-4 text-amber-400" />
          </div>
          <strong className="mt-2 block text-3xl font-mono">{registeredUsers}</strong>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs uppercase tracking-wider">Total Runs</span>
            <PlayCircle className="size-4 text-purple-400" />
          </div>
          <strong className="mt-2 block text-3xl font-mono">{totalRuns}</strong>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-[#0e1016] p-5">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs uppercase tracking-wider">Completed</span>
            <CheckCircle2 className="size-4 text-emerald-400" />
          </div>
          <strong className="mt-2 block text-3xl font-mono">{completedRuns}</strong>
        </div>
      </div>

      {/* Players Table */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-[#0e1016]">
        <div className="border-b border-zinc-800 px-6 py-4">
          <h2 className="text-base font-semibold">Registered Accounts</h2>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            No player accounts registered yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-800/80 bg-zinc-900/40 text-xs uppercase text-zinc-400">
                <tr>
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Role</th>
                  <th className="px-6 py-3 font-medium">Competitions</th>
                  <th className="px-6 py-3 font-medium">Runs</th>
                  <th className="px-6 py-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                {users.map((u) => {
                  const completed = u.runs.filter((r) => r.status === "COMPLETED").length;
                  const inProgress = u.runs.filter((r) => r.status === "IN_PROGRESS").length;

                  return (
                    <tr key={u.id} className="hover:bg-zinc-900/30 transition">
                      <td className="px-6 py-4 font-sans">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-zinc-500 font-mono">
                          {u.email || "No email"}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {u.role === "ADMIN" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                            <Shield className="size-3" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[11px] text-zinc-400">
                            USER
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 font-sans">
                        <div className="text-zinc-300 font-medium">
                          {u._count.registrations} event{u._count.registrations !== 1 ? "s" : ""}
                        </div>
                        {u.registrations.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-zinc-500">
                            {u.registrations.map((reg) => (
                              <span
                                key={reg.event.id}
                                className="rounded bg-zinc-900/80 px-1.5 py-0.5"
                              >
                                {reg.event.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-zinc-300">
                          {u._count.runs} total
                        </div>
                        <div className="text-[11px] text-zinc-500">
                          {completed} completed · {inProgress} active
                        </div>
                      </td>

                      <td className="px-6 py-4 text-zinc-400 font-sans" suppressHydrationWarning>
                        {formatScheduleDate(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
