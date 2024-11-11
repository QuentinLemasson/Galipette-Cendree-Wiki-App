import { prisma } from "@/lib/prisma";
import { Article } from "types/db.types";

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
