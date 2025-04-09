import { PrismaClient } from "@prisma/client";

/**
 * @fileoverview Prisma Client Singleton
 *
 * @description
 * This module exports a singleton instance of the Prisma client to be used
 * throughout the application. Using a single instance prevents connection
 * pool exhaustion that would occur if multiple clients were created.
 *
 * @key_responsibilities
 * - Log queries in development environment
 * - Handle connection pooling automatically
 * - Provide type-safe database access
 *
 * @usage_example
 * ```typescript
 * import { prisma } from 'src/database/core/client';
 *
 * // Use the client in your code
 * const articles = await prisma.article.findMany({
 *   where: { title: { contains: 'wiki' } }
 * });
 * ```
 *
 * @note
 * Never instantiate PrismaClient directly in your code.
 * Always import this singleton instance to prevent connection issues.
 */

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
