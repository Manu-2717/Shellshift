import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChallengeDetailsEditor } from "@/components/admin/ChallengeDetailsEditor";
import { ChallengeTechnicalSummary } from "@/components/admin/ChallengeTechnicalSummary";
import { technicalSummary } from "@/lib/challenges/adminMetadata";
export const dynamic = "force-dynamic";
export default async function EditChallenge({
  params,
}: {
  params: Promise<{ challengeId: string }>;
}) {
  const { challengeId } = await params,
    c = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: { hints: { orderBy: { order: "asc" } } },
    });
  if (!c) notFound();
  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <header>
        <p className="text-sm text-cyan-400">Challenge library</p>
        <h1 className="mt-1 text-3xl font-semibold">Edit {c.title}</h1>
      </header>
      <ChallengeDetailsEditor
        initial={{
          id: c.id,
          title: c.title,
          description: c.description,
          difficulty: c.difficulty,
          timeLimitSeconds: c.timeLimitSeconds,
          isPublished: c.isPublished,
          hints: c.hints,
        }}
      />
      <ChallengeTechnicalSummary summary={technicalSummary(c)} />
    </div>
  );
}
