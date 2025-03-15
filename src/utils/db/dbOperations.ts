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

/**
 * Imports markdown files from the vault directory into the database
 * @returns {Promise<Object>} Object containing import statistics
 * @throws {Error} If there is an error importing the vault content
 */
export async function importVaultContent() {
  const prisma = new PrismaClient({
    log: ["warn", "error"],
  });

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

    // Execute the SQL script
    const { stderr } = await execPromise(
      `psql -d ${process.env.DATABASE_URL} -c "${schemaSQL.replace(/"/g, '\\"')}"`
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
 * Flushes all data from the database
 * @returns {Promise<Object>} Object containing the result of the operation
 * @throws {Error} If there is an error flushing the database
 */
export async function flushDatabase() {
  try {
    const flushPath = path.resolve(process.cwd(), "db/flush_db.sql");
    const flushSQL = fs.readFileSync(flushPath, "utf8");

    // Execute the SQL script
    const { stderr } = await execPromise(
      `psql -d ${process.env.DATABASE_URL} -c "${flushSQL.replace(/"/g, '\\"')}"`
    );

    if (stderr) {
      console.error("Error executing SQL script:", stderr);
      throw new Error(stderr);
    }

    return {
      success: true,
      message: "Database flushed successfully",
    };
  } catch (error) {
    console.error("Error flushing database:", error);
    throw error;
  }
}
