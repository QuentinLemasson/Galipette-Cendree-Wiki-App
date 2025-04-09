import { execSync } from "child_process";
import { ImportStatus, PrismaClient } from "@prisma/client";
import path from "path";
import {
  GitDiffResult,
  GitFileStatus,
  GitImportMetadata,
} from "../types/git-diff.types";
import { prisma } from "../operations/importOperations";
import { Logger } from "@/utils/logger/logger.utils";
import { formatArticlePath } from "./markdown.utils";
import { insertArticles, insertRelations } from "./database.utils";

/**
 * @fileoverview Git integration utilities for tracking and importing content changes
 *
 * @description
 * This file provides utilities for tracking changes in Git repositories and
 * importing those changes into the database. It handles the detection of
 * modified, added, and deleted files, and processes them accordingly.
 * The functions support both full and incremental imports, with proper
 * tracking of import history and metadata.
 *
 * @methods
 * - {@link getLastImportedCommit} - Gets the last imported commit hash
 * - {@link getCurrentCommitHash} - Gets the current commit hash of the repository
 * - {@link getChangedFiles} - Gets changed files between commits
 * - {@link logGitImport} - Logs import operations
 * - {@link updateImportMetadata} - Updates import metadata for articles
 * - {@link shouldProcessFile} - Checks if a file should be processed
 * - {@link processMarkdownFile} - Processes a single markdown file
 * - {@link deleteArticle} - Deletes an article and its related data
 *
 * @notes
 * - Supports tracking of file additions, modifications, and deletions
 * - Maintains import history with detailed statistics
 * - Uses transactions to ensure data consistency
 * - Handles both local Git repositories and webhook-based imports
 * - Properly manages article content in the separate ArticleContent table
 */

/**
 * Get the last imported commit hash from the database
 * @param prisma - Prisma client instance
 * @returns Last imported commit hash or null if no successful imports exist
 */
export async function getLastImportedCommit(
  prisma: PrismaClient
): Promise<string | null> {
  const lastImport = await prisma.gitImportLog.findFirst({
    where: {
      status: "SUCCESS",
    },
    orderBy: {
      importedAt: "desc",
    },
  });
  return lastImport?.commitHash || null;
}

/**
 * Get the current commit hash of the repository
 * @param repoPath - Path to the repository
 * @returns Current commit hash
 */
export function getCurrentCommitHash(repoPath: string): string {
  try {
    return execSync("git rev-parse HEAD", { cwd: repoPath }).toString().trim();
  } catch (error) {
    throw new Error(`Failed to get current commit hash: ${error}`);
  }
}

/**
 * Parse git status output to determine file changes
 * @param output - Git status output
 * @returns Array of file statuses
 */
function parseGitStatus(output: string): GitFileStatus[] {
  return output
    .split("\n")
    .filter(Boolean)
    .map(line => {
      const [status, ...paths] = line.trim().split("\t");
      const fileStatus: GitFileStatus = { status: "modified" };

      switch (status[0]) {
        case "A":
          fileStatus.status = "added";
          fileStatus.newPath = paths[0];
          break;
        case "M":
          fileStatus.status = "modified";
          fileStatus.newPath = paths[0];
          break;
        case "D":
          fileStatus.status = "deleted";
          fileStatus.oldPath = paths[0];
          break;
        case "R":
          fileStatus.status = "renamed";
          fileStatus.oldPath = paths[0];
          fileStatus.newPath = paths[1];
          break;
      }

      return fileStatus;
    });
}

/**
 * Get the list of changed files between two commits
 * @param repoPath - Path to the repository
 * @param fromCommit - Starting commit hash
 * @param toCommit - Ending commit hash
 * @returns Object containing categorized file changes
 */
export function getChangedFiles(
  repoPath: string,
  fromCommit: string,
  toCommit: string
): GitDiffResult {
  try {
    const result: GitDiffResult = {
      added: [],
      modified: [],
      deleted: [],
      renamedFrom: {},
      renamedTo: {},
    };

    // Get status of changes between commits
    const gitCommand = `git diff --name-status ${fromCommit}..${toCommit}`;
    const output = execSync(gitCommand, { cwd: repoPath }).toString();
    const changes = parseGitStatus(output);

    // Categorize changes
    changes.forEach(change => {
      switch (change.status) {
        case "added":
          result.added.push(change.newPath!);
          break;
        case "modified":
          result.modified.push(change.newPath!);
          break;
        case "deleted":
          result.deleted.push(change.oldPath!);
          break;
        case "renamed":
          result.renamedFrom[change.oldPath!] = change.newPath!;
          result.renamedTo[change.newPath!] = change.oldPath!;
          break;
      }
    });

    return result;
  } catch (error) {
    throw new Error(`Failed to get changed files: ${error}`);
  }
}

/**
 * Log an import operation in the database
 * @param prisma - Prisma client instance
 * @param commitHash - Commit hash
 * @param filesChanged - Number of files changed
 * @param status - Import status
 * @param error - Error message
 * @param metadata - Import metadata
 */
export async function logGitImport(
  prisma: PrismaClient,
  commitHash: string,
  changes: {
    filesAdded: number;
    filesModified: number;
    filesDeleted: number;
    foldersAdded: number;
    foldersDeleted: number;
    tagsAdded: number;
    tagsDeleted: number;
  },
  status: ImportStatus = "SUCCESS",
  error: string | null = null,
  metadata: GitImportMetadata = {}
): Promise<void> {
  await prisma.gitImportLog.create({
    data: {
      commitHash,
      status,
      error,
      filesAdded: changes.filesAdded,
      filesModified: changes.filesModified,
      filesDeleted: changes.filesDeleted,
      foldersAdded: changes.foldersAdded,
      foldersDeleted: changes.foldersDeleted,
      tagsAdded: changes.tagsAdded,
      tagsDeleted: changes.tagsDeleted,
      metadata: JSON.stringify(metadata),
    },
  });
}

/**
 * Update import metadata for processed files
 * @param prisma - Prisma client instance
 * @param articleId - Article ID
 * @param commitHash - Commit hash
 */
export async function updateImportMetadata(
  prisma: PrismaClient,
  articleId: number,
  commitHash: string
): Promise<void> {
  await prisma.importMetadata.upsert({
    where: {
      articleId,
    },
    update: {
      commitHash,
      importCount: { increment: 1 },
    },
    create: {
      articleId,
      commitHash,
      importCount: 1,
    },
  });
}

/**
 * Check if a file should be processed based on its path and extension
 * @param filePath - File path
 * @returns True if the file should be processed, false otherwise
 */
export function shouldProcessFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return ext === ".md";
}

/**
 * Process a single markdown file
 */
export async function processMarkdownFile(
  filePath: string,
  vaultPath: string,
  commitHash: string,
  logger: Logger
) {
  try {
    // const fileContent = fs.readFileSync(filePath, "utf8");
    // const { metadata } = extractMetadata(fileContent, logger);
    const formattedPath = formatArticlePath(filePath, vaultPath);

    // Process the file within a transaction
    await prisma.$transaction(async tx => {
      const articlesMap = await insertArticles(
        tx as PrismaClient,
        [filePath],
        vaultPath,
        logger
      );

      if (articlesMap.size > 0) {
        await insertRelations(tx as PrismaClient, articlesMap, logger);

        // Get the article ID from the map
        const article = articlesMap.get(formattedPath);
        if (article) {
          await updateImportMetadata(
            tx as PrismaClient,
            article.id,
            commitHash
          );
        }
      }
    });

    logger.success(`Processed file: ${formattedPath}`);
  } catch (error) {
    logger.error(`Error processing file ${filePath}:`, error as Error);

    // Find the article by path to get its ID
    const article = await prisma.article.findUnique({
      where: { path: formatArticlePath(filePath, vaultPath) },
    });

    if (article) {
      await updateImportMetadata(prisma, article.id, commitHash);
    }

    throw error;
  }
}

/**
 * Delete an article from the database
 */
export async function deleteArticle(
  filePath: string,
  commitHash: string,
  logger: Logger
) {
  try {
    // First find the article to get its ID
    const article = await prisma.article.findUnique({
      where: { path: filePath },
      select: { id: true },
    });

    if (!article) {
      logger.warn(`Article to delete not found: ${filePath}`);
      return;
    }

    // Use a transaction to ensure all related data is deleted consistently
    await prisma.$transaction(async tx => {
      // Delete relations (the cascade will handle this, but we delete explicitly for clarity)
      await tx.articleRelation.deleteMany({
        where: {
          OR: [{ articleFromId: article.id }, { articleToId: article.id }],
        },
      });

      // Delete article tags
      await tx.articleTag.deleteMany({
        where: { articleId: article.id },
      });

      // Delete article content
      await tx.articleContent.deleteMany({
        where: { articleId: article.id },
      });

      // Delete import metadata
      await tx.importMetadata.deleteMany({
        where: { articleId: article.id },
      });

      // Finally delete the article itself
      await tx.article.delete({
        where: { id: article.id },
      });
    });

    logger.success(`Deleted article: ${filePath}`);
  } catch (error) {
    logger.error(`Error deleting article ${filePath}:`, error as Error);
    throw error;
  }
}
