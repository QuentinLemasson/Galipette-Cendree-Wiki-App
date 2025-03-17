import { getRelatedArticlesByTags } from "@/database/utils/articles";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = {
  params: Promise<{ slug: string[] }>;
};

/**
 * @route GET /api/articles/related/[...slug]
 * @description Finds articles that share tags with the specified article
 * @param {Object} request - The request object
 * @param {Object} context - The context object containing route parameters
 * @param {string[]} context.params.slug - The path segments of the article
 * @returns {Object[]} Array of related articles
 * @returns {string} Object[].title - The title of the related article
 * @returns {string} Object[].content - The content of the related article
 * @returns {string} Object[].path - The path of the related article
 * @returns {Object} Object[].metadata - The metadata of the related article
 * @throws {Error} 404 - If the article is not found
 * @throws {Error} 500 - If there is an error fetching related articles from the database
 */
export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  const path = (await context.params).slug.join("/");

  try {
    const relatedArticles = await getRelatedArticlesByTags(path);

    if (!relatedArticles) {
      return NextResponse.json(
        { error: "No related articles found" },
        { status: 404 }
      );
    }

    return NextResponse.json(relatedArticles);
  } catch (error) {
    console.error("Error fetching related articles by tags:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
