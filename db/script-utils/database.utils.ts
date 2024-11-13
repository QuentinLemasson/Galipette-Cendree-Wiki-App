import type { Article, PrismaClient } from "@prisma/client";
import path from "path";
import { extractMetadata, formatArticlePath } from "./markdown.utils.ts";
import fs from "fs";
import { Logger } from "./logger.utils.ts";

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
      const article = await prisma.article.upsert({
        where: { path: formattedPath },
        update: {
          title,
          content,
          metadata,
          folderId,
          updatedAt: new Date(),
        },
        create: {
          title,
          content,
          path: formattedPath,
          metadata,
          folderId,
        },
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
    const rawRelations = article.content.match(/\[\[([^\]]+)\]\]/g) || [];

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
          await prisma.articleRelation.upsert({
            where: {
              articlePath_relatedArticlePath: {
                articlePath: articlePath,
                relatedArticlePath: relatedPath,
              },
            },
            update: {},
            create: {
              articlePath: articlePath,
              relatedArticlePath: relatedPath,
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
