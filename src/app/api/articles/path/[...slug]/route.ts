import { getArticleByPath } from "@/database/utils/articles";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ slug: string[] }>;
};

/**
 * @route GET /api/articles/path/[...slug]
 * @description Retrieves an article by its path, including related articles
 * @param {Object} request - The request object
 * @param {Object} context - The context object containing route parameters
 * @param {string[]} context.params.slug - The path segments of the article
 * @returns {Object} The article with related articles
 * @returns {string} Object.title - The title of the article
 * @returns {string} Object.content - The content of the article in markdown
 * @returns {string} Object.path - The path of the article
 * @returns {Object} Object.metadata - The metadata of the article
 * @returns {Object[]} Object.related_articles - Articles related to this article
 * @returns {Object[]} Object.mention_articles - Articles that mention this article
 * @throws {Error} 404 - If the article is not found
 * @throws {Error} 500 - If there is an error fetching the article from the database
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  const path = (await context.params).slug.join("/");

  try {
    const article = await getArticleByPath(path);

    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    console.error("Error fetching article by path:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
