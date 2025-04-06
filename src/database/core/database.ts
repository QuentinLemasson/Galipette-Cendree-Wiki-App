import { PrismaClient } from "@prisma/client";
import { prisma } from "./client";
import { Logger } from "@/utils/logger/logger.utils";

/**
 * Database manager to handle general database operations
 */
export class DatabaseManager {
  private static _instance: DatabaseManager;
  private prisma: PrismaClient;
  private logger: Logger;

  /**
   * Get singleton instance
   */
  public static getInstance(): DatabaseManager {
    if (!DatabaseManager._instance) {
      DatabaseManager._instance = new DatabaseManager();
    }
    return DatabaseManager._instance;
  }

  private constructor() {
    this.prisma = prisma;
    this.logger = new Logger("database.log");
  }

  /**
   * Set a custom logger
   */
  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  /**
   * Flushes all data from the database
   * @returns Object containing the result of the operation
   * @throws Error if there is an error flushing the database
   */
  async flushDatabase(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      relations: number;
      articleTags: number;
      tags: number;
      articles: number;
      folders: number;
      importMetadata: number;
      importLogs: number;
    };
  }> {
    try {
      this.logger.info("Starting database flush operation...", "🗑️");

      // Use a transaction to ensure all operations succeed or fail together
      const stats = await this.prisma.$transaction(async tx => {
        this.logger.info("Deleting article relations...");
        const deletedRelations = await tx.articleRelation.deleteMany({});

        this.logger.info("Deleting article tags...");
        const deletedArticleTags = await tx.articleTag.deleteMany({});

        this.logger.info("Deleting tags...");
        const deletedTags = await tx.tag.deleteMany({});

        this.logger.info("Deleting articles...");
        const deletedArticles = await tx.article.deleteMany({});

        this.logger.info("Deleting folders...");
        const deletedFolders = await tx.folder.deleteMany({});

        this.logger.info("Deleting import metadata...");
        const deletedImportMetadata = await tx.importMetadata.deleteMany({});

        this.logger.info("Deleting import logs...");
        const deletedImportLogs = await tx.gitImportLog.deleteMany({});

        return {
          relations: deletedRelations.count,
          articleTags: deletedArticleTags.count,
          tags: deletedTags.count,
          articles: deletedArticles.count,
          folders: deletedFolders.count,
          importMetadata: deletedImportMetadata.count,
          importLogs: deletedImportLogs.count,
        };
      });

      this.logger.success(`Database flush completed successfully:
        - ${stats.relations} article relations
        - ${stats.articleTags} article tags
        - ${stats.tags} tags
        - ${stats.articles} articles
        - ${stats.folders} folders
        - ${stats.importMetadata} import metadata
        - ${stats.importLogs} import logs`);

      return {
        success: true,
        message: "Database flushed successfully",
        stats,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);

      this.logger.error(
        `Failed to flush database: ${errorMessage}`,
        error as Error
      );
      throw new Error(`Failed to flush database: ${errorMessage}`);
    }
  }
}
