import Link from "next/link";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login?redirect=/admin");
  }

  if (session.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
        <Navbar user={session} />
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full p-8 rounded-xl bg-[#121215] border border-rose-900/60 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-400 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold text-white">403 — Access Denied</h1>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Administrator privileges are required to access the ShellShift Console. Your account (
                <span className="text-cyan-400">{session.email || session.name}</span>) is assigned the standard{" "}
                <span className="text-amber-400 font-bold">{session.role}</span> role.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/lobby"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold border border-neutral-700 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Competition Lobby
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const event = await prisma.event.findFirst({
    orderBy: { createdAt: "desc" },
  });

  const challenges = await prisma.challenge.findMany({
    orderBy: { order: "asc" },
    include: {
      hints: true,
      _count: { select: { runs: true } },
    },
  });

  const runs = await prisma.run.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      team: true,
      challenge: true,
      commandLogs: {
        orderBy: { timestamp: "desc" },
        take: 5,
      },
      hintUsages: { include: { hint: true } },
    },
    take: 30,
  });

  const parsedChallenges = challenges.map((c) => ({
    ...c,
    commandMappings: JSON.parse(c.commandMappings || "{}"),
    clues: JSON.parse(c.clues || "[]"),
    initialFilesystem: JSON.parse(c.initialFilesystem || "{}"),
    objectiveConfig: JSON.parse(c.objectiveConfig || "{}"),
  }));

  return (
    <div className="min-h-screen bg-[#09090b] text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />
      <AdminDashboardClient
        initialEvent={event}
        initialChallenges={parsedChallenges}
        initialRuns={runs}
      />
    </div>
  );
}
