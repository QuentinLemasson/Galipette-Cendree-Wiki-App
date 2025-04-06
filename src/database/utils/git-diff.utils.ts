import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";
import path from "path";
import {
  GitDiffResult,
  GitFileStatus,
  GitImportMetadata,
} from "../types/git-diff.types";
import { prisma } from "../operations/importOperations";
import { Logger } from "@/utils/logger/logger.utils";
import { extractMetadata, formatArticlePath } from "./markdown.utils";
import { insertArticles, insertRelations } from "./database.utils";
import fs from "fs";
import { createHash } from "crypto";

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
      status: "success",
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
  filesChanged: number,
  status: string = "success",
  error: string | null = null,
  metadata: GitImportMetadata = {}
): Promise<void> {
  await prisma.gitImportLog.create({
    data: {
      commitHash,
      status,
      error,
      filesChanged,
      metadata: JSON.stringify(metadata),
    },
  });
}

/**
 * Update import metadata for processed files
 * @param prisma - Prisma client instance
 * @param filePath - File path
 * @param fileHash - File hash
 * @param commitHash - Commit hash
 * @param gitStatus - Git status
 * @param error - Error message
 */
export async function updateImportMetadata(
  prisma: PrismaClient,
  filePath: string,
  fileHash: string,
  commitHash: string,
  gitStatus: string,
  error: string | null = null,
  metadata: GitImportMetadata = {}
): Promise<void> {
  await prisma.importMetadata.upsert({
    where: {
      filePath,
    },
    update: {
      fileHash,
      commitHash,
      gitStatus,
      lastImport: new Date(),
      importCount: { increment: 1 },
      error,
      metadata: JSON.stringify(metadata),
    },
    create: {
      filePath,
      fileHash,
      commitHash,
      gitStatus,
      lastImport: new Date(),
      importCount: 1,
      error,
      metadata: JSON.stringify(metadata),
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
 * Calculate MD5 hash of a file's content
 */
function calculateFileHash(content: string): string {
  return createHash("md5").update(content).digest("hex");
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
    const fileContent = fs.readFileSync(filePath, "utf8");
    const fileHash = calculateFileHash(fileContent);
    const { metadata } = extractMetadata(fileContent, logger);
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
        await updateImportMetadata(
          tx as PrismaClient,
          formattedPath,
          fileHash,
          commitHash,
          "modified",
          null,
          { importType: "diff", ...metadata }
        );
      }
    });

    logger.success(`Processed file: ${formattedPath}`);
  } catch (error) {
    logger.error(`Error processing file ${filePath}:`, error as Error);
    await updateImportMetadata(
      prisma,
      formatArticlePath(filePath, vaultPath),
      "",
      commitHash,
      "error",
      (error as Error).message,
      { importType: "diff" }
    );
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
    await prisma.article.delete({
      where: { path: filePath },
    });
    await updateImportMetadata(
      prisma,
      filePath,
      "",
      commitHash,
      "deleted",
      null,
      { importType: "diff", deletedAt: new Date().toISOString() }
    );
    logger.success(`Deleted article: ${filePath}`);
  } catch (error) {
    logger.error(`Error deleting article ${filePath}:`, error as Error);
    await updateImportMetadata(
      prisma,
      filePath,
      "",
      commitHash,
      "error",
      (error as Error).message,
      { importType: "diff" }
    );
    throw error;
  }
}
