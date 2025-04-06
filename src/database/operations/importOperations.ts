import { PrismaClient } from "@prisma/client";
import { Logger } from "../../utils/logger/logger.utils";
import { ImportManager, LocalGitAdapter, WebhookAdapter } from "../";
import { WebhookPayload } from "./importWithWebhookOperations";

// Create a singleton instance of PrismaClient to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * @deprecated Use ImportManager and adapters directly instead.
 * This function will be removed in a future version.
 *
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
  console.warn(
    "DEPRECATED: importVaultContent() is deprecated. Use ImportManager and adapters directly instead."
  );

  const logger = new Logger("import-api.log.txt");
  const importManager = ImportManager.getInstance();
  importManager.setLogger(logger);

  try {
    const { mode } = options;

    // Use the new implementation
    if (mode === "local-git") {
      // Local Git Mode
      if (!options.localGitPath) {
        throw new Error("localGitPath is required for local-git mode");
      }

      const adapter = new LocalGitAdapter(
        options.localGitPath,
        options.localGitBranch || "main",
        options.wikiSubdir || "",
        logger
      );

      const result = await importManager.import(adapter, {
        mode: "full", // Always do full import for backward compatibility
        sourceType: "local-git",
        localGitPath: options.localGitPath,
        localGitBranch: options.localGitBranch,
        wikiSubdir: options.wikiSubdir,
      });

      return {
        success: result.success,
        message: result.message,
        stats: result.stats,
      };
    } else if (mode === "webhook") {
      // Webhook Mode
      if (!options.webhookPayload) {
        throw new Error("webhookPayload is required for webhook mode");
      }

      const adapter = new WebhookAdapter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        options.webhookPayload as any,
        options.wikiSubdir || "",
        null,
        logger
      );

      const result = await importManager.import(adapter, {
        mode: "diff", // Use diff for webhooks as they usually contain changes
        sourceType: "webhook",
        wikiSubdir: options.wikiSubdir,
        // webhookPayload: options.webhookPayload,
      });

      return {
        success: result.success,
        message: result.message,
        stats: result.stats,
      };
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
