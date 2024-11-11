import { prisma } from "@/lib/prisma";
import { Article } from "types/db.types";

/**
 * Retrieves all article paths from the database in alphabetical order
 * @returns Promise containing an array of objects with article paths
 * @throws {Error} If there is an error fetching the paths from the database
 */
export async function getArticlePaths(): Promise<{ path: string }[]> {
  try {
    const articles = await prisma.article.findMany({
      select: {
        path: true,
      },
      orderBy: {
        path: "asc",
      },
    });
    return articles;
  } catch (error) {
    console.error("Error fetching article paths:", error);
    throw error;
  }
}

/**
 * Retrieves an article by its path, including related articles
 * @param path - The path of the article to retrieve
 * @returns Promise containing the article with related articles or null if not found
 * @throws {Error} If there is an error fetching the article from the database
 */
export async function getArticleByPath(path: string): Promise<Article | null> {
  try {
    const article = await prisma.article.findUnique({
      where: {
        path: path,
      },
      include: {
        relatedToArticles: {
          select: {
            relatedArticle: {
              select: {
                title: true,
                content: true,
                path: true,
                metadata: true,
              },
            },
          },
        },
        relatedFromArticles: {
          select: {
            article: {
              select: {
                title: true,
                content: true,
                path: true,
                metadata: true,
              },
            },
          },
        },
      },
    });

    if (!article) return null;

    return {
      title: article.title,
      content: article.content,
      path: article.path,
      metadata: article.metadata as Record<string, unknown>,
      related_articles: article.relatedToArticles.map(
        rel => rel.relatedArticle
      ) as Article[],
      mention_articles: article.relatedFromArticles.map(
        rel => rel.article
      ) as Article[],
    };
  } catch (error) {
    console.error("Error fetching article:", error);
    throw error;
  }
}

/**
 * Searches for articles containing the given query in title or content
 * @param query - The search query string
 * @returns Promise containing an array of matching articles
 * @throws {Error} If there is an error searching articles in the database
 */
export async function searchArticles(query: string): Promise<Article[]> {
  try {
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: 10,
    });
    return articles as Article[];
  } catch (error) {
    console.error("Error searching articles:", error);
    throw error;
  }
}

/**
 * Finds articles that share tags with the specified article
 * @param articlePath - The path of the article to find related articles for
 * @returns Promise containing an array of related articles
 * @throws {Error} If there is an error fetching related articles from the database
 */
export async function getRelatedArticlesByTags(
  articlePath: string
): Promise<Article[]> {
  try {
    const article = await prisma.article.findUnique({
      where: { path: articlePath },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!article) return [];

    const tagIds = article.tags.map(t => t.tagId);

    return (await prisma.article.findMany({
      where: {
        tags: {
          some: {
            tagId: {
              in: tagIds,
            },
          },
        },
        NOT: {
          path: articlePath,
        },
      },
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
      take: 5,
    })) as Article[];
  } catch (error) {
    console.error("Error fetching related articles by tags:", error);
    throw error;
  }
}

/**
 * Retrieves the folder structure with articles
 * @returns Promise containing an array of folders with their articles
 * @throws {Error} If there is an error fetching the folder tree from the database
 */
export async function getFolderTree() {
  try {
    const folders = await prisma.folder.findMany({
      where: {
        parentId: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        parentId: true,
        articles: {
          select: {
            title: true,
            path: true,
          },
        },
      },
    });
    return folders;
  } catch (error) {
    console.error("Error fetching folder tree:", error);
    throw error;
  }
}
