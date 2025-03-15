import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { collectMarkdownFiles } from "db/script-utils/markdown.utils";
import {
  insertArticles,
  insertRelations,
} from "db/script-utils/database.utils";
import { Logger } from "db/script-utils/logger.utils";

const execPromise = promisify(exec);

// Create a singleton instance of PrismaClient to avoid connection issues
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Imports markdown files from the vault directory into the database
 * @returns {Promise<Object>} Object containing import statistics
 * @throws {Error} If there is an error importing the vault content
 */
export async function importVaultContent() {
  const logger = new Logger("import-api.log.txt");

  try {
    logger.info(
      `Importing from ${process.env.VAULT_PATH}\\${process.env.WIKI_DIRECTORY} into database`,
      "🚀"
    );

    const articlesDirectory = `${process.env.VAULT_PATH}\\${process.env.WIKI_DIRECTORY}`;
    if (!articlesDirectory) {
      throw new Error("VAULT_PATH environment variable is not set");
    }

    // Collect all markdown files from the specified vault directory
    const markdownFiles = collectMarkdownFiles(articlesDirectory);
    logger.info(
      `Found ${markdownFiles.length} Markdown files. Starting import...`,
      "📁"
    );

    let articlesImported = 0;
    let relationsCreated = 0;

    // Process articles and relations within a transaction
    await prisma.$transaction(async tx => {
      // Insert articles and get the map of articles
      const articlesMap = await insertArticles(
        tx as PrismaClient,
        markdownFiles,
        articlesDirectory,
        logger
      );

      articlesImported = articlesMap.size;

      // Insert relations
      const relations = await insertRelations(
        tx as PrismaClient,
        articlesMap,
        logger
      );
      relationsCreated = typeof relations === "number" ? relations : 0;
    });

    logger.success("Import completed successfully.");

    return {
      success: true,
      message: "Import completed successfully",
      stats: {
        articlesImported,
        relationsCreated,
      },
    };
  } catch (error) {
    logger.error("Error importing vault:", error as Error);
    throw error;
  } finally {
    await prisma.$disconnect();
    logger.info("Disconnected from database.", "🔌");
    logger.close();
  }
}

/**
 * Resets the database schema
 * @returns {Promise<Object>} Object containing the result of the operation
 * @throws {Error} If there is an error resetting the database schema
 */
export async function resetDatabaseSchema() {
  try {
    const schemaPath = path.resolve(process.cwd(), "db/reset_schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    // Execute the SQL script using the correct environment variable
    const { stderr } = await execPromise(
      `psql -d ${process.env.DB_URL} -c "${schemaSQL.replace(/"/g, '\\"')}"`
    );

    if (stderr) {
      console.error("Error executing SQL script:", stderr);
      throw new Error(stderr);
    }

    return {
      success: true,
      message: "Database schema reset successfully",
    };
  } catch (error) {
    console.error("Error resetting database schema:", error);
    throw error;
  }
}

/**
 * Flushes all data from the database using Prisma
 * @returns {Promise<Object>} Object containing the result of the operation
 * @throws {Error} If there is an error flushing the database
 */
export async function flushDatabase() {
  try {
    console.log("Starting database flush operation...");

    // Enable more detailed logging for debugging purposes
    console.log("Database URL:", process.env.DB_URL ? "Configured" : "Missing");

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async tx => {
      console.log("Deleting article relations...");
      const deletedRelations = await tx.articleRelation.deleteMany({});
      console.log(`Deleted ${deletedRelations.count} article relations`);

      console.log("Deleting article tags...");
      const deletedArticleTags = await tx.articleTag.deleteMany({});
      console.log(`Deleted ${deletedArticleTags.count} article tags`);

      console.log("Deleting tags...");
      const deletedTags = await tx.tag.deleteMany({});
      console.log(`Deleted ${deletedTags.count} tags`);

      console.log("Deleting articles...");
      const deletedArticles = await tx.article.deleteMany({});
      console.log(`Deleted ${deletedArticles.count} articles`);

      //** For folders, we need to handle the hierarchy constraint */
      console.log("Deleting folders in hierarchical order...");

      // First, find all folders with their hierarchy information
      const allFolders = await tx.folder.findMany({
        select: {
          id: true,
          parentId: true,
        },
      });

      // Group folders by their level in the hierarchy
      const foldersByLevel = new Map<number, number[]>();

      // Helper function to determine folder level
      const determineFolderLevel = (
        folderId: number,
        visited = new Set<number>()
      ): number => {
        // Prevent infinite loops from circular references
        if (visited.has(folderId)) return 0;
        visited.add(folderId);

        const folder = allFolders.find(f => f.id === folderId);
        if (!folder || folder.parentId === null) return 0;

        return 1 + determineFolderLevel(folder.parentId, visited);
      };

      // Determine level for each folder
      allFolders.forEach(folder => {
        const level = determineFolderLevel(folder.id);
        if (!foldersByLevel.has(level)) {
          foldersByLevel.set(level, []);
        }
        foldersByLevel.get(level)?.push(folder.id);
      });

      // Delete folders level by level, starting from the deepest level
      const levels = Array.from(foldersByLevel.keys()).sort((a, b) => b - a); // Sort in descending order

      for (const level of levels) {
        const folderIds = foldersByLevel.get(level) || [];
        if (folderIds.length > 0) {
          console.log(
            `Deleting ${folderIds.length} folders at level ${level}...`
          );
          await tx.folder.deleteMany({
            where: {
              id: {
                in: folderIds,
              },
            },
          });
        }
      }

      // Delete any remaining folders (should be root folders)
      console.log("Deleting any remaining root folders...");
      const deletedRootFolders = await tx.folder.deleteMany({
        where: {
          parentId: null,
        },
      });
      console.log(`Deleted ${deletedRootFolders.count} root folders`);
      //** End of folders handling */
    });

    console.log("Database flush completed successfully");
    return {
      success: true,
      message: "Database flushed successfully",
    };
  } catch (error) {
    console.error("Error flushing database:", error);

    // Provide more detailed error information
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);

    throw new Error(`Failed to flush database: ${errorMessage}`);
  } finally {
    await prisma.$disconnect();
    console.log("Prisma client disconnected");
  }
}
