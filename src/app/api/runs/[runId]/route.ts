import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { sanitizeChallengeForPlayer } from "../../challenges/route";
import { evaluateObjective } from "@/lib/vfs/evaluator";
import { ObjectiveConfig, VfsDirectory, VfsNode, VfsState } from "@/lib/vfs/types";

function extractTreeList(dir: VfsDirectory, basePath: string = ""): Array<{ path: string; name: string; type: "file" | "dir"; size?: number }> {
  const items: Array<{ path: string; name: string; type: "file" | "dir"; size?: number }> = [];

  for (const [name, child] of Object.entries(dir.children)) {
    const fullPath = `${basePath}/${name}`;
    if (child.type === "dir") {
      items.push({ path: fullPath, name, type: "dir" });
      items.push(...extractTreeList(child, fullPath));
    } else {
      items.push({ path: fullPath, name, type: "file", size: child.content.length });
    }
  }

  return items;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      team: { select: { id: true, name: true } },
      challenge: {
        include: {
          hints: {
            select: { id: true, title: true, penaltySeconds: true, order: true },
          },
        },
      },
      hintUsages: {
        include: { hint: true },
      },
    },
  });

  if (!run) {
    return NextResponse.json({ error: "Run not found." }, { status: 404 });
  }

  if (run.teamId !== session.teamId && session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Run belongs to another team." }, { status: 403 });
  }

  let vfsState: VfsState | null = null;
  let treeList: Array<{ path: string; name: string; type: "file" | "dir"; size?: number }> = [];

  try {
    vfsState = JSON.parse(run.filesystemState);
    if (vfsState?.root) {
      treeList = extractTreeList(vfsState.root);
    }
  } catch {}

  let objectiveConfig: ObjectiveConfig = { description: "", rules: [] };
  try {
    objectiveConfig = JSON.parse(run.challenge.objectiveConfig);
  } catch {}

  const evaluation = vfsState
    ? evaluateObjective(vfsState, objectiveConfig, run.commandCount)
    : null;

  return NextResponse.json({
    run: {
      id: run.id,
      status: run.status,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      durationMs: run.durationMs,
      currentWorkingDir: run.currentWorkingDir,
      commandCount: run.commandCount,
      team: run.team,
      challenge: sanitizeChallengeForPlayer(run.challenge),
      objectiveEvaluation: evaluation,
      treeList,
      unlockedHints: run.hintUsages.map((hu) => ({
        id: hu.hint.id,
        title: hu.hint.title,
        content: hu.hint.content,
        penaltySeconds: hu.hint.penaltySeconds,
        requestedAt: hu.requestedAt,
      })),
    },
  });
}
