import { DatabaseManager } from "../core/database";

/**
 * @deprecated Use DatabaseManager.getInstance().flushDatabase() instead.
 * This function will be removed in a future version.
 *
 * Flushes all data from the database using Prisma
 * @returns {Promise<Object>} Object containing the result of the operation
 * @throws {Error} If there is an error flushing the database
 */
export async function flushDatabase() {
  console.warn(
    "DEPRECATED: flushDatabase() is deprecated. Use DatabaseManager.getInstance().flushDatabase() instead."
  );

  try {
    // Use the new implementation
    const dbManager = DatabaseManager.getInstance();
    return await dbManager.flushDatabase();
  } catch (error) {
    console.error("Error flushing database:", error);
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
    throw new Error(`Failed to flush database: ${errorMessage}`);
  }
}
