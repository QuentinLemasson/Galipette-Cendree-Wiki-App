import type { PrismaClient } from "@prisma/client";
import path from "path";
import { extractMetadata, formatArticlePath } from "../utils/markdown.utils";
import fs from "fs";
import { Logger } from "../../utils/logger/logger.utils";
import { Article } from "../types/db.types";

/**
 * @fileoverview Core database operations for article and folder management
 *
 * @description
 * This file contains utility functions for managing the database structure,
 * including folder hierarchies, article insertion, and relationship management.
 * It provides the core functionality for importing content into the database
 * and maintaining the relationships between articles.
 *
 * @methods
 * - {@link ensureRootFolder} - Ensures the root folder exists in the database
 * - {@link getOrCreateFolderHierarchy} - Creates or gets the folder hierarchy
 * - {@link insertArticles} - Inserts articles into the database
 * - {@link insertRelations} - Inserts relations between articles
 *
 * @notes
 * - Uses transactions to ensure data consistency
 * - Handles both article content and metadata separately
 * - Supports incremental imports with proper relationship tracking
 * - Extracts wiki-style links ([[link]]) to create article relations
 * - Maintains folder hierarchy for article organization
 */

/**
 * Ensures the root folder exists in the database and returns its ID.
 */
export async function ensureRootFolder(
  prisma: PrismaClient,
  logger: Logger
): Promise<number> {
  try {
    let rootFolder = await prisma.folder.findFirst({
      where: {
        name: "root",
        parentId: null,
      },
    });

    if (!rootFolder) {
      rootFolder = await prisma.folder.create({
        data: {
          name: "root",
        },
      });
      logger.info("Created root folder", "📁");
    }

    return rootFolder.id;
  } catch (error) {
    logger.error("Error ensuring root folder:", error as Error);
    throw error;
  }
}

/**
 * Creates or gets the folder hierarchy for a given path
 */
export async function getOrCreateFolderHierarchy(
  prisma: PrismaClient,
  folderPath: string,
  logger: Logger
): Promise<number> {
  try {
    const rootId = await ensureRootFolder(prisma, logger);

    // If it's a root-level file
    if (!folderPath || folderPath === ".") {
      return rootId;
    }

    // Split path into folder names
    const folders = folderPath.split("/").filter(Boolean);
    let currentParentId = rootId;

    // Process each folder in the path
    for (const folderName of folders) {
      let folder = await prisma.folder.findFirst({
        where: {
          name: folderName,
          parentId: currentParentId,
        },
      });

      if (folder) {
        currentParentId = folder.id;
        logger.info(
          `Found existing folder: ${folderName} (ID: ${currentParentId})`
        );
      } else {
        folder = await prisma.folder.create({
          data: {
            name: folderName,
            parentId: currentParentId,
          },
        });
        currentParentId = folder.id;
        logger.info(
          `Created new folder: ${folderName} (ID: ${currentParentId})`,
          "📁"
        );
      }
    }

    return currentParentId;
  } catch (error) {
    logger.error(
      `Error processing folder hierarchy for ${folderPath}:`,
      error as Error
    );
    throw error;
  }
}

/**
 * Inserts articles into the database
 */
export async function insertArticles(
  prisma: PrismaClient,
  markdownFiles: string[],
  vaultPath: string,
  logger: Logger
) {
  logger.info("Starting to insert articles into the database...", "📚");

  const articlesMap = new Map();

  // Create the map of articles to insert
  for (const filePath of markdownFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { metadata, content } = extractMetadata(fileContent, logger);
    const formattedPath = formatArticlePath(filePath, vaultPath);
    const title =
      path.basename(filePath, ".md") === "index"
        ? path.basename(path.dirname(filePath))
        : path.basename(filePath, ".md");

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

    try {
      // Use transaction to ensure both article and content are created/updated atomically
      const article = await prisma.$transaction(async tx => {
        // Create or update the article
        // TODO : maybe also compute preview here
        const article = await tx.article.upsert({
          where: { path: formattedPath },
          update: {
            title,
            metadata,
            folderId,
            updatedAt: new Date(),
          },
          create: {
            title,
            path: formattedPath,
            metadata,
            folderId,
          },
        });

        // Create or update the article content
        await tx.articleContent.upsert({
          where: { articleId: article.id },
          update: { content },
          create: {
            content,
            articleId: article.id,
          },
        });

        return article;
      });

      articlesMap.set(formattedPath, article);
      logger.success(`Processed article: ${title}`);
    } catch (error) {
      logger.error("❌ Error inserting articles batch:", error as Error);
      throw error;
    }
  }

  return articlesMap;
}

/**
 * Inserts relations between articles
 */
export async function insertRelations(
  prisma: PrismaClient,
  articlesMap: Map<string, Article>,
  logger: Logger
) {
  logger.info("Starting to insert relations into the database...", "📚");

  const rootFolder = process.env.WIKI_DIRECTORY?.replace(
    /\\/g,
    "\\\\" // Escape backslashes for regex
  ).replace(
    /\//g,
    "\\/" // Escape slashes for regex
  );

  for (const [articlePath, article] of articlesMap.entries()) {
    // Get the article content from the database
    const articleWithContent = await prisma.article.findUnique({
      where: { id: article.id },
      include: { content: true },
    });

    // no content => no relations => skip to next article
    if (!articleWithContent?.content?.content) {
      logger.warn(`No content found for article: ${articlePath}`);
      continue;
    }

    const rawRelations =
      articleWithContent.content.content.match(/\[\[([^\]]+)\]\]/g) || [];

    for (const link of rawRelations) {
      const linkTexts = link.slice(2, -2).trim().split("|");
      let relatedPath;

      if (rootFolder && linkTexts[0].startsWith(rootFolder)) {
        const relativePath = linkTexts[0]
          .slice(`${rootFolder}/`.length)
          .replace(/\\+$/, "");
        relatedPath = formatArticlePath(relativePath, "");
      } else {
        const formattedTitle = linkTexts[0].replace(/ /g, "_");
        const relatedArticle = Array.from(articlesMap.values()).find(
          (a: Article) => a.title.replace(/ /g, "_") === formattedTitle
        );
        relatedPath = relatedArticle?.path;
      }

      if (relatedPath && articlesMap.has(relatedPath)) {
        try {
          const relatedArticle = articlesMap.get(relatedPath);
          if (!relatedArticle) continue;

          await prisma.articleRelation.upsert({
            where: {
              articleFromId_articleToId: {
                articleFromId: article.id,
                articleToId: relatedArticle.id,
              },
            },
            update: {},
            create: {
              articleFromId: article.id,
              articleToId: relatedArticle.id,
            },
          });
          logger.info(
            `Created relation: ${articlePath} -> ${relatedPath}`,
            "🔗"
          );
        } catch (error) {
          logger.warn(
            `Failed to create relation: ${articlePath} -> ${relatedPath} : ${error}`
          );
        }
      }
    }
  }
}
