import { importVaultContent } from "@/database/operations/importOperations";
import { NextResponse } from "next/server";

/**
 * @route POST /api/db/import
 * @description Imports markdown files into the database (supports both local-git and webhook modes)
 * @param {Object} request - The request object
 * @param {string} request.body.mode - 'local-git' for dev mode, 'webhook' for production mode
 * @param {string} request.body.localGitPath - Path to local Git repository (for dev mode)
 * @param {string} request.body.localGitBranch - Branch to use in local Git repository (for dev mode)
 * @param {string} request.body.wikiSubdir - Subdirectory within the repository that contains the wiki files
 * @param {Object} request.body.webhookPayload - GitHub/GitLab webhook payload (for production mode)
 * @returns {Object} Object containing import statistics
 * @returns {boolean} Object.success - Whether the import was successful
 * @returns {string} Object.message - A message describing the result of the operation
 * @returns {Object} Object.stats - Statistics about the import
 * @returns {number} Object.stats.articlesImported - The number of articles imported
 * @returns {number} Object.stats.relationsCreated - The number of relations created
 * @throws {Error} 500 - If there is an error importing the content
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Parse request body
    const body = await request.json().catch(() => ({}));

    // Default to local-git mode in development, webhook in production
    const mode =
      body.mode ||
      (process.env.NODE_ENV === "development" ? "local-git" : "webhook");

    // Call the importVaultContent function with the appropriate options
    const result = await importVaultContent({
      mode,
      localGitPath: body.localGitPath,
      localGitBranch: body.localGitBranch,
      wikiSubdir: body.wikiSubdir,
      webhookPayload: body.webhookPayload,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error importing content:", error);
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
