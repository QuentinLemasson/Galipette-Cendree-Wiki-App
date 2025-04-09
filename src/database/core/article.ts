import { Article, PrismaClient, Prisma, Folder } from "@prisma/client";
import { prisma } from "./client";
import { Logger } from "@/utils/logger/logger.utils";

/**
 * @fileoverview ArticleManager - Core article management service
 *
 * @description
 * The ArticleManager is a singleton service that handles all article-related operations in the wiki system.
 * It provides methods for creating, updating, deleting, and querying articles and their relationships.
 *
 * @key_responsibilities
 * - Article CRUD operations with metadata management
 * - Content and preview generation
 * - File path standardization
 * - Article relation management
 * - Folder hierarchy creation
 *
 * @usage_example
 * ```typescript
 * const articleManager = ArticleManager.getInstance();
 *
 * // Create or update an article
 * const article = await articleManager.upsertArticle(
 *   'My Article',
 *   '# Content here',
 *   'folder/my-article',
 *   { tags: ['wiki'] },
 *   folderId
 * );
 *
 * // Delete an article
 * await articleManager.deleteArticle('folder/my-article');
 * ```
 *
 * @methods
 * - {@link ArticleManager.getInstance} - Get singleton instance
 * - {@link ArticleManager.upsertArticle} - Create or update an article
 * - {@link ArticleManager.deleteArticle} - Delete an article and its relationships
 * - {@link ArticleManager.createRelations} - Parse and create article relationships
 * - {@link ArticleManager.formatArticlePath} - Standardize article paths
 * - {@link ArticleManager.getOrCreateFolderHierarchy} - Create folder structure
 * - {@link ArticleManager.generatePreview} - Generate article preview text
 *
 * @note All operations use transactions where necessary to ensure database consistency.
 */

export class ArticleManager {
  private static _instance: ArticleManager;
  private prisma: PrismaClient;

  /**
   * Get singleton instance
   */
  public static getInstance(): ArticleManager {
    if (!ArticleManager._instance) {
      ArticleManager._instance = new ArticleManager();
    }
    return ArticleManager._instance;
  }

  private constructor() {
    this.prisma = prisma;
  }

  /**
   * Generate a preview from article content
   * Removes markdown formatting and truncates to specified length
   */
  private generatePreview(content: string, maxLength: number = 500): string {
    // Remove markdown formatting for cleaner preview
    const cleanContent = content
      .replace(/^#+ /gm, "") // Remove headings
      .replace(/\*\*(.+?)\*\*/g, "$1") // Remove bold
      .replace(/\*(.+?)\*/g, "$1") // Remove italic
      .replace(/`(.+?)`/g, "$1") // Remove inline code
      .replace(/```[\s\S]*?```/g, "") // Remove code blocks
      .replace(/\[\[([^\]]+)\]\]/g, "$1") // Convert wiki links to text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Convert markdown links to text
      .trim();

    // Return truncated preview
    if (cleanContent.length <= maxLength) {
      return cleanContent;
    }

    // Try to cut at a sentence or paragraph
    const truncated = cleanContent.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf(".");
    const lastNewline = truncated.lastIndexOf("\n");

    // Prefer cutting at a sentence, then at a paragraph, then at maxLength
    const cutPoint =
      lastPeriod > maxLength * 0.7
        ? lastPeriod + 1
        : lastNewline > maxLength * 0.7
          ? lastNewline + 1
          : maxLength;

    return cleanContent.substring(0, cutPoint) + "...";
  }

  /**
   * Upsert an article with metadata
   */
  async upsertArticle(
    title: string,
    content: string,
    path: string,
    metadata: Record<string, unknown>,
    folderId: number | null
  ): Promise<Article> {
    // Generate preview
    const preview = this.generatePreview(content);

    // Use transaction to ensure both operations complete
    return this.prisma.$transaction(async tx => {
      // Create or update article
      const article = await tx.article.upsert({
        where: { path },
        update: {
          title,
          preview,
          metadata: metadata as Prisma.InputJsonValue,
          folderId,
          updatedAt: new Date(),
        },
        create: {
          title,
          preview,
          path,
          metadata: metadata as Prisma.InputJsonValue,
          folderId,
        },
      });

      // Create or update article content
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
  }

  /**
   * Delete an article by path
   */
  async deleteArticle(path: string): Promise<void> {
    // First find the article to get its ID
    const article = await this.prisma.article.findUnique({
      where: { path },
      select: { id: true },
    });

    if (!article) {
      throw new Error(`Article to delete not found: ${path}`);
    }

    // Use a transaction to ensure all related data is deleted consistently
    await this.prisma.$transaction(async tx => {
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
      // Note: This is actually handled by the cascade delete,
      // but we're explicit here for clarity
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
  }

  /**
   * Create relations between articles
   */
  async createRelations(
    articlesMap: Map<string, Article>,
    logger: Logger
  ): Promise<number> {
    let relationsCreated = 0;
    const rootFolder = process.env.WIKI_DIRECTORY?.replace(
      /\\/g,
      "\\\\" // Escape backslashes for regex
    ).replace(
      /\//g,
      "\\/" // Escape slashes for regex
    );

    for (const [articlePath, article] of articlesMap.entries()) {
      // Get the article content
      const articleContent = await this.prisma.articleContent.findUnique({
        where: { articleId: article.id },
      });

      if (!articleContent) {
        logger.warn(`No content found for article: ${articlePath}`);
        continue;
      }

      const rawRelations =
        articleContent.content.match(/\[\[([^\]]+)\]\]/g) || [];

      for (const link of rawRelations) {
        const linkTexts = link.slice(2, -2).trim().split("|");
        let relatedPath;

        if (rootFolder && linkTexts[0].startsWith(rootFolder)) {
          const relativePath = linkTexts[0]
            .slice(`${rootFolder}/`.length)
            .replace(/\\+$/, "");
          relatedPath = this.formatArticlePath(relativePath, "");
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

            // Skip if can't find the article (shouldn't happen)
            if (!relatedArticle) {
              logger.warn(`Related article not found for path: ${relatedPath}`);
              continue;
            }

            await this.prisma.articleRelation.upsert({
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
            relationsCreated++;
          } catch (error) {
            logger.warn(
              `Failed to create relation: ${articlePath} -> ${relatedPath} : ${error}`
            );
          }
        }
      }
    }

    return relationsCreated;
  }

  /**
   * Format an article path for consistency
   * Remove the base path (vaultPath + wikiDirectory) from the filePath
   */
  formatArticlePath(filePath: string, basePath: string): string {
    // Remove base path if it exists
    let formattedPath = filePath.replace(/\\/g, "/");
    const formattedBasePath = basePath.replace(/\\/g, "/");
    if (formattedBasePath && formattedPath.startsWith(formattedBasePath)) {
      formattedPath = formattedPath.substring(formattedBasePath.length);
    }

    // Remove leading slash
    formattedPath = formattedPath.startsWith("/")
      ? formattedPath.substring(1)
      : formattedPath;

    // Ensure .md extension is removed
    formattedPath = formattedPath.endsWith(".md")
      ? formattedPath.slice(0, -3)
      : formattedPath;

    return formattedPath;
  }

  /**
   * Get or create a folder hierarchy for an article
   */
  async getOrCreateFolderHierarchy(
    folderPath: string,
    logger: Logger
  ): Promise<number | null> {
    // Root folder case (no path)
    if (
      !folderPath ||
      folderPath === "" ||
      folderPath === "/" ||
      folderPath === "\\" ||
      folderPath === "."
    ) {
      return null; // Return null to indicate no folder
    }

    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";
    let parentId: number | null = null; // Start with null for top-level folders

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      try {
        const folder: Folder | null = await this.prisma.folder.findFirst({
          where: {
            // Search by constructed path
            AND: [{ name: part }, { parentId }],
          },
        });

        if (folder) {
          parentId = folder.id;
        } else {
          const newFolder: Folder = await this.prisma.folder.create({
            data: {
              name: part,
              parentId, // Will be null for top-level folders
            },
          });
          logger.info(`Created folder: ${part}`, "📁");
          parentId = newFolder.id;
        }
      } catch (error) {
        logger.error(
          `Failed to process folder ${part}: ${error}`,
          error as Error
        );
        throw error;
      }
    }

    return parentId ?? 0; // Return parentId or 0 if null
  }
}
