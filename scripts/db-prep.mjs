import { execSync } from "child_process";

try {
  process.loadEnvFile?.();
} catch {}

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.log("[db-prep] No database URL found. Skipping auto-sync.");
  process.exit(0);
}

console.log("[db-prep] Database URL detected. Synchronizing Prisma schema...");

try {
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("[db-prep] Schema synchronized. Seeding initial competition & challenges...");
  execSync("npx tsx prisma/seed.ts", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: databaseUrl },
  });

  console.log("[db-prep] Database ready!");
} catch (error) {
  console.error("[db-prep] Notice: DB auto-prep could not complete:", error?.message || error);
}
