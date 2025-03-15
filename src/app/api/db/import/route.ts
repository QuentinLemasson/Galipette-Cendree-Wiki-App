import { importVaultContent } from "@/utils/db/dbOperations";
import { NextResponse } from "next/server";

/**
 * @route POST /api/db/import
 * @description Imports markdown files from the vault directory into the database
 * @returns {Object} Object containing import statistics
 * @returns {boolean} Object.success - Whether the import was successful
 * @returns {string} Object.message - A message describing the result of the operation
 * @returns {Object} Object.stats - Statistics about the import
 * @returns {number} Object.stats.articlesImported - The number of articles imported
 * @returns {number} Object.stats.relationsCreated - The number of relations created
 * @throws {Error} 500 - If there is an error importing the vault content
 */
export async function POST(): Promise<NextResponse> {
  try {
    const result = await importVaultContent();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing vault content:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
