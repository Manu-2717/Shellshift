import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  calculateRunScore,
  validateScoringConfig,
  DEFAULT_SCORING_CONFIG,
  ScoringConfig,
  ScoredObjective,
} from "@/lib/scoring/scoringEngine";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin privileges required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const {
      config,
      objectives,
      elapsedSeconds = 300,
      verifiedObjectiveIds = [],
      revealedHintPenalties = [],
      isCompleted = true,
    } = body;

    const mergedConfig: ScoringConfig = {
      ...DEFAULT_SCORING_CONFIG,
      ...(config || {}),
    };

    const targetObjectives: ScoredObjective[] = objectives || [];
    const validation = validateScoringConfig(mergedConfig, targetObjectives);

    const baseStart = new Date("2026-10-10T12:00:00Z");
    const completedAt = isCompleted
      ? new Date(baseStart.getTime() + elapsedSeconds * 1000)
      : null;

    const previewScore = calculateRunScore({
      status: isCompleted ? "COMPLETED" : "IN_PROGRESS",
      startedAt: baseStart,
      completedAt,
      verifiedObjectiveIds,
      revealedHintPenalties,
      config: mergedConfig,
      objectives: targetObjectives,
    });

    // Also calculate standard milestones (5m, 10m, 15m, 20m) for preview
    const milestones = [
      { label: "5 Minutes (Fast solve)", seconds: 300 },
      { label: "10 Minutes (Mid solve)", seconds: 600 },
      { label: "15 Minutes (Late solve)", seconds: 900 },
      { label: "Deadline Finish", seconds: mergedConfig.timeLimitSeconds },
    ].map((m) => {
      const allObjectiveIds = targetObjectives.map((o) => o.id);
      return {
        label: m.label,
        elapsedSeconds: m.seconds,
        score: calculateRunScore({
          status: "COMPLETED",
          startedAt: baseStart,
          completedAt: new Date(baseStart.getTime() + m.seconds * 1000),
          verifiedObjectiveIds: allObjectiveIds,
          revealedHintPenalties: [],
          config: mergedConfig,
          objectives: targetObjectives,
        }),
      };
    });

    return NextResponse.json({
      validation,
      preview: previewScore,
      milestones,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to calculate scoring preview: " + (err as Error).message },
      { status: 500 }
    );
  }
}
