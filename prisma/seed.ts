import { PrismaClient } from "@prisma/client";
import { SEED_CHALLENGES } from "../src/lib/challenges/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ShellShift database...");

  const now = new Date();
  const registrationOpensAt = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const registrationClosesAt = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const startTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

  const event = await prisma.event.upsert({
    where: { slug: "autumn-cipher-sprint" },
    update: {},
    create: {
      slug: "autumn-cipher-sprint",
      name: "Autumn Cipher Sprint",
      description: "An individual Linux command-cipher competition.",
      status: "PUBLISHED",
      registrationOpensAt,
      registrationClosesAt,
      startTime,
      endTime,
      timezone: "Asia/Kolkata",
    },
  });

  // 2. Seed challenges & hints
  for (const challengeDef of SEED_CHALLENGES) {
    const existing = await prisma.challenge.findUnique({
      where: { slug: challengeDef.slug },
    });

    const challengeData = {
      slug: challengeDef.slug,
      title: challengeDef.title,
      description: challengeDef.description || "",
      difficulty: challengeDef.difficulty,
      order: challengeDef.order,
      timeLimitSeconds: challengeDef.timeLimitSeconds,
      scoringConfig: JSON.stringify(challengeDef.scoringConfig),
      commandMappings: JSON.stringify(challengeDef.commandMappings),
      clues: JSON.stringify(challengeDef.clues),
      initialFilesystem: JSON.stringify(challengeDef.initialFilesystem),
      objectiveConfig: JSON.stringify(challengeDef.objectiveConfig),
      isPublished: true,
    };

    let challenge;
    if (existing) {
      challenge = await prisma.challenge.update({
        where: { slug: challengeDef.slug },
        data: challengeData,
      });
      console.log(`Updated challenge: ${challengeDef.slug}`);
    } else {
      challenge = await prisma.challenge.create({
        data: challengeData,
      });
      console.log(`Created challenge: ${challengeDef.slug}`);
    }

    // Delete existing hints and recreate to keep in sync
    await prisma.hint.deleteMany({
      where: { challengeId: challenge.id },
    });

    for (const h of challengeDef.hints) {
      await prisma.hint.create({
        data: {
          challengeId: challenge.id,
          title: h.title,
          content: h.content,
          penaltySeconds: h.penaltySeconds,
          pointPenalty: h.pointPenalty,
          order: h.order,
        },
      });
    }
  }

  const challenges = await prisma.challenge.findMany({ orderBy: { order: "asc" }, take: 8 });
  await prisma.eventChallenge.deleteMany({ where: { eventId: event.id } });
  await prisma.eventChallenge.createMany({
    data: challenges.map((challenge, index) => ({
      eventId: event.id,
      challengeId: challenge.id,
      order: index + 1,
    })),
  });

  const demoUser = await prisma.user.upsert({
    where: { oidcIssuer_oidcSub: { oidcIssuer: "seed", oidcSub: "demo-player" } },
    update: {},
    create: { oidcIssuer: "seed", oidcSub: "demo-player", name: "Demo Operator" },
  });
  await prisma.gameRegistration.upsert({
    where: { eventId_userId: { eventId: event.id, userId: demoUser.id } },
    update: { status: "REGISTERED" },
    create: { eventId: event.id, userId: demoUser.id },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
