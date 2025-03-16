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

      console.log("Deleting folders...");
      const deletedFolders = await tx.folder.deleteMany({});
      console.log(`Deleted ${deletedFolders.count} folders`);
    });

    console.log("*** Database flush completed successfully ***");
    return {
      success: true,
      message: "Database flushed successfully",
    };
  } catch (error) {
    console.error("Error flushing database:", error);
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
    throw new Error(`Failed to flush database: ${errorMessage}`);
  }
}
