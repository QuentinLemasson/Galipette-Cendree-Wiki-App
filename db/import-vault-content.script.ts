import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
import { collectMarkdownFiles } from "./script-utils/markdown.utils.ts";
import {
  createIndexes,
  insertArticles,
  insertRelations,
} from "./script-utils/database.utils.ts";

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
  console.log(
    `🚀 Importing from ${process.env.VAULT_PATH} into ${process.env.DB_DATABASE} on ${process.env.DB_HOST}`
  );

  // Create a new PostgreSQL client
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  });

  try {
    await client.connect();
    console.log("🔗 Connected to PostgreSQL database.");

    const articlesDirectory = process.env.VAULT_PATH;
    if (!articlesDirectory) {
      throw new Error("VAULT_PATH environment variable is not set");
    }

    // Collect all markdown files from the specified vault directory
    const markdownFiles = collectMarkdownFiles(articlesDirectory);
    console.log(
      `📁 Found ${markdownFiles.length} Markdown files. Starting import...`
    );

    // Start a transaction
    await client.query("BEGIN");

    // Create indexes
    await createIndexes(client);

    // Insert articles
    const articlesMap = await insertArticles(
      client,
      markdownFiles,
      articlesDirectory
    );

    // Insert relations
    await insertRelations(client, articlesMap);

    // Commit the transaction
    await client.query("COMMIT");

    console.log("✅ Import completed successfully.");
  } catch (error) {
    console.error("❌ Error importing vault:", error);
    try {
      await client.query("ROLLBACK");
      console.log("🔄 Transaction rolled back due to errors.");
    } catch (rollbackError) {
      console.error("❌ Error during rollback:", rollbackError);
    }
  } finally {
    await client.end();
    console.log("🔌 Disconnected from PostgreSQL database.");
  }
};

main();
