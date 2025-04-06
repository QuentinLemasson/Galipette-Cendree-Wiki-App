import {
  ImportSource,
  ImportFile,
  ChangedFiles,
  FileMetadata,
} from "../types/import.types";
import { Logger } from "@/utils/logger/logger.utils";
import { formatArticlePath } from "../utils/markdown.utils";
import axios from "axios";

/**
 * Type for the webhook payload from GitHub
 */
interface GitHubWebhookPayload {
  repository?: {
    full_name?: string;
    html_url?: string;
    owner?: {
      name?: string;
      login?: string;
    };
    name?: string;
  };
  ref?: string;
  after?: string;
  before?: string;
  commits?: Array<{
    id?: string;
    message?: string;
    timestamp?: string;
    author?: {
      name?: string;
      email?: string;
    };
    added?: string[];
    modified?: string[];
    removed?: string[];
  }>;
  sender?: {
    login?: string;
  };
}

/**
 * Webhook adapter for GitHub webhooks
 */
export class WebhookAdapter implements ImportSource {
  private logger: Logger;
  private payload: GitHubWebhookPayload;
  private token: string | null;
  private wikiSubdir: string;

  /**
   * Create a new WebhookAdapter
   */
  constructor(
    payload: GitHubWebhookPayload,
    wikiSubdir: string = "",
    token: string | null = null,
    logger?: Logger
  ) {
    this.payload = payload;
    this.wikiSubdir = wikiSubdir;
    this.token = token || process.env.GITHUB_TOKEN || null;
    this.logger = logger || new Logger("webhook-adapter.log");

    // Validate the webhook payload
    this.validatePayload();
  }

  /**
   * Validate the webhook payload
   */
  private validatePayload(): void {
    if (!this.payload.repository?.full_name) {
      throw new Error(
        "Invalid webhook payload: missing repository information"
      );
    }

    if (!this.payload.after) {
      throw new Error("Invalid webhook payload: missing commit hash");
    }

    if (!this.payload.commits || this.payload.commits.length === 0) {
      throw new Error("Invalid webhook payload: no commits found");
    }
  }

  /**
   * Get repository information
   */
  private getRepositoryInfo() {
    const repoFullName = this.payload.repository?.full_name || "";
    const [owner, repo] = repoFullName.split("/");
    return { owner, repo };
  }

  /**
   * Fetch file content from GitHub
   */
  private async fetchFileContent(filePath: string): Promise<string> {
    try {
      const { owner, repo } = this.getRepositoryInfo();
      const ref = this.payload.after;

      // Add auth header if token is provided
      const headers: Record<string, string> = {};
      if (this.token) {
        headers.Authorization = `token ${this.token}`;
      }

      // Encode the file path to handle special characters
      const encodedPath = encodeURIComponent(
        this.wikiSubdir ? `${this.wikiSubdir}/${filePath}` : filePath
      ).replace(/%2F/g, "/");

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodedPath}?ref=${ref}`;
      this.logger.info(`Fetching file from GitHub: ${url}`);

      const response = await axios.get(url, { headers });

      // GitHub API returns file content as base64 encoded string
      if (response.data && response.data.content) {
        const content = Buffer.from(response.data.content, "base64").toString(
          "utf8"
        );
        return content;
      }

      throw new Error("No content found in response");
    } catch (err) {
      const error = err as Error;
      this.logger.error(`Error fetching file ${filePath}: ${error.message}`);
      return ""; // Return empty string on error
    }
  }

  /**
   * Get all changed files from the webhook payload
   */
  private getChangedFilesFromPayload(): ChangedFiles {
    const result: ChangedFiles = {
      added: [],
      modified: [],
      deleted: [],
    };

    if (!this.payload.commits) return result;

    // Process each commit
    for (const commit of this.payload.commits) {
      // Add new files
      if (commit.added) {
        for (const file of commit.added) {
          // Only include markdown files
          if (!file.endsWith(".md")) continue;

          // Format the path for consistency
          const formattedPath = formatArticlePath(
            this.wikiSubdir ? `${this.wikiSubdir}/${file}` : file,
            ""
          );

          if (!result.added.includes(formattedPath)) {
            result.added.push(formattedPath);
          }
        }
      }

      // Add modified files
      if (commit.modified) {
        for (const file of commit.modified) {
          if (!file.endsWith(".md")) continue;

          const formattedPath = formatArticlePath(
            this.wikiSubdir ? `${this.wikiSubdir}/${file}` : file,
            ""
          );

          if (
            !result.added.includes(formattedPath) &&
            !result.modified.includes(formattedPath)
          ) {
            result.modified.push(formattedPath);
          }
        }
      }

      // Add deleted files
      if (commit.removed) {
        for (const file of commit.removed) {
          if (!file.endsWith(".md")) continue;

          const formattedPath = formatArticlePath(
            this.wikiSubdir ? `${this.wikiSubdir}/${file}` : file,
            ""
          );

          // If a file was added and then deleted in the same push, remove it from added
          const addedIndex = result.added.indexOf(formattedPath);
          if (addedIndex !== -1) {
            result.added.splice(addedIndex, 1);
          } else {
            // If a file was modified and then deleted, remove it from modified
            const modifiedIndex = result.modified.indexOf(formattedPath);
            if (modifiedIndex !== -1) {
              result.modified.splice(modifiedIndex, 1);
            }

            // Only add to deleted if not already added or modified
            if (!result.deleted.includes(formattedPath)) {
              result.deleted.push(formattedPath);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Implementation of ImportSource.getFiles()
   */
  async getFiles(): Promise<ImportFile[]> {
    const changedFiles = this.getChangedFilesFromPayload();
    const filesToProcess = [...changedFiles.added, ...changedFiles.modified];
    const files: ImportFile[] = [];

    this.logger.info(
      `Processing ${filesToProcess.length} files from webhook`,
      "📊"
    );

    // Fetch content for each file
    for (const filePath of filesToProcess) {
      try {
        const content = await this.fetchFileContent(filePath);

        if (!content) {
          this.logger.warn(`Empty content for file: ${filePath}`);
          continue;
        }

        files.push({
          path: filePath,
          content,
          metadata: {
            commitHash: this.payload.after || "",
            timestamp: new Date(),
            source: "github-webhook",
            repositoryUrl: this.payload.repository?.html_url || "",
            author: this.payload.commits?.[0]?.author?.name || "",
            email: this.payload.commits?.[0]?.author?.email || "",
          },
        });
      } catch (err) {
        const error = err as Error;
        this.logger.error(
          `Error processing file ${filePath}: ${error.message}`
        );
      }
    }

    return files;
  }

  /**
   * Implementation of ImportSource.getChangedFiles()
   */
  async getChangedFiles(): Promise<ChangedFiles> {
    return this.getChangedFilesFromPayload();
  }

  /**
   * Implementation of ImportSource.getMetadata()
   */
  async getMetadata(): Promise<FileMetadata> {
    const latestCommit =
      this.payload.commits?.[this.payload.commits.length - 1];

    return {
      commitHash: this.payload.after || "",
      timestamp: latestCommit?.timestamp
        ? new Date(latestCommit.timestamp)
        : new Date(),
      author: latestCommit?.author?.name || "",
      email: latestCommit?.author?.email || "",
      source: "github-webhook",
      repositoryUrl: this.payload.repository?.html_url || "",
      branch: this.payload.ref?.replace("refs/heads/", "") || "main",
    };
  }
}
