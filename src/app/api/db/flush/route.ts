import { flushDatabase } from "@/utils/db/dbOperations";
import { NextResponse } from "next/server";

/**
 * @route POST /api/db/flush
 * @description Flushes all data from the database
 * @returns {Object} Object containing the result of the operation
 * @returns {boolean} Object.success - Whether the operation was successful
 * @returns {string} Object.message - A message describing the result of the operation
 * @throws {Error} 500 - If there is an error flushing the database
 */
export async function POST(): Promise<NextResponse> {
  try {
    const result = await flushDatabase();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error flushing database:", error);
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
