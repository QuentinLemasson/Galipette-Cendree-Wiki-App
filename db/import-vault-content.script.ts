import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
import { collectMarkdownFiles } from "./script-utils/markdown.utils.ts";
import {
  createIndexes,
  insertArticles,
  insertRelations,
} from "./script-utils/database.utils.ts";
import { Logger } from "./script-utils/logger.utils.ts";

/**
 * Import Vault Content Script
 *
 * This script imports markdown files from a specified vault directory into a PostgreSQL database.
 * It handles the following tasks:
 * 1. Connects to the PostgreSQL database using environment variables
 * 2. Collects all markdown files from the specified vault directory
 * 3. Extracts metadata and content from each markdown file
 * 4. Creates necessary database indexes for optimization
 * 5. Inserts or updates articles in the database
 *
 * Environment Variables Required:
 * - VAULT_PATH: Path to the vault directory containing markdown files
 * - DB_USER: PostgreSQL username
 * - DB_HOST: PostgreSQL host
 * - DB_DATABASE: PostgreSQL database name
 * - DB_PASSWORD: PostgreSQL password
 * - DB_PORT: PostgreSQL port
 *
 * Usage:
 * 1. Ensure .env.local file exists with required variables
 * 2. Run: npm run import-vault
 *
 * Note: This script uses transactions to ensure data consistency.
 * If an error occurs during import, all changes will be rolled back.
 */

dotenv.config({ path: ".env.local" });

const main = async () => {
  const logger = new Logger("import.log.txt");

  logger.info(
    `Importing from ${process.env.VAULT_PATH} into ${process.env.DB_DATABASE} on ${process.env.DB_HOST}`,
    "🚀"
  );

  // Create a new PostgreSQL client
  const client = new Client({
    user: process.env.LOCAL_DB_USER,
    password: process.env.LOCAL_DB_PASSWORD,
    host: process.env.LOCAL_DB_HOST,
    database: process.env.LOCAL_DB_DATABASE,
    port: parseInt(process.env.LOCAL_DB_PORT || "5432"),
  });

  try {
    await client.connect();
    logger.info("Connected to PostgreSQL database.", "🔗");

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

    // Start a transaction
    await client.query("BEGIN");

    // Create indexes
    await createIndexes(client, logger);

    // Insert articles
    const articlesMap = await insertArticles(
      client,
      markdownFiles,
      articlesDirectory,
      logger
    );

    // Insert relations
    await insertRelations(client, articlesMap, logger);

    // Commit the transaction
    await client.query("COMMIT");

    logger.success("Import completed successfully.");
  } catch (error) {
    logger.error("Error importing vault:", error as Error);
    try {
      await client.query("ROLLBACK");
      logger.info("Transaction rolled back due to errors.", "🔄");
    } catch (rollbackError) {
      logger.error("Error during rollback:", rollbackError as Error);
    }
  } finally {
    await client.end();
    logger.info("Disconnected from PostgreSQL database.", "🔌");
    logger.close();
  }
};

main();
