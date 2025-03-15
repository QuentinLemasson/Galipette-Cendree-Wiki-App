import { getArticlePaths } from "@/data/articles";
import { NextResponse } from "next/server";

/**
 * @route GET /api/articles/paths
 * @description Retrieves all article paths from the database in alphabetical order
 * @returns {Object[]} Array of objects containing article paths
 * @returns {string} Object[].path - The path of the article
 * @throws {Error} 500 - If there is an error fetching the paths from the database
 */
export async function GET() {
  try {
    const paths = await getArticlePaths();
    return NextResponse.json(paths);
  } catch (error) {
    console.error("Error fetching article paths:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
