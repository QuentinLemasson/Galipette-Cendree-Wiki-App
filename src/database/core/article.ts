import { Article, PrismaClient, Prisma } from "@prisma/client";
import { prisma } from "./client";
import { Logger } from "@/utils/logger/logger.utils";

/**
 * Core article management class with standardized article operations
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
   * Upsert an article with metadata
   */
  async upsertArticle(
    title: string,
    content: string,
    path: string,
    metadata: Record<string, unknown>,
    folderId: number
  ): Promise<Article> {
    return this.prisma.article.upsert({
      where: { path },
      update: {
        title,
        content,
        metadata: metadata as Prisma.InputJsonValue,
        folderId,
        updatedAt: new Date(),
      },
      create: {
        title,
        content,
        path,
        metadata: metadata as Prisma.InputJsonValue,
        folderId,
      },
    });
  }

  /**
   * Delete an article by path
   */
  async deleteArticle(path: string): Promise<void> {
    // First delete relations
    await this.prisma.articleRelation.deleteMany({
      where: {
        OR: [{ articlePath: path }, { relatedArticlePath: path }],
      },
    });

    // Then delete the article
    await this.prisma.article.delete({
      where: { path },
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
      const rawRelations = article.content.match(/\[\[([^\]]+)\]\]/g) || [];

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
            await this.prisma.articleRelation.upsert({
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
   */
  formatArticlePath(filePath: string, basePath: string): string {
    // Remove base path if it exists
    let formattedPath = filePath;
    if (basePath && formattedPath.startsWith(basePath)) {
      formattedPath = formattedPath.substring(basePath.length);
    }

    // Convert backslashes to forward slashes
    formattedPath = formattedPath.replace(/\\/g, "/");

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
  ): Promise<number> {
    // Root folder has ID 1
    if (!folderPath) return 1;

    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";
    let parentId = 1; // Root folder ID

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      const folder = await this.prisma.folder.findFirst({
        where: {
          // Search by constructed path
          AND: [{ name: part }, { parentId }],
        },
      });

      if (folder) {
        parentId = folder.id;
      } else {
        const newFolder = await this.prisma.folder.create({
          data: {
            name: part,
            parentId,
          },
        });
        logger.info(`Created folder: ${part}`, "📁");
        parentId = newFolder.id;
      }
    }

    return parentId;
  }
}
