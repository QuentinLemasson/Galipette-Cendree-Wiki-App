import { Logger } from "@/utils/logger/logger.utils";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { ImportManager, LocalGitAdapter } from "../";

// Create a singleton instance of PrismaClient to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * @deprecated Use ImportManager with LocalGitAdapter instead.
 * This function will be removed in a future version.
 *
 * Imports changes from a git repository using a diff-based approach
 */
export const importVaultDiff = async () => {
  console.warn(
    "DEPRECATED: importVaultDiff() is deprecated. Use ImportManager with LocalGitAdapter instead."
  );

  const logger = new Logger("import-diff.log");
  const vaultPath = process.env.VAULT_PATH;
  const wikiDir = process.env.WIKI_DIRECTORY;

  // 1 - Check environment variables
  if (!vaultPath || !wikiDir) {
    throw new Error(
      "VAULT_PATH and WIKI_DIRECTORY environment variables must be set"
    );
  }

  // 2 - Get repository path
  const repoPath = path.join(vaultPath, wikiDir);

  try {
    // Use the new implementation
    const importManager = ImportManager.getInstance();
    importManager.setLogger(logger);

    const adapter = new LocalGitAdapter(repoPath, "main", wikiDir, logger);

    await importManager.import(adapter, {
      mode: "diff",
      sourceType: "local-git",
      localGitPath: repoPath,
      localGitBranch: "main",
      wikiSubdir: wikiDir,
    });

    logger.success("Diff import completed successfully");
  } catch (error) {
    logger.error("Error during diff import:", error as Error);
    throw error;
  } finally {
    await prisma.$disconnect();
    logger.info("Disconnected from database", "🔌");
    logger.close();
  }
};
