import { flushDatabase } from "@/utils/db/dbOperations";
import { NextResponse } from "next/server";

/**
 * @route POST /api/db/flush
 * @description Flushes all data from the database using Prisma
 * @returns {Object} Object containing the result of the operation
 * @returns {boolean} Object.success - Whether the operation was successful
 * @returns {string} Object.message - A message describing the result of the operation
 * @throws {Error} 500 - If there is an error flushing the database
 */
export async function POST(): Promise<NextResponse> {
  console.log("API route: /api/db/flush called");

  try {
    // Check if DB_URL is configured
    if (!process.env.DB_URL) {
      console.error("DB_URL environment variable is not set");
      return NextResponse.json(
        {
          success: false,
          error: "Database configuration error",
          details: "DB_URL environment variable is not set",
        },
        { status: 500 }
      );
    }

    console.log("Calling flushDatabase function...");
    const result = await flushDatabase();
    console.log("Database flush completed:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("API route error while flushing database:", error);

    // Create a more detailed error response
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;

    // Check for specific folder hierarchy error
    const isFolderHierarchyError =
      errorMessage.includes("FolderToFolder") ||
      errorMessage.includes("required relation");

    const errorResponse = {
      success: false,
      error: isFolderHierarchyError
        ? "Folder hierarchy constraint violation"
        : "Failed to flush database",
      details: errorMessage,
      suggestion: isFolderHierarchyError
        ? "The error is related to folder hierarchy constraints. The updated implementation should handle this."
        : undefined,
      stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
