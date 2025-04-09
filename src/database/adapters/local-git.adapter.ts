import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import {
  ImportSource,
  ImportFile,
  ChangedFiles,
  FileMetadata,
} from "../types/import.types";
import { Logger } from "@/utils/logger/logger.utils";
import { formatArticlePath } from "../utils/markdown.utils";
import { prisma } from "../core/client";

/**
 * @fileoverview LocalGitAdapter - Local Git repository import source
 *
 * @description
 * The LocalGitAdapter implements the ImportSource interface to process content from
 * a local Git repository. It tracks changes between commits, reads files from the
 * filesystem, and prepares them for import into the wiki system.
 *
 * @key_responsibilities
 * - Connect to a local Git repository
 * - Detect changes between commits (additions, modifications, deletions)
 * - Read file content from the filesystem
 * - Track import metadata including commit hashes
 * - Support incremental (diff-based) imports
 *
 * @usage_example
 * ```typescript
 * // Create adapter for local Git repository
 * const adapter = new LocalGitAdapter(
 *   '/path/to/repo',
 *   'main', // branch name
 *   'content/wiki' // Optional wiki subdirectory
 * );
 *
 * // Get files that changed since last import
 * const changedFiles = await adapter.getChangedFiles();
 *
 * // Get all files for import
 * const files = await adapter.getFiles();
 * ```
 *
 * @implements {ImportSource}
 *
 * @methods
 * - {@link LocalGitAdapter.constructor} - Create a new adapter instance
 * - {@link LocalGitAdapter.getFiles} - Get all markdown files from the repository
 * - {@link LocalGitAdapter.getChangedFiles} - Get files that changed since last import
 * - {@link LocalGitAdapter.getMetadata} - Get import metadata with commit information
 *
 * @private_methods
 * - {@link LocalGitAdapter.validateRepository} - Ensure the Git repository is valid
 * - {@link LocalGitAdapter.getCurrentCommitHash} - Get the current HEAD commit hash
 * - {@link LocalGitAdapter.getLastImportedCommit} - Find the last successfully imported commit
 * - {@link LocalGitAdapter.collectMarkdownFiles} - Gather all markdown files recursively
 * - {@link LocalGitAdapter.getDiffBetweenCommits} - Find changes between two commits
 *
 * @note
 * Requires Git to be installed and accessible via command line.
 * The repository must be a valid Git repository with the specified branch.
 */

export class LocalGitAdapter implements ImportSource {
  private logger: Logger;
  private repoPath: string;
  private branch: string;
  private wikiSubdir: string;

  /**
   * Create a new LocalGitAdapter
   */
  constructor(
    repoPath: string,
    branch: string = "main",
    wikiSubdir: string = "",
    logger?: Logger
  ) {
    this.repoPath = repoPath;
    this.branch = branch;
    this.wikiSubdir = wikiSubdir;
    this.logger = logger || new Logger("local-git-adapter.log");

    // Validate the repository
    this.validateRepository();
  }

  /**
   * Validate the git repository
   */
  private validateRepository(): void {
    if (!this.repoPath) {
      const message = "Repository path is required";
      this.logger.error(message);
      throw new Error(message);
    }

    if (!fs.existsSync(path.join(this.repoPath, ".git"))) {
      const message = `No Git repository found at ${this.repoPath}`;
      this.logger.error(message);
      throw new Error(message);
    }

    try {
      // Ensure the branch exists
      execSync(`git show-ref --verify --quiet refs/heads/${this.branch}`, {
        cwd: this.repoPath,
      });
    } catch (err) {
      const error = err as Error;
      const message = `Branch '${this.branch}' does not exist: ${error.message}`;
      this.logger.error(message, error);
      throw new Error(message);
    }
  }

  /**
   * Get the current commit hash
   */
  private getCurrentCommitHash(): string {
    try {
      return execSync("git rev-parse HEAD", { cwd: this.repoPath })
        .toString()
        .trim();
    } catch (err) {
      const error = err as Error;
      const message = `Failed to get current commit hash: ${error.message}`;
      this.logger.error(message, error);
      throw new Error(message);
    }
  }

  /**
   * Get the last imported commit hash from the database
   */
  private async getLastImportedCommit(): Promise<string | null> {
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
   * Collect all markdown files from the repository
   */
  private collectMarkdownFiles(): string[] {
    const wikiDir = path.join(this.repoPath, this.wikiSubdir);

    if (!fs.existsSync(wikiDir)) {
      const message = `Wiki directory '${wikiDir}' does not exist`;
      this.logger.error(message);
      throw new Error(message);
    }

    const markdownFiles: string[] = [];

    // Recursively collect markdown files
    const collectFiles = (dir: string) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(dir, file.name);

        // Skip hidden files and directories
        if (file.name.startsWith(".")) continue;

        if (file.isDirectory()) {
          collectFiles(fullPath);
        } else if (file.isFile() && file.name.endsWith(".md")) {
          markdownFiles.push(fullPath);
        }
      }
    };

    collectFiles(wikiDir);
    return markdownFiles;
  }

  /**
   * Get changed files between two commits
   */
  private getDiffBetweenCommits(
    fromCommit: string,
    toCommit: string
  ): ChangedFiles {
    try {
      const result: ChangedFiles = {
        added: [],
        modified: [],
        deleted: [],
      };

      // Get the diff from git
      const gitDiffCommand = `git diff --name-status ${fromCommit} ${toCommit} -- "${this.wikiSubdir}"`;
      const gitDiff = execSync(gitDiffCommand, { cwd: this.repoPath })
        .toString()
        .trim();

      if (!gitDiff) {
        return result;
      }

      // Parse the diff output
      const lines = gitDiff.split("\n");
      for (const line of lines) {
        const [status, ...pathParts] = line.split("\t");
        const filePath = pathParts.join("\t"); // Handle filenames with tabs

        // Skip non-markdown files
        if (!filePath.endsWith(".md")) continue;

        // Format the path for consistency
        const formattedPath = formatArticlePath(
          path.join(this.wikiSubdir, filePath),
          this.repoPath
        );

        // Categorize changes
        if (status === "A") {
          result.added.push(formattedPath);
        } else if (status === "M") {
          result.modified.push(formattedPath);
        } else if (status === "D") {
          result.deleted.push(formattedPath);
        }
      }

      return result;
    } catch (err) {
      const error = err as Error;
      const message = `Failed to get changed files: ${error.message}`;
      this.logger.error(message, error);
      throw new Error(message);
    }
  }

  /**
   * Implementation of ImportSource.getFiles()
   */
  async getFiles(): Promise<ImportFile[]> {
    const files: ImportFile[] = [];
    const markdownFiles = this.collectMarkdownFiles();
    const commitHash = this.getCurrentCommitHash();

    this.logger.info(
      `Found ${markdownFiles.length} markdown files in repository`,
      "📊"
    );

    for (const filePath of markdownFiles) {
      try {
        const content = fs.readFileSync(filePath, "utf8");
        const relativePath = path.relative(this.repoPath, filePath);

        files.push({
          path: filePath,
          content,
          metadata: {
            commitHash,
            timestamp: new Date(),
            source: "local-git",
            relativePath,
          },
        });
      } catch (err) {
        const error = err as Error;
        const message = `Error reading file ${filePath}: ${error.message}`;
        this.logger.error(message, error);
      }
    }

    return files;
  }

  /**
   * Implementation of ImportSource.getChangedFiles()
   */
  async getChangedFiles(): Promise<ChangedFiles> {
    const currentCommit = this.getCurrentCommitHash();
    const lastCommit = await this.getLastImportedCommit();

    if (!lastCommit) {
      this.logger.info(
        "No previous import found, treating all files as added",
        "📝"
      );

      // If no previous import, treat all files as added
      const markdownFiles = this.collectMarkdownFiles();
      return {
        added: markdownFiles.map(file =>
          formatArticlePath(file, this.repoPath)
        ),
        modified: [],
        deleted: [],
      };
    }

    this.logger.info(
      `Getting changes between ${lastCommit} and ${currentCommit}`,
      "🔍"
    );
    return this.getDiffBetweenCommits(lastCommit, currentCommit);
  }

  /**
   * Implementation of ImportSource.getMetadata()
   */
  async getMetadata(): Promise<FileMetadata> {
    const commitHash = this.getCurrentCommitHash();

    try {
      // Get commit details
      const commitDetails = execSync(
        `git show -s --format="%an|%ae|%at|%s" ${commitHash}`,
        { cwd: this.repoPath }
      )
        .toString()
        .trim();

      const [author, email, timestamp, subject] = commitDetails.split("|");

      return {
        commitHash,
        timestamp: new Date(parseInt(timestamp) * 1000),
        author,
        email,
        subject,
        source: "local-git",
        branch: this.branch,
      };
    } catch (err) {
      const error = err as Error;
      // Fallback to basic metadata
      this.logger.warn(`Error getting commit details: ${error.message}`);
      return {
        commitHash,
        timestamp: new Date(),
        source: "local-git",
        branch: this.branch,
      };
    }
  }
}
