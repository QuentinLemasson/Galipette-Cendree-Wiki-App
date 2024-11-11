import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { collectMarkdownFiles } from "./script-utils/markdown.utils.ts";
import {
  insertArticles,
  insertRelations,
} from "./script-utils/database.utils.ts";
import { Logger } from "./script-utils/logger.utils.ts";

dotenv.config({ path: ".env.local" });

const prisma = new PrismaClient({
  log: ["warn", "error"],
});

/**
 * Import Vault Content Script
 *
 * This script imports markdown files from a specified vault directory into a PostgreSQL database.
 * It uses Prisma ORM for database operations and handles:
 * 1. Collecting markdown files from the vault
 * 2. Creating folder structures
 * 3. Importing articles with metadata
 * 4. Creating relations between articles
 */

const main = async () => {
  const logger = new Logger("import.log.txt");

  logger.info(`Importing from ${process.env.VAULT_PATH} into database`, "🚀");

  try {
    const articlesDirectory = process.env.VAULT_PATH;
    if (!articlesDirectory) {
      throw new Error("VAULT_PATH environment variable is not set");
    }

    // Collect all markdown files from the specified vault directory
    const markdownFiles = collectMarkdownFiles(articlesDirectory);
    logger.info(
      `Found ${markdownFiles.length} Markdown files. Starting import...`,
      "📁"
    );

    // Process articles and relations within a transaction
    await prisma.$transaction(async tx => {
      // Insert articles and get the map of articles
      const articlesMap = await insertArticles(
        tx as PrismaClient,
        markdownFiles,
        articlesDirectory,
        logger
      );

      // Insert relations
      await insertRelations(tx as PrismaClient, articlesMap, logger);
    });

    logger.success("Import completed successfully.");
  } catch (error) {
    logger.error("Error importing vault:", error as Error);
  } finally {
    await prisma.$disconnect();
    logger.info("Disconnected from database.", "🔌");
    logger.close();
  }
};

main();
