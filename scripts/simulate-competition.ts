import { prisma } from "../src/lib/prisma";
import { createSessionToken, SessionUser, SESSION_COOKIE_NAME } from "../src/lib/auth/session";

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

interface AgentPersona {
  id: string;
  name: string;
  teamName: string;
  challengesToPlay: number;
  makesTypoOnChallenge?: number; // 1-indexed challenge number
  delayMs: number;
}

const AGENTS: AgentPersona[] = [
  {
    id: "sim-agent-01",
    name: "Alice Swift",
    teamName: "Alpha_Shifters",
    challengesToPlay: 5,
    delayMs: 120,
  },
  {
    id: "sim-agent-02",
    name: "Quinn Bit",
    teamName: "Quantum_Coders",
    challengesToPlay: 5,
    delayMs: 180,
  },
  {
    id: "sim-agent-03",
    name: "Zack Breaker",
    teamName: "ZeroDay_Hackers",
    challengesToPlay: 5,
    delayMs: 240,
  },
  {
    id: "sim-agent-04",
    name: "Bob Byte",
    teamName: "Byte_Bandits",
    challengesToPlay: 4,
    delayMs: 160,
  },
  {
    id: "sim-agent-05",
    name: "Bella Beast",
    teamName: "Binary_Beasts",
    challengesToPlay: 4,
    delayMs: 220,
  },
  {
    id: "sim-agent-06",
    name: "Toby Titan",
    teamName: "Terminal_Titans",
    challengesToPlay: 4,
    makesTypoOnChallenge: 1,
    delayMs: 250,
  },
  {
    id: "sim-agent-07",
    name: "Neo Matrix",
    teamName: "Matrix_Runners",
    challengesToPlay: 3,
    delayMs: 140,
  },
  {
    id: "sim-agent-08",
    name: "Ken Panic",
    teamName: "Kernel_Panics",
    challengesToPlay: 3,
    delayMs: 260,
  },
  {
    id: "sim-agent-09",
    name: "Grace Glitch",
    teamName: "Glitch_Hunters",
    challengesToPlay: 3,
    makesTypoOnChallenge: 2,
    delayMs: 280,
  },
  {
    id: "sim-agent-10",
    name: "Ronnie Root",
    teamName: "Root_Rangers",
    challengesToPlay: 2,
    delayMs: 190,
  },
];

const SOLUTIONS: Record<string, { negativeCmd: string; steps: string[] }> = {
  "operation-inversion": {
    negativeCmd: "mkdir /workspace/breach",
    steps: ["cd /workspace/breach", "ls /workspace/signal.txt"],
  },
  "pathfinder-basics": {
    negativeCmd: "mkdir project",
    steps: ["cd project"],
  },
  "morse-mail": {
    negativeCmd: "cat /workspace/other.txt",
    steps: ["touch /workspace/note.txt", "cat /workspace/read.txt"],
  },
  "binary-breadcrumbs": {
    negativeCmd: "mkdir /workspace/secret",
    steps: ["cd /workspace/secret"],
  },
  "hex-in-plain-sight": {
    negativeCmd: "rm /workspace/temp.txt",
    steps: ["mkdir /workspace/temp.txt"],
  },
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureAgentAccount(agent: AgentPersona): Promise<{ user: any; team: any; cookieHeader: string }> {
  // Upsert user
  const user = await prisma.user.upsert({
    where: {
      oidcIssuer_oidcSub: {
        oidcIssuer: "https://auth.shellshift.sim",
        oidcSub: agent.id,
      },
    },
    update: { name: agent.name },
    create: {
      oidcSub: agent.id,
      oidcIssuer: "https://auth.shellshift.sim",
      email: `${agent.id}@shellshift.sim`,
      name: agent.name,
      role: "USER",
    },
  });

  // Upsert team
  let team = await prisma.team.findUnique({
    where: { name: agent.teamName },
  });

  if (!team) {
    team = await prisma.team.create({
      data: {
        name: agent.teamName,
        inviteCode: agent.teamName.slice(0, 6).toUpperCase(),
      },
    });
  }

  // Ensure membership
  const membership = await prisma.teamMembership.findFirst({
    where: { userId: user.id, teamId: team.id },
  });

  if (!membership) {
    await prisma.teamMembership.create({
      data: {
        userId: user.id,
        teamId: team.id,
        role: "LEADER",
      },
    });
  }

  const sessionPayload: SessionUser = {
    id: user.id,
    oidcSub: user.oidcSub,
    oidcIssuer: user.oidcIssuer,
    email: user.email,
    name: user.name,
    role: "USER",
    teamId: team.id,
    teamName: team.name,
    teamRole: "LEADER",
  };

  const token = await createSessionToken(sessionPayload);
  const cookieHeader = `${SESSION_COOKIE_NAME}=${token}`;

  return { user, team, cookieHeader };
}

async function runAgent(agent: AgentPersona, challenges: any[], cleanStart: boolean = false) {
  const { team, cookieHeader } = await ensureAgentAccount(agent);

  if (cleanStart) {
    // Clean old runs for this team so test can be re-run cleanly
    await prisma.run.deleteMany({
      where: { teamId: team.id },
    });
  }

  const challengesToRun = challenges.slice(0, agent.challengesToPlay);
  console.log(`\x1b[36m▶ [${agent.teamName}]\x1b[0m Entering arena with target: ${challengesToRun.length} challenges...`);

  for (let cIdx = 0; cIdx < challengesToRun.length; cIdx++) {
    const challenge = challengesToRun[cIdx];
    const challengeNumber = cIdx + 1;
    const solution = SOLUTIONS[challenge.slug];

    if (!solution) {
      console.warn(`[${agent.teamName}] No solution registered for ${challenge.slug}, skipping.`);
      continue;
    }

    await sleep(agent.delayMs);

    // 1. Start Challenge Run
    const startRes = await fetch(`${BASE_URL}/api/runs/start`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ challengeId: challenge.id }),
    });

    if (!startRes.ok) {
      const errText = await startRes.text();
      console.error(`\x1b[31m✖ [${agent.teamName}]\x1b[0m Failed to start #${challenge.order} (${challenge.slug}): ${errText}`);
      continue;
    }

    const startData = await startRes.json();
    const runId = startData.run?.id;
    if (!runId) {
      console.error(`\x1b[31m✖ [${agent.teamName}]\x1b[0m Missing runId for ${challenge.slug}`);
      continue;
    }

    if (startData.run?.isAlreadyCompleted) {
      console.log(`\x1b[33m⚡ [${agent.teamName}]\x1b[0m #${challenge.order} already completed earlier.`);
      continue;
    }

    // 2. Persona: Maybe make a typo command first
    if (agent.makesTypoOnChallenge === challengeNumber) {
      await sleep(agent.delayMs);
      await fetch(`${BASE_URL}/api/runs/${runId}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ command: solution.negativeCmd }),
      });
      console.log(`\x1b[90m⚙ [${agent.teamName}]\x1b[0m Made initial exploratory command on #${challenge.order}, evaluating result...`);
    }

    // 3. Execute actual solution steps
    let finalRunResult: any = null;
    for (const step of solution.steps) {
      await sleep(agent.delayMs);
      const cmdRes = await fetch(`${BASE_URL}/api/runs/${runId}/commands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ command: step }),
      });

      if (!cmdRes.ok) {
        const err = await cmdRes.text();
        console.error(`\x1b[31m✖ [${agent.teamName}]\x1b[0m Command '${step}' failed: ${err}`);
      } else {
        finalRunResult = await cmdRes.json();
      }
    }

    if (finalRunResult?.isCompleted) {
      const durSec = ((finalRunResult.durationMs || 0) / 1000).toFixed(1);
      const score = finalRunResult.scoreBreakdown?.finalScore ?? finalRunResult.finalScore ?? 0;
      console.log(
        `\x1b[32m✔ [${agent.teamName}]\x1b[0m Solved #${challenge.order} (${challenge.slug}) in ${durSec}s | Score: \x1b[1m+${score} pts\x1b[0m`
      );
    } else {
      console.log(`\x1b[33m⚠ [${agent.teamName}]\x1b[0m Finished steps for #${challenge.order}, status: ${finalRunResult?.status}`);
    }
  }

  console.log(`\x1b[35m★ [${agent.teamName}]\x1b[0m Simulation run finished!`);
}

async function main() {
  console.log("\x1b[1;34m========================================================\x1b[0m");
  console.log("\x1b[1;34m   ShellShift Multi-Agent Competition Simulator (10 Bots)\x1b[0m");
  console.log("\x1b[1;34m========================================================\x1b[0m");

  // Verify server is online
  try {
    const health = await fetch(`${BASE_URL}/api/health`).then((r) => r.json());
    console.log(`\x1b[32m✔ Server is online:\x1b[0m ${health.service} (${health.status})`);
  } catch {
    console.error(`\x1b[31m✖ Could not connect to ${BASE_URL}. Ensure Next.js is running!\x1b[0m`);
    process.exit(1);
  }

  // Load published challenges
  const challenges = await prisma.challenge.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });

  console.log(`Loaded ${challenges.length} challenges from database.`);
  console.log(`Launching 10 autonomous agents in parallel...\n`);

  const startTime = Date.now();

  // Run all 10 agents concurrently (cleanStart: true to reset test runs)
  await Promise.allSettled(
    AGENTS.map((agent) => runAgent(agent, challenges, true))
  );

  const totalTimeSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\x1b[1;32mAll 10 agents finished in ${totalTimeSec}s!\x1b[0m\n`);

  // Query live leaderboard endpoint
  const lbRes = await fetch(`${BASE_URL}/api/leaderboard`);
  if (!lbRes.ok) {
    console.error("Failed to query /api/leaderboard");
    return;
  }

  const lbData = await lbRes.json();
  console.log("\x1b[1;33m🏆 LIVE TOURNAMENT LEADERBOARD (Top Players):\x1b[0m");
  console.log("-----------------------------------------------------------------------------------------");
  console.log(
    ` ${"Rank".padEnd(5)} | ${"Player".padEnd(20)} | ${"Completed".padEnd(10)} | ${"Score".padEnd(8)} | ${"Time".padEnd(10)}`
  );
  console.log("-----------------------------------------------------------------------------------------");

  for (const row of lbData.leaderboard.slice(0, 15)) {
    const rankStr = `#${row.rank}`.padEnd(5);
    const nameStr = row.teamName.padEnd(20);
    const compStr = `${row.challengesCompleted} challenges`.padEnd(10);
    const scoreStr = `${row.totalScore} pts`.padEnd(8);
    const timeStr = (row.formattedTime || "--:--").padEnd(10);
    console.log(` ${rankStr} | ${nameStr} | ${compStr} | ${scoreStr} | ${timeStr}`);
  }
  console.log("-----------------------------------------------------------------------------------------");
  console.log(`\nView live on mobile or web: \x1b[36m${BASE_URL}/leaderboard\x1b[0m\n`);
}

main()
  .catch((err) => {
    console.error("Simulation error:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
