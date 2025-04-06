import { NextResponse } from "next/server";
import { ImportManager, LocalGitAdapter, WebhookAdapter } from "@/database";
import { Logger } from "@/utils/logger/logger.utils";

/**
 * GET /api/import/status
 * Get the current import status
 */
export async function GET() {
  try {
    const importManager = ImportManager.getInstance();
    const logger = new Logger("api-import.log", "Import Status Check");
    importManager.setLogger(logger);

    const lastImport = await importManager.getLastImport();

    return NextResponse.json({
      status: "success",
      data: lastImport || { status: "never_imported" },
    });
  } catch (error) {
    console.error("Error getting import status:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/import
 * Trigger a new import
 */
export async function POST(request: Request) {
  try {
    console.log("Importing...");
    // Parse request
    const {
      type = "diff",
      source = "local-git",
      payload = null,
      branch = "dev",
    } = await request.json();

    // Setup environment variables
    const vaultPath = process.env.VAULT_PATH;
    const wikiDir = process.env.WIKI_DIRECTORY;

    if (!vaultPath || !wikiDir) {
      throw new Error(
        "VAULT_PATH and WIKI_DIRECTORY environment variables must be set"
      );
    }

    // Create a logger
    const logger = new Logger("api-import.log", "Import Operation");

    // Get ImportManager singleton
    const importManager = ImportManager.getInstance();
    importManager.setLogger(logger);

    // Create the appropriate adapter based on source
    // Use the adapter pattern to interface with the import source
    let adapter;
    if (
      source === "webhook" &&
      payload &&
      process.env.NODE_ENV === "production"
    ) {
      logger.info("Creating webhook adapter", "🚀");
      adapter = new WebhookAdapter(payload, wikiDir, null, logger);
    } else {
      logger.info("Creating local git adapter", "🚀");
      adapter = new LocalGitAdapter(vaultPath, branch, wikiDir, logger);
    }

    // Run the import
    const result = await importManager.import(adapter, {
      mode: type === "full" ? "full" : "diff",
      sourceType: source === "webhook" ? "webhook" : "local-git",
      localGitPath: vaultPath,
      localGitBranch: "main",
      wikiSubdir: wikiDir,
      webhookPayload: payload,
    });

    logger.close();

    // Return the result
    return NextResponse.json({
      status: result.success ? "success" : "error",
      data: {
        type,
        commitHash: result.metadata.commitHash,
        timestamp: new Date().toISOString(),
        stats: result.stats,
        message: result.message,
      },
    });
  } catch (error) {
    console.error("Error triggering import:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}
