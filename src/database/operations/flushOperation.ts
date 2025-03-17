import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Flushes all data from the database using Prisma
 * @returns {Promise<Object>} Object containing the result of the operation
 * @throws {Error} If there is an error flushing the database
 */
export async function flushDatabase() {
  try {
    console.log("Starting database flush operation...");

    // Enable more detailed logging for debugging purposes
    console.log("Database URL:", process.env.DB_URL ? "Configured" : "Missing");

    // Use a transaction to ensure all operations succeed or fail together
    await prisma.$transaction(async tx => {
      console.log("Deleting article relations...");
      const deletedRelations = await tx.articleRelation.deleteMany({});
      console.log(`Deleted ${deletedRelations.count} article relations`);

      console.log("Deleting article tags...");
      const deletedArticleTags = await tx.articleTag.deleteMany({});
      console.log(`Deleted ${deletedArticleTags.count} article tags`);

      console.log("Deleting tags...");
      const deletedTags = await tx.tag.deleteMany({});
      console.log(`Deleted ${deletedTags.count} tags`);

      console.log("Deleting articles...");
      const deletedArticles = await tx.article.deleteMany({});
      console.log(`Deleted ${deletedArticles.count} articles`);

      console.log("Deleting folders...");
      const deletedFolders = await tx.folder.deleteMany({});
      console.log(`Deleted ${deletedFolders.count} folders`);
    });

    console.log("*** Database flush completed successfully ***");
    return {
      success: true,
      message: "Database flushed successfully",
    };
  } catch (error) {
    console.error("Error flushing database:", error);
    const errorMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
    throw new Error(`Failed to flush database: ${errorMessage}`);
  }
}
