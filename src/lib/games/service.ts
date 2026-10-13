import { prisma } from "@/lib/prisma";
import { canTransitionGame, validateGameSchedule } from "./lifecycle";
import type { StoredGameStatus } from "./types";

export interface GameAdminInput {
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  visibility?: "PUBLIC" | "UNLISTED";
  leaderboardVisibility?: "LIVE" | "AFTER_END" | "HIDDEN";
  registrationOpensAt: string;
  registrationClosesAt: string;
  startsAt: string;
  endsAt: string;
  challengeIds: string[];
}

export interface NormalizedGameInput {
  name: string;
  slug: string;
  description: string | null;
  timezone: string;
  visibility: string;
  leaderboardVisibility: string;
  registrationOpensAt: Date;
  registrationClosesAt: Date;
  startTime: Date;
  endTime: Date;
  challengeIds: string[];
}

export function normalizeGameInput(input: GameAdminInput): {
  data?: NormalizedGameInput;
  fieldErrors: Record<string, string>;
} {
  const fieldErrors: Record<string, string> = {};
  if (!input.name?.trim()) fieldErrors.name = "Enter a game name.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug || ""))
    fieldErrors.slug = "Use lowercase words separated by hyphens.";
  try {
    new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format();
  } catch {
    fieldErrors.timezone = "Choose a valid IANA timezone.";
  }

  const schedule = {
    registrationOpensAt: new Date(input.registrationOpensAt),
    registrationClosesAt: new Date(input.registrationClosesAt),
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
  };
  const scheduleResult = validateGameSchedule(schedule);
  Object.assign(fieldErrors, scheduleResult.errors);
  if (Object.keys(fieldErrors).length) return { fieldErrors };

  if (
    input.challengeIds &&
    new Set(input.challengeIds).size !== input.challengeIds.length
  ) {
    fieldErrors.challengeIds =
      "Each challenge may only appear once in a lineup.";
  }

  return {
    fieldErrors,
    data: {
      name: input.name.trim(),
      slug: input.slug,
      description: input.description?.trim() || null,
      timezone: input.timezone,
      visibility: input.visibility || "PUBLIC",
      leaderboardVisibility: input.leaderboardVisibility || "LIVE",
      registrationOpensAt: schedule.registrationOpensAt,
      registrationClosesAt: schedule.registrationClosesAt,
      startTime: schedule.startsAt,
      endTime: schedule.endsAt,
      challengeIds: input.challengeIds || [],
    },
  };
}

export function validateLineupChallenges(
  selectedIds: string[],
  catalog: Array<{ id: string; isPublished: boolean }>,
  existingIds: string[] = [],
): { valid: boolean; error?: string } {
  const existingSet = new Set(existingIds);
  const newlyAdded = selectedIds.filter((id) => !existingSet.has(id));
  const catalogMap = new Map(catalog.map((c) => [c.id, c]));
  for (const id of newlyAdded) {
    const item = catalogMap.get(id);
    if (!item || !item.isPublished) {
      return {
        valid: false,
        error: "Hidden challenges cannot be added to a new lineup.",
      };
    }
  }
  return { valid: true };
}

export function validatePublishableGame(input: GameAdminInput) {
  const fieldErrors: Record<string, string> = {};
  if (!input.challengeIds?.length)
    fieldErrors.challengeIds = "Choose at least one published challenge.";
  return { valid: Object.keys(fieldErrors).length === 0, fieldErrors };
}

export async function createGameDraft(input: GameAdminInput, actorId: string) {
  const normalized = normalizeGameInput(input);
  if (!normalized.data) return normalized;
  const { challengeIds, ...data } = normalized.data;
  if (challengeIds.length) {
    const published = await prisma.challenge.findMany({
      where: { id: { in: challengeIds }, isPublished: true },
      select: { id: true },
    });
    if (published.length !== challengeIds.length) {
      return {
        fieldErrors: {
          challengeIds: "Hidden challenges cannot be added to a new lineup.",
        },
      };
    }
  }
  const game = await prisma.$transaction(async (tx) => {
    const created = await tx.event.create({
      data: { ...data, status: "DRAFT", createdById: actorId },
    });
    if (challengeIds.length) {
      await tx.eventChallenge.createMany({
        data: challengeIds.map((challengeId, order) => ({
          eventId: created.id,
          challengeId,
          order,
        })),
      });
    }
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "GAME_CREATED",
        details: JSON.stringify({ eventId: created.id }),
      },
    });
    return created;
  });
  return { game, fieldErrors: {} };
}

export async function updateGameDraft(
  gameId: string,
  input: GameAdminInput,
  actorId: string,
) {
  const normalized = normalizeGameInput(input);
  if (!normalized.data) return normalized;
  const { challengeIds, ...data } = normalized.data;
  if (challengeIds.length) {
    const existing = await prisma.eventChallenge.findMany({
      where: { eventId: gameId },
      select: { challengeId: true },
    });
    const existingIds = new Set(existing.map((e) => e.challengeId));
    const newlyAdded = challengeIds.filter((id) => !existingIds.has(id));
    if (newlyAdded.length > 0) {
      const published = await prisma.challenge.findMany({
        where: { id: { in: newlyAdded }, isPublished: true },
        select: { id: true },
      });
      if (published.length !== newlyAdded.length) {
        return {
          fieldErrors: {
            challengeIds: "Hidden challenges cannot be added to a new lineup.",
          },
        };
      }
    }
  }
  const game = await prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({ where: { id: gameId }, data });
    await tx.eventChallenge.deleteMany({ where: { eventId: gameId } });
    if (challengeIds.length)
      await tx.eventChallenge.createMany({
        data: challengeIds.map((challengeId, order) => ({
          eventId: gameId,
          challengeId,
          order,
        })),
      });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "GAME_UPDATED",
        details: JSON.stringify({ eventId: gameId }),
      },
    });
    return updated;
  });
  return { game, fieldErrors: {} };
}

export async function publishGame(gameId: string, actorId: string) {
  const game = await prisma.event.findUnique({
    where: { id: gameId },
    include: { challenges: { include: { challenge: true } } },
  });
  if (!game) return { error: "Game not found." };
  const fieldErrors: Record<string, string> = {};
  if (!game.challenges.some((item) => item.challenge.isPublished))
    fieldErrors.challengeIds = "Choose at least one published challenge.";
  if (
    !game.registrationOpensAt ||
    !game.registrationClosesAt ||
    !game.startTime ||
    !game.endTime
  )
    fieldErrors.schedule = "Complete the game schedule.";
  if (Object.keys(fieldErrors).length)
    return { error: "Game is not ready to publish.", fieldErrors };
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.event.update({
      where: { id: gameId },
      data: { status: "PUBLISHED" },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "GAME_PUBLISHED",
        details: JSON.stringify({ eventId: gameId }),
      },
    });
    return result;
  });
  return { game: updated };
}

export async function transitionGameStatus(
  gameId: string,
  status: StoredGameStatus,
  actorId: string,
) {
  const current = await prisma.event.findUnique({ where: { id: gameId } });
  if (!current) return { error: "Game not found." };
  if (!canTransitionGame(current.status as StoredGameStatus, status))
    return { error: `Cannot move ${current.status} to ${status}.` };
  const game = await prisma.$transaction(async (tx) => {
    const updated = await tx.event.update({
      where: { id: gameId },
      data: { status },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: `GAME_${status}`,
        details: JSON.stringify({ eventId: gameId }),
      },
    });
    return updated;
  });
  return { game };
}

export function checkGameDeletionEligibility(
  game: {
    name: string;
    status: string;
    registrationCount: number;
    runCount: number;
  },
  confirmation: string,
): { eligible: boolean; error?: string; status?: 400 | 409 } {
  if (game.name.trim() !== confirmation?.trim()) {
    return {
      eligible: false,
      error: "Game name confirmation does not match.",
      status: 400,
    };
  }
  if (
    game.status !== "DRAFT" ||
    game.registrationCount > 0 ||
    game.runCount > 0
  ) {
    return {
      eligible: false,
      error:
        "Only unused draft games with no registrations or runs can be deleted.",
      status: 409,
    };
  }
  return { eligible: true };
}

export async function deleteUnusedDraft(
  gameId: string,
  confirmation: string,
  actorId: string,
) {
  return await prisma.$transaction(async (tx) => {
    const game = await tx.event.findUnique({
      where: { id: gameId },
      include: {
        _count: {
          select: { registrations: true, runs: true },
        },
      },
    });
    if (!game) {
      return { error: "Game not found.", status: 404 as const };
    }
    const check = checkGameDeletionEligibility(
      {
        name: game.name,
        status: game.status,
        registrationCount: game._count.registrations,
        runCount: game._count.runs,
      },
      confirmation,
    );
    if (!check.eligible) {
      return { error: check.error, status: check.status! };
    }
    await tx.eventChallenge.deleteMany({ where: { eventId: gameId } });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "GAME_DELETED",
        details: JSON.stringify({
          gameId,
          name: game.name,
          slug: game.slug,
        }),
      },
    });
    await tx.event.delete({ where: { id: gameId } });
    return { success: true, status: 200 as const };
  });
}

export async function archiveGame(gameId: string, actorId: string) {
  const game = await prisma.event.findUnique({ where: { id: gameId } });
  if (!game) {
    return { error: "Game not found.", status: 404 as const };
  }
  if (game.status === "ARCHIVED") {
    return { error: "Game is already archived.", status: 400 as const };
  }
  const updated = await prisma.$transaction(async (tx) => {
    const res = await tx.event.update({
      where: { id: gameId },
      data: { status: "ARCHIVED" },
    });
    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: "GAME_ARCHIVED",
        details: JSON.stringify({ gameId, name: game.name }),
      },
    });
    return res;
  });
  return { game: updated, status: 200 as const };
}
