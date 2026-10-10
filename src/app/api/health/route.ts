import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "ShellShift Cipher Shell Engine",
      version: "1.0.0",
      database: "healthy",
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "degraded",
        timestamp: new Date().toISOString(),
        database: "unhealthy",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
