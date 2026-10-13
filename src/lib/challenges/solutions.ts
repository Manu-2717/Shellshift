import type { SeedChallengeDef } from "./catalogTypes";
import { ADDITIONAL_SOLUTIONS } from "./additionalSeedData";

export interface ChallengeSolution {
  negativeCmd: string;
  steps: string[];
}

export const CHALLENGE_SOLUTIONS: Record<string, ChallengeSolution> = {
  "operation-inversion": {
    negativeCmd: "mkdir /workspace/breach",
    steps: ["cd /workspace/breach", "ls /workspace/signal.txt"],
  },
  "the-cryptic-agent": {
    negativeCmd: "touch /workspace/agent.key",
    steps: ["rm /workspace/notes.txt", "pwd /workspace/agent.key"],
  },
  "deep-breach-babel": {
    negativeCmd: "mkdir -p /workspace/vault/core",
    steps: [
      "grep -p /workspace/vault/core",
      "mv /workspace/secret.key /workspace/vault/core/secret.key",
      "cp /workspace/temp.tmp",
    ],
  },
  "pathfinder-basics": { negativeCmd: "mkdir project", steps: ["cd project"] },
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
  "directory-flip": {
    negativeCmd: "cp /workspace/flag.txt /workspace/found.txt",
    steps: ["touch /workspace/flag.txt /workspace/found.txt"],
  },
  "the-missing-file": {
    negativeCmd: "cp /workspace/data.txt /workspace/backup/data.txt",
    steps: ["mv /workspace/data.txt /workspace/backup/data.txt"],
  },
  "first-flag": {
    negativeCmd: "mkdir /workspace/mission",
    steps: [
      "cd /workspace/mission",
      "cp /workspace/briefing.txt /workspace/mission/briefing.txt",
    ],
  },
  "dead-letter": {
    negativeCmd: "mkdir /workspace/alpha",
    steps: ["cd /workspace/alpha", "cd /workspace/beta"],
  },
  "log-diver": {
    negativeCmd: "find /workspace -name secret.txt",
    steps: [
      "grep /workspace -name secret.txt",
      "cp /workspace/sub1/sub2/sub3/secret.txt /workspace/found.txt",
    ],
  },
  "the-relocation-protocol": {
    negativeCmd: "cp /workspace/report.doc /workspace/archive/report.doc",
    steps: ["mv /workspace/report.doc /workspace/archive/report.doc"],
  },
  "needle-in-the-archive": {
    negativeCmd: "touch /workspace/alert.txt",
    steps: ["cat ERROR /workspace/server.log", "ls /workspace/alert.txt"],
  },
  "ghost-signal": {
    negativeCmd: "mkdir /workspace/safe",
    steps: ["rm /workspace/safe", "mkdir /workspace/junk.txt"],
  },
  "three-keys": {
    negativeCmd: "mv /workspace/code.js /workspace/src/code.js",
    steps: [
      "cp /workspace/code.js /workspace/src/code.js",
      "cp /workspace/style.css /workspace/styles/style.css",
    ],
  },
  "decoy-protocol": {
    negativeCmd: "touch /workspace/confirmation.txt",
    steps: [
      "grep /workspace/target_omega.txt",
      "ls /workspace/confirmation.txt",
    ],
  },
  "broken-chain": {
    negativeCmd: "mkdir /workspace/vault",
    steps: [
      "cd /workspace/vault",
      "cp /workspace/data.bin /workspace/vault/data.bin",
    ],
  },
  "recursive-vault": {
    negativeCmd: "mkdir /workspace/secure",
    steps: [
      "grep /workspace/secure",
      "cp /workspace/key.dat /workspace/secure/key.dat",
    ],
  },
  "final-convergence": {
    negativeCmd: "mkdir /workspace/production",
    steps: [
      "cd /workspace/production",
      "cp /workspace/artifact.dat /workspace/production/artifact.dat",
      "mv /workspace/old_cache.tmp",
    ],
  },
  ...ADDITIONAL_SOLUTIONS,
};

export function validateCatalogIntegrity(
  challenges: SeedChallengeDef[],
  solutions: Record<string, ChallengeSolution>,
): void {
  const slugs = new Set<string>();
  const orders = new Set<number>();

  for (const challenge of challenges) {
    if (slugs.has(challenge.slug))
      throw new Error(`Duplicate challenge slug: ${challenge.slug}`);
    if (orders.has(challenge.order))
      throw new Error(
        `Duplicate challenge order ${challenge.order}: ${challenge.slug}`,
      );
    slugs.add(challenge.slug);
    orders.add(challenge.order);
  }

  for (const challenge of challenges) {
    if (!solutions[challenge.slug])
      throw new Error(`Missing solution for challenge: ${challenge.slug}`);
  }

  for (const slug of Object.keys(solutions)) {
    if (!slugs.has(slug))
      throw new Error(`Solution has no matching challenge: ${slug}`);
  }
}
