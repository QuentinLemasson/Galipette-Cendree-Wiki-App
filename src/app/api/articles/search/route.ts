import { searchArticles } from "@/database/utils/articles";
import { NextRequest, NextResponse } from "next/server";

/**
 * @route GET /api/articles/search
 * @description Searches for articles containing the given query in title or content
 * @param {Object} request - The request object
 * @param {string} request.searchParams.q - The search query string
 * @returns {Object} Object containing an array of matching articles
 * @returns {Object[]} Object.articles - The matching articles
 * @returns {string} Object.articles[].title - The title of the article
 * @returns {string} Object.articles[].content - The content of the article
 * @returns {string} Object.articles[].path - The path of the article
 * @returns {Object} Object.articles[].metadata - The metadata of the article
 * @throws {Error} 500 - If there is an error searching articles in the database
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ articles: [] });
  }

  try {
    const articles = await searchArticles(query);
    return NextResponse.json({ articles });
  } catch (error) {
    console.error("Error searching articles:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
