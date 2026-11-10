import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Returns true if a valid, reachable database connection string is configured.
 * In Vercel serverless runtime, localhost / 127.0.0.1 is unreachable and will be skipped.
 */
export function isDatabaseConfigured(): boolean {
  const url = process.env.DATABASE_URL;
  if (!url || url.trim() === "") return false;
  // Must be a valid PostgreSQL connection string (not an HTTPS web URL)
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    return false;
  }
  if (process.env.VERCEL === "1" && (url.includes("localhost") || url.includes("127.0.0.1"))) {
    return false;
  }
  return true;
}

export default prisma;

