import { prisma } from "@/lib/prisma";

interface RegistrationWindow {
  status: string;
  registrationOpensAt: Date | null;
  registrationClosesAt: Date | null;
}

export function canRegisterForGame(game: RegistrationWindow, now = new Date()) {
  return game.status === "PUBLISHED" && !!game.registrationOpensAt && !!game.registrationClosesAt && now >= game.registrationOpensAt && now < game.registrationClosesAt;
}

export async function registerUserForGame(eventId: string, userId: string, now = new Date()) {
  const game = await prisma.event.findUnique({ where: { id: eventId } });
  if (!game) return { error: "Game not found.", status: 404 };
  if (!canRegisterForGame(game, now)) return { error: "Registration is not open.", status: 403 };
  const registration = await prisma.gameRegistration.upsert({
    where: { eventId_userId: { eventId, userId } },
    update: { status: "REGISTERED" },
    create: { eventId, userId },
  });
  return { registration, status: 200 };
}

