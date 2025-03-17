import { PrismaClient } from "@prisma/client";
import { Logger } from "../../utils/logger/logger.utils";
import { importFromLocalGit } from "./importWithLocalGitOperations";
import {
  importFromWebhook,
  WebhookPayload,
} from "./importWithWebhookOperations";

// Create a singleton instance of PrismaClient to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Redirects to the appropriate import function based on the mode
 * @param {Object} options - Import options
 * @param {string} options.mode - 'local-git' for dev mode, 'webhook' for production mode
 * @param {string} options.localGitPath - Path to local Git repository (for dev mode)
 * @param {string} options.localGitBranch - Branch to use in local Git repository (for dev mode)
 * @param {string} options.wikiSubdir - Subdirectory within the repository that contains the wiki files
 * @param {Object} options.webhookPayload - GitHub/GitLab webhook payload (for production mode)
 * @returns {Promise<Object>} Object containing import statistics
 * @throws {Error} If there is an error importing the content
 */
export async function importVaultContent(options: {
  mode: "local-git" | "webhook";
  localGitPath?: string;
  localGitBranch?: string;
  wikiSubdir?: string;
  webhookPayload?: WebhookPayload;
}) {
  const logger = new Logger("import-api.log.txt");

  try {
    const { mode } = options;

    if (mode === "local-git") {
      // Local Mode
      // Imports content from a local Git repository
      return await importFromLocalGit(
        prisma,
        logger,
        options.localGitPath,
        options.localGitBranch,
        options.wikiSubdir
      );
    } else if (mode === "webhook") {
      // Production Mode
      // Imports content from a github webhook payload
      return await importFromWebhook(
        prisma,
        logger,
        options.webhookPayload,
        options.wikiSubdir
      );
    } else {
      throw new Error(`Invalid import mode: ${mode}`);
    }
  } catch (error) {
    logger.error("Error importing content:", error as Error);
    throw error;
  } finally {
    await prisma.$disconnect();
    logger.info("Disconnected from database.", "🔌");
    logger.close();
  }
}
