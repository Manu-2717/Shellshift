import { prisma } from "@/lib/prisma";
export interface ChallengeMetadataInput {
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number;
  isPublished: boolean;
  hints: Array<{
    title: string;
    content: string;
    penaltySeconds: number;
    pointPenalty: number;
    order: number;
  }>;
}
const allowed = new Set([
  "title",
  "description",
  "difficulty",
  "timeLimitSeconds",
  "isPublished",
  "hints",
]);
export function validateChallengeMetadata(value: unknown): {
  value?: ChallengeMetadataInput;
  errors: string[];
} {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return { errors: ["Challenge details must be an object."] };
  const input = value as Record<string, unknown>;
  const protectedKeys = Object.keys(input).filter((k) => !allowed.has(k));
  if (protectedKeys.length)
    return {
      errors: [
        `Protected challenge fields cannot be edited here: ${protectedKeys.join(", ")}.`,
      ],
    };
  const errors: string[] = [];
  if (
    typeof input.title !== "string" ||
    input.title.trim().length < 3 ||
    input.title.length > 80
  )
    errors.push("Title must be between 3 and 80 characters.");
  if (
    typeof input.description !== "string" ||
    input.description.trim().length < 10 ||
    input.description.length > 500
  )
    errors.push("Description must be between 10 and 500 characters.");
  if (!["EASY", "MEDIUM", "HARD"].includes(String(input.difficulty)))
    errors.push("Choose Easy, Medium, or Hard.");
  if (
    !Number.isInteger(input.timeLimitSeconds) ||
    Number(input.timeLimitSeconds) < 300 ||
    Number(input.timeLimitSeconds) > 7200
  )
    errors.push("Time limit must be between 5 and 120 minutes.");
  if (typeof input.isPublished !== "boolean")
    errors.push("Visibility must be published or hidden.");
  if (!Array.isArray(input.hints) || input.hints.length < 2)
    errors.push("Add at least two progressive hints.");
  else
    input.hints.forEach((h: any, i) => {
      if (
        !h ||
        typeof h.title !== "string" ||
        typeof h.content !== "string" ||
        !h.title.trim() ||
        !h.content.trim()
      )
        errors.push(`Hint ${i + 1} needs a title and helpful text.`);
    });
  return errors.length
    ? { errors }
    : { value: input as unknown as ChallengeMetadataInput, errors: [] };
}
export async function updateChallengeMetadata(
  challengeId: string,
  input: unknown,
  actorId: string,
) {
  const parsed = validateChallengeMetadata(input);
  if (!parsed.value) return { error: parsed.errors, status: 400 as const };
  if (
    !(await prisma.challenge.findUnique({
      where: { id: challengeId },
      select: { id: true },
    }))
  )
    return { error: ["Challenge not found."], status: 404 as const };
  const v = parsed.value;
  const challenge = await prisma.$transaction(async (tx) => {
    const updated = await tx.challenge.update({
      where: { id: challengeId },
      data: {
        title: v.title.trim(),
        description: v.description.trim(),
        difficulty: v.difficulty,
        timeLimitSeconds: v.timeLimitSeconds,
        isPublished: v.isPublished,
      },
    });
    await tx.hint.deleteMany({ where: { challengeId } });
    await tx.hint.createMany({
      data: v.hints.map((h, i) => ({
        challengeId,
        title: h.title.trim(),
        content: h.content.trim(),
        penaltySeconds: h.penaltySeconds,
        pointPenalty: h.pointPenalty,
        order: i + 1,
      })),
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "CHALLENGE_METADATA_UPDATED",
        details: JSON.stringify({ challengeId }),
      },
    });
    return updated;
  });
  return { challenge, status: 200 as const };
}
export function technicalSummary(c: {
  slug: string;
  order: number;
  commandMappings: string;
  clues: string;
  initialFilesystem: string;
  objectiveConfig: string;
  scoringConfig: string | null;
}) {
  const mappings = JSON.parse(c.commandMappings || "{}");
  const clues = JSON.parse(c.clues || "[]");
  const files = JSON.parse(c.initialFilesystem || "{}");
  const objectives = JSON.parse(c.objectiveConfig || "{}");
  return {
    slug: c.slug,
    order: c.order,
    mappedCommands: Object.keys(mappings).length,
    clues: clues.length,
    starterFiles: Object.keys(files).length,
    objectives: objectives.rules?.length ?? 0,
    scoringConfigured: Boolean(c.scoringConfig),
  };
}
