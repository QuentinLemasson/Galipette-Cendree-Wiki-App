import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client instance to prevent connection pool exhaustion
 */
const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

// Save in global variable in non-production environments to prevent connection pool exhaustion
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
