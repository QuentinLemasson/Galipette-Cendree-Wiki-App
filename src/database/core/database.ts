import { PrismaClient } from "@prisma/client";
import { prisma } from "./client";
import { Logger } from "@/utils/logger/logger.utils";

/**
 * @fileoverview Database - Core database management service
 *
 * @description
 * The Database class provides high-level abstractions for working with the database,
 * primarily focused on initialization, status, health checks, and migrations.
 *
 * This class serves as a centralized point for database operations that don't fit
 * into specific domain managers (like ArticleManager or ImportManager).
 *
 * @key_responsibilities
 * - Database connection management
 * - Health checks and status monitoring
 * - Database initialization and teardown
 * - Schema validation and maintenance
 *
 * @usage_example
 * ```typescript
 * const db = new Database();
 *
 * // Check if database is healthy
 * const isHealthy = await db.healthCheck();
 *
 * // Get database status
 * const status = await db.getDatabaseStatus();
 * ```
 *
 * @methods
 * - {@link DatabaseManager.getInstance} - Get singleton instance
 * - {@link DatabaseManager.flushDatabase} - Flush the database
 * - {@link DatabaseManager.flushArticles} - Flush all articles and related entities
 *
 * @note
 * This class uses the singleton Prisma client from client.ts and provides
 * higher-level abstractions for working with the database.
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

  /**
   * Flushes all articles from the database
   * @returns Object containing the result of the operation
   * @throws Error if there is an error flushing the articles
   */
  async flushArticles(): Promise<{
    success: boolean;
    message: string;
    stats?: {
      relations: number;
      articleTags: number;
      articles: number;
      folders: number;
      importMetadata: number;
    };
  }> {
    try {
      this.logger.info("Starting article flush operation...", "🗑️");

      const deletedRelations = await this.prisma.articleRelation.deleteMany({});
      const deletedArticleTags = await this.prisma.articleTag.deleteMany({});
      const deletedFolders = await this.prisma.folder.deleteMany({});
      const deletedImportMetadata = await this.prisma.importMetadata.deleteMany(
        {}
      );
      const deletedArticles = await this.prisma.article.deleteMany({});

      this.logger.success(`Article flush completed successfully:
        - ${deletedArticles.count} articles
        - ${deletedRelations.count} relations
        - ${deletedArticleTags.count} article tags
        - ${deletedFolders.count} folders
        - ${deletedImportMetadata.count} import metadata`);

      return {
        success: true,
        message: "Article flush completed successfully",
        stats: {
          articles: deletedArticles.count,
          relations: deletedRelations.count,
          articleTags: deletedArticleTags.count,
          folders: deletedFolders.count,
          importMetadata: deletedImportMetadata.count,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? `${error.name}: ${error.message}`
          : String(error);

      this.logger.error(
        `Failed to flush articles: ${errorMessage}`,
        error as Error
      );
      throw new Error(`Failed to flush articles: ${errorMessage}`);
    }
  }
}
