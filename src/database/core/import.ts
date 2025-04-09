import {
  PrismaClient,
  Article,
  Prisma,
  ImportStatus,
  GitImportLog,
} from "@prisma/client";
import { prisma } from "./client";
import { Logger } from "@/utils/logger/logger.utils";
import { ArticleManager } from "./article";
import {
  ImportSource,
  ImportResult,
  ImportConfig,
  ImportFile,
} from "../types/import.types";
import path from "path";
import { createHash } from "crypto";

/**
 * @fileoverview ImportManager - Core import system for wiki content
 *
 * @description
 * The ImportManager is a singleton service responsible for importing content into the wiki system.
 * It handles various import sources (Git, filesystem, API) and tracks import history.
 *
 * @key_responsibilities
 * - Importing content from various sources
 * - Tracking import history and metadata
 * - Handling full and incremental (diff) imports
 * - Managing file hashing and change detection
 * - Coordinating article and relation creation/updates
 *
 * @usage_example
 * ```typescript
 * const importManager = ImportManager.getInstance();
 *
 * // Configure an import source
 * const gitSource = new GitImportSource({ repo: '...' });
 *
 * // Run an import
 * const result = await importManager.import(gitSource, {
 *   mode: 'diff',
 *   sourceType: 'git'
 * });
 * ```
 *
 * @methods
 * - {@link ImportManager.getInstance} - Get singleton instance
 * - {@link ImportManager.import} - Run a content import operation
 * - {@link ImportManager.runFullImport} - Perform a complete import (all files)
 * - {@link ImportManager.runDiffImport} - Perform an incremental import (changed files only)
 * - {@link ImportManager.processFiles} - Process a batch of files into articles
 * - {@link ImportManager.updateImportMetadata} - Track file import metadata
 * - {@link ImportManager.logImport} - Log import operations
 * - {@link ImportManager.getLastImport} - Retrieve the most recent import
 *
 * @note
 * The import system uses transactions to ensure database consistency and maintains
 * a comprehensive history of all import operations for audit and recovery purposes.
 */

/**
 * Calculate a hash for content
 */
function calculateFileHash(content: string): string {
  return createHash("md5").update(content).digest("hex");
}

/**
 * Core import manager to handle all import operations
 */
export class ImportManager {
  private static _instance: ImportManager;
  private prisma: PrismaClient;
  private articleManager: ArticleManager;
  private logger: Logger;

  /**
   * Get singleton instance
   */
  public static getInstance(): ImportManager {
    if (!ImportManager._instance) {
      ImportManager._instance = new ImportManager();
    }
    return ImportManager._instance;
  }

  private constructor() {
    this.prisma = prisma;
    this.articleManager = ArticleManager.getInstance();
    this.logger = new Logger("import.log");
  }

  /**
   * Set a custom logger
   */
  setLogger(logger: Logger): void {
    this.logger = logger;
  }

  /**
   * Run an import operation with the specified source
   */
  async import(
    source: ImportSource,
    config: ImportConfig
  ): Promise<ImportResult> {
    try {
      this.logger.info(
        `Starting ${config.mode} import from ${config.sourceType}`,
        "🚀"
      );

      // Get current import metadata
      const importMetadata = await source.getMetadata();

      this.logger.info(
        `Gathered metadata: ${JSON.stringify(importMetadata)}`,
        "🔍"
      );

      // Track statistics
      let articlesImported = 0;
      let relationsCreated = 0;
      let filesDeleted = 0;

      // Run appropriate import method based on mode
      if (config.mode === "full" && process.env.NODE_ENV !== "production") {
        this.logger.info("Running full import", "🌐");
        const result = await this.runFullImport(source);
        articlesImported = result.articlesCount;
        relationsCreated = result.relationsCount;
      } else {
        this.logger.info("Running diff import", "🌐");
        const result = await this.runDiffImport(source);
        articlesImported = result.articlesCount;
        relationsCreated = result.relationsCount;
        filesDeleted = result.deletedCount;
      }

      // Log import success
      await this.logImport(
        importMetadata.commitHash,
        articlesImported + filesDeleted,
        "success",
        null,
        { importType: config.mode, sourceType: config.sourceType }
      );

      this.logger.success(
        `Import completed successfully: ${articlesImported} articles, ${relationsCreated} relations, ${filesDeleted} deleted`
      );

      return {
        success: true,
        message: "Import completed successfully",
        stats: {
          articlesImported,
          relationsCreated,
          filesDeleted,
        },
        metadata: importMetadata,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const importMetadata = await source.getMetadata();

      // Log import failure
      await this.logImport(
        importMetadata.commitHash,
        0,
        "error",
        errorMessage,
        { importType: config.mode, sourceType: config.sourceType }
      );

      this.logger.error(`Import failed: ${errorMessage}`, error as Error);

      return {
        success: false,
        message: `Import failed: ${errorMessage}`,
        stats: {
          articlesImported: 0,
          relationsCreated: 0,
          filesDeleted: 0,
        },
        metadata: importMetadata,
      };
    }
  }

  /**
   * Process a full import - all files from source
   */
  private async runFullImport(source: ImportSource): Promise<{
    articlesCount: number;
    relationsCount: number;
  }> {
    const files = await source.getFiles();
    this.logger.info(`Processing ${files.length} files for full import`, "📊");

    // Use transaction for consistency
    const result = await this.prisma.$transaction(async () => {
      // Process all files
      const articlesMap = await this.processFiles(files);

      // Create relations
      const relationsCount = await this.articleManager.createRelations(
        articlesMap,
        this.logger
      );

      return {
        articlesCount: articlesMap.size,
        relationsCount,
      };
    });

    return result;
  }

  /**
   * Process a diff import - only changed files
   */
  private async runDiffImport(source: ImportSource): Promise<{
    articlesCount: number;
    relationsCount: number;
    deletedCount: number;
  }> {
    // Get changed files
    const changedFiles = await source.getChangedFiles();
    const files = await source.getFiles();

    // Filter files to only include added/modified files
    const filesToProcess = files.filter(file => {
      const relativePath = this.articleManager.formatArticlePath(file.path, "");
      return (
        changedFiles.added.includes(relativePath) ||
        changedFiles.modified.includes(relativePath)
      );
    });

    this.logger.info(
      `Processing diff with ${changedFiles.added.length} added, ${changedFiles.modified.length} modified, ${changedFiles.deleted.length} deleted`,
      "📊"
    );

    // Use transaction for consistency
    const result = await this.prisma.$transaction(async () => {
      // Process added/modified files
      const articlesMap = await this.processFiles(filesToProcess);

      // Handle deleted files
      let deletedCount = 0;
      for (const deletedPath of changedFiles.deleted) {
        try {
          await this.articleManager.deleteArticle(deletedPath);
          deletedCount++;
          this.logger.info(`Deleted article: ${deletedPath}`, "🗑️");
        } catch (error) {
          this.logger.warn(`Failed to delete ${deletedPath}: ${error}`);
        }
      }

      // Create relations
      const relationsCount = await this.articleManager.createRelations(
        articlesMap,
        this.logger
      );

      return {
        articlesCount: articlesMap.size,
        relationsCount,
        deletedCount,
      };
    });

    return result;
  }

  /**
   * Process a batch of files and insert/update them in the database
   */
  private async processFiles(
    files: ImportFile[]
  ): Promise<Map<string, Article>> {
    const articlesMap = new Map<string, Article>();
    const vaultPath =
      (process.env.VAULT_PATH || "") + "/" + (process.env.WIKI_DIRECTORY || "");

    this.logger.section("Start hierarchy processing - vaultPath: " + vaultPath);

    for (const file of files) {
      try {
        // Format the path
        const formattedPath = this.articleManager.formatArticlePath(
          file.path,
          vaultPath
        );

        this.logger.info(`Processing article -> ${formattedPath}`);

        // Derive title from filename
        const fileName = path.basename(file.path);
        const title =
          fileName === "index.md"
            ? path.basename(path.dirname(file.path))
            : path.basename(file.path, ".md");

        // Get folder path
        const folderPath = path.dirname(formattedPath);
        const folderId = await this.articleManager.getOrCreateFolderHierarchy(
          folderPath,
          this.logger
        );

        // Insert article
        const article = await this.articleManager.upsertArticle(
          title,
          file.content,
          formattedPath,
          file.metadata,
          folderId
        );

        // Update import metadata
        await this.updateImportMetadata(
          formattedPath,
          calculateFileHash(file.content),
          file.metadata.commitHash
        );

        articlesMap.set(formattedPath, article);
        this.logger.success(`Processed article: ${title}`);
      } catch (error) {
        this.logger.error(
          `Error processing file ${file.path}:`,
          error as Error
        );
      }
    }

    return articlesMap;
  }

  /**
   * Log an import operation
   */
  private async logImport(
    commitHash: string,
    filesCount: number,
    status: string,
    error: string | null = null,
    metadata: Record<string, unknown> = {}
  ): Promise<void> {
    this.logger.info("Logging import info", "🔍");

    // Convert string status to enum
    const importStatus =
      status === "success"
        ? ImportStatus.SUCCESS
        : status === "error"
          ? ImportStatus.FAILED
          : ImportStatus.PARTIAL;

    // Determine file counts based on metadata
    const filesAdded = (metadata.filesAdded as number) || 0;
    const filesDeleted = (metadata.filesDeleted as number) || 0;
    const filesModified = (metadata.filesModified as number) || 0;

    await this.prisma.gitImportLog.create({
      data: {
        commitHash,
        status: importStatus,
        error,
        filesAdded,
        filesDeleted,
        filesModified,
        foldersAdded: 0,
        foldersDeleted: 0,
        tagsAdded: 0,
        tagsDeleted: 0,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });
    this.logger.success("Import info logged successfully");
  }

  /**
   * Update import metadata for a file
   */
  private async updateImportMetadata(
    filePath: string,
    fileHash: string,
    commitHash: string
  ): Promise<void> {
    // First, find the article by path to get its ID
    // TODO : ensure it works in the case of the newly added (created) article
    const article = await this.prisma.article.findUnique({
      where: { path: filePath },
      select: { id: true },
    });

    if (!article) {
      this.logger.warn(
        `Cannot update import metadata: No article found for path ${filePath}`
      );
      return;
    }

    await this.prisma.importMetadata.upsert({
      where: {
        articleId: article.id,
      },
      update: {
        commitHash,
        importCount: { increment: 1 },
      },
      create: {
        articleId: article.id,
        commitHash,
        importCount: 1,
      },
    });
  }

  /**
   * Get the last import record
   */
  async getLastImport(): Promise<GitImportLog | null> {
    try {
      const lastImport = await this.prisma.gitImportLog.findFirst({
        orderBy: {
          importedAt: "desc",
        },
      });

      return lastImport;
    } catch (error) {
      this.logger.error("Error getting last import:", error as Error);
      return null;
    }
  }
}
