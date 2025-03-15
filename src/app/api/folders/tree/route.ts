import { getFolderTree } from "@/data/articles";
import { NextResponse } from "next/server";

/**
 * @route GET /api/folders/tree
 * @description Retrieves the folder structure with articles
 * @returns {Object[]} Array of folders with their articles
 * @returns {number} Object[].id - The ID of the folder
 * @returns {string} Object[].name - The name of the folder
 * @returns {number|null} Object[].parentId - The ID of the parent folder, or null if it's a root folder
 * @returns {Object[]} Object[].articles - The articles in the folder
 * @returns {string} Object[].articles[].title - The title of the article
 * @returns {string} Object[].articles[].path - The path of the article
 * @throws {Error} 500 - If there is an error fetching the folder tree from the database
 */
export async function GET(): Promise<NextResponse> {
  try {
    const folderTree = await getFolderTree();
    return NextResponse.json(folderTree);
  } catch (error) {
    console.error("Error fetching folder tree:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}
