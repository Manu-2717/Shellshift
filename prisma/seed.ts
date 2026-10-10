import { PrismaClient } from "@prisma/client";
import { SEED_CHALLENGES } from "../src/lib/challenges/seedData";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding ShellShift database...");

  // 1. Seed or update default event
  const existingEvent = await prisma.event.findFirst();
  if (!existingEvent) {
    await prisma.event.create({
      data: {
        name: "ShellShift Inaugural Cipher Championship",
        description: "Competitive Linux Command Cipher Race. Decode the matrix, master remapped commands, win the race.",
        status: "ACTIVE",
        startTime: new Date(),
      },
    });
    console.log("Created active competition event.");
  }

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
