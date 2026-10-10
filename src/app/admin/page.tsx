import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { AdminDashboardClient } from "./AdminClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();

  if (!session) {
    redirect("/api/auth/login?mock=true&role=admin");
  }

  if (session.role !== "ADMIN") {
    redirect("/?error=Admin+privileges+required");
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
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-mono selection:bg-cyan-500 selection:text-black">
      <Navbar user={session} />
      <AdminDashboardClient
        initialEvent={event}
        initialChallenges={parsedChallenges}
        initialRuns={runs}
      />
    </div>
  );
}
