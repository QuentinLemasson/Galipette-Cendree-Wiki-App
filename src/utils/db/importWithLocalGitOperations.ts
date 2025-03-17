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
 * Imports markdown files from a local Git repository
 * @param {Logger} logger - Logger instance
 * @param {string} localGitPath - Path to local Git repository
 * @param {string} branch - Branch to use
 * @param {string} wikiSubdir - Subdirectory within the repository that contains the wiki files
 * @returns {Promise<Object>} Import statistics
 */
export async function importFromLocalGit(
  prisma: PrismaClient,
  logger: Logger,
  localGitPath?: string,
  branch?: string,
  wikiSubdir?: string
) {
  // Use provided values or fall back to environment variables
  const gitPath = localGitPath || process.env.LOCAL_GIT_PATH;
  const gitBranch = branch || process.env.GIT_BRANCH || "main";
  const gitWikiSubdir = wikiSubdir || process.env.WIKI_DIRECTORY || "";

  if (!gitPath) {
    throw new Error(
      "Local Git path is not provided and LOCAL_GIT_PATH environment variable is not set"
    );
  }

  logger.info(
    `Importing from local Git repository: ${gitPath} (branch: ${gitBranch}, subdir: ${gitWikiSubdir || "root"})`,
    "🚀"
  );

  // Ensure the repository exists
  if (!fs.existsSync(path.join(gitPath, ".git"))) {
    throw new Error(`No Git repository found at ${gitPath}`);
  }

  // Check out the specified branch
  try {
    await execPromise(`git -C "${gitPath}" checkout ${gitBranch}`);
    logger.info(`Checked out branch: ${gitBranch}`, "🔄");

    // Check if remote is configured
    const hasRemote = await execPromise(`git -C "${gitPath}" remote`).then(
      ({ stdout }) => stdout.trim().length > 0,
      () => false
    );

    if (hasRemote) {
      // Only check remote if we have a remote configured
      const remoteExists = await execPromise(
        `git -C "${gitPath}" ls-remote --heads origin ${gitBranch}`
      ).then(
        ({ stdout }) => stdout.trim().length > 0,
        () => false
      );

      if (remoteExists) {
        // Pull latest changes only if remote branch exists
        await execPromise(`git -C "${gitPath}" pull origin ${gitBranch}`);
        logger.info(`Pulled latest changes from origin/${gitBranch}`, "⬇️");
      } else {
        logger.info(
          `No remote branch ${gitBranch} found, using local branch`,
          "ℹ️"
        );
      }
    } else {
      logger.info(`No remote configured, using local branch only`, "ℹ️");
    }
  } catch (error) {
    logger.error(`Error updating local Git repository:`, error as Error);
    throw error;
  }

  // Get the wiki directory within the repository
  const wikiDir = path.join(gitPath, gitWikiSubdir);
  if (!fs.existsSync(wikiDir)) {
    throw new Error(`Wiki directory not found at ${wikiDir}`);
  }

  logger.info(`Using wiki directory: ${wikiDir}`, "📁");

  // Collect all markdown files from the specified wiki directory
  const markdownFiles = collectMarkdownFiles(wikiDir);
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
      wikiDir,
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
}
