import { NextResponse } from "next/server";
import { DatabaseManager } from "@/database";
import { Logger } from "@/utils/logger/logger.utils";

/**
 * @route POST /api/db/flush
 * @description Flushes all data from the database using Prisma
 * @returns {Object} Object containing the result of the operation
 * @returns {boolean} Object.success - Whether the operation was successful
 * @returns {string} Object.message - A message describing the result of the operation
 * @throws {Error} 500 - If there is an error flushing the database
 */
export async function POST(): Promise<NextResponse> {
  try {
    // Create a logger
    const logger = new Logger("api-flush.log");

    // Get DatabaseManager singleton
    const dbManager = DatabaseManager.getInstance();
    dbManager.setLogger(logger);

    // Run the flush operation
    const result = await dbManager.flushDatabase();

    // Return the result
    return NextResponse.json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Error flushing database:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
