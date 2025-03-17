import { PrismaClient, Article } from "@prisma/client";
import { Logger } from "@/utils/logger/logger.utils";
import { extractMetadata } from "@/database/utils/markdown.utils";
import {
  getOrCreateFolderHierarchy,
  insertRelations,
} from "@/database/utils/database.utils";
import path from "path";

// Type for webhook payload
export interface WebhookPayload {
  repository?: {
    full_name?: string;
    html_url?: string;
    owner?: {
      name?: string;
    };
    name?: string;
  };
  ref?: string;
  commits?: Array<{
    added?: string[];
    modified?: string[];
  }>;
}

/**
 * Imports markdown files from a webhook payload
 * @param {Logger} logger - Logger instance
 * @param {WebhookPayload} payload - GitHub/GitLab webhook payload
 * @param {string} wikiSubdir - Subdirectory within the repository that contains the wiki files
 * @returns {Promise<Object>} Import statistics
 */
export async function importFromWebhook(
  prisma: PrismaClient,
  logger: Logger,
  payload?: WebhookPayload,
  wikiSubdir?: string
) {
  if (!payload) {
    throw new Error("Webhook payload is required");
  }

  const gitWikiSubdir = wikiSubdir || process.env.WIKI_DIRECTORY || "";

  logger.info(
    `Processing webhook payload from: ${payload.repository?.full_name || "unknown repository"}`,
    "🚀"
  );

  // Extract repository information from the payload
  const repoName = payload.repository?.full_name;
  const branch = payload.ref?.replace("refs/heads/", "");

  logger.info(`Repository: ${repoName}, Branch: ${branch}`, "📂");

  // Get the list of modified files from the webhook payload
  const modifiedFiles = extractModifiedFiles(payload, gitWikiSubdir);
  logger.info(`Found ${modifiedFiles.length} modified markdown files`, "📄");

  if (modifiedFiles.length === 0) {
    logger.info("No markdown files were modified, skipping import", "⏭️");
    return {
      success: true,
      message: "No markdown files were modified",
      stats: {
        articlesImported: 0,
        relationsCreated: 0,
      },
    };
  }

  // Fetch content for each modified file
  const fileContents = await fetchFileContents(
    payload.repository?.owner?.name || "",
    payload.repository?.name || "",
    modifiedFiles,
    branch || "main",
    logger
  );

  // Process the files and update the database
  let articlesImported = 0;
  let relationsCreated = 0;

  await prisma.$transaction(async tx => {
    // Process each file and update the database
    const articlesMap = await processWebhookFiles(
      tx as PrismaClient,
      fileContents,
      gitWikiSubdir,
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

  logger.success("Webhook import completed successfully.");

  return {
    success: true,
    message: "Webhook import completed successfully",
    stats: {
      articlesImported,
      relationsCreated,
    },
  };
}

/**
 * Extracts modified markdown files from webhook payload
 * @param {WebhookPayload} payload - Webhook payload
 * @param {string} wikiSubdir - Subdirectory within the repository that contains the wiki files
 * @returns {Array<string>} List of modified markdown file paths
 */
function extractModifiedFiles(
  payload: WebhookPayload,
  wikiSubdir: string
): string[] {
  const modifiedFiles: string[] = [];

  // GitHub push event
  if (payload.commits) {
    for (const commit of payload.commits) {
      // Add new and modified files, filter for markdown only
      [...(commit.added || []), ...(commit.modified || [])]
        .filter(file => file.endsWith(".md"))
        .filter(file => !wikiSubdir || file.startsWith(wikiSubdir))
        .forEach(file => {
          if (!modifiedFiles.includes(file)) {
            modifiedFiles.push(file);
          }
        });
    }
  }

  return modifiedFiles;
}

/**
 * Fetches content for modified files using GitHub API
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Array<string>} files - List of file paths
 * @param {string} branch - Branch name
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Array<{path: string, content: string}>>} File contents
 */
async function fetchFileContents(
  owner: string,
  repo: string,
  files: string[],
  branch: string,
  logger: Logger
): Promise<Array<{ path: string; content: string }>> {
  const fileContents: Array<{ path: string; content: string }> = [];

  for (const filePath of files) {
    try {
      // GitHub API URL for raw content
      const url = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
      logger.info(`Fetching content from: ${url}`, "⬇️");

      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`Failed to fetch ${filePath}: ${response.statusText}`);
        continue;
      }

      const content = await response.text();
      fileContents.push({ path: filePath, content });
    } catch (error) {
      logger.warn(`Error fetching ${filePath}:`, error as Error);
    }
  }

  return fileContents;
}

/**
 * Processes files from webhook and updates the database
 * @param {PrismaClient} prisma - Prisma client instance
 * @param {Array<{path: string, content: string}>} files - File contents
 * @param {string} wikiSubdir - Subdirectory within the repository that contains the wiki files
 * @param {Logger} logger - Logger instance
 * @returns {Promise<Map<string, Article>>} Map of processed articles
 */
async function processWebhookFiles(
  prisma: PrismaClient,
  files: Array<{ path: string; content: string }>,
  wikiSubdir: string,
  logger: Logger
): Promise<Map<string, Article>> {
  const articlesMap = new Map<string, Article>();

  for (const { path: filePath, content } of files) {
    try {
      // Extract metadata and content
      const { metadata, content: markdownContent } = extractMetadata(
        content,
        logger
      );

      // Format the path (remove wiki subdirectory prefix if present)
      let formattedPath = filePath;
      if (wikiSubdir && formattedPath.startsWith(wikiSubdir)) {
        formattedPath = formattedPath.substring(wikiSubdir.length);
        // Remove leading slash if present
        if (formattedPath.startsWith("/")) {
          formattedPath = formattedPath.substring(1);
        }
      }

      // Remove .md extension and replace spaces with underscores
      formattedPath = formattedPath.replace(/\.md$/, "").replace(/ /g, "_");

      // Get the title from the filename
      const title = path.basename(filePath, ".md");

      // Get folder path (everything before the last segment)
      const folderPath = path.dirname(formattedPath);
      const folderId = await getOrCreateFolderHierarchy(
        prisma,
        folderPath,
        logger
      );

      logger.info(
        `Processing article -> ${title} with path: ${formattedPath} (folder: ${folderPath || "root"})`,
        "📄"
      );

      // Upsert the article
      const article = await prisma.article.upsert({
        where: { path: formattedPath },
        update: {
          title,
          content: markdownContent,
          metadata,
          folderId,
          updatedAt: new Date(),
        },
        create: {
          title,
          content: markdownContent,
          path: formattedPath,
          metadata,
          folderId,
        },
      });

      articlesMap.set(formattedPath, article);
      logger.success(`Processed article: ${title}`);
    } catch (error) {
      logger.error(`Error processing file ${filePath}:`, error as Error);
    }
  }

  return articlesMap;
}
