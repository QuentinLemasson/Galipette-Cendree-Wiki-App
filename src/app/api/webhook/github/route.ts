import { importVaultContent } from "@/utils/db/importOperations";
import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * @route POST /api/webhook/github
 * @description Webhook endpoint for GitHub push events
 * @param {Object} request - The request object containing GitHub webhook payload
 * @returns {Object} Object containing import statistics
 * @throws {Error} 401 - If the webhook signature is invalid
 * @throws {Error} 500 - If there is an error processing the webhook
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    // Clone the request to read the body twice (once for verification, once for processing)
    const clonedRequest = request.clone();

    // Get the raw payload for signature verification
    const rawPayload = await clonedRequest.text();
    const payload = JSON.parse(rawPayload);

    // Verify webhook signature if secret is configured
    if (process.env.GITHUB_WEBHOOK_SECRET) {
      const signature = request.headers.get("x-hub-signature-256");

      if (!signature) {
        return NextResponse.json(
          { success: false, error: "Missing webhook signature" },
          { status: 401 }
        );
      }

      const hmac = crypto.createHmac(
        "sha256",
        process.env.GITHUB_WEBHOOK_SECRET
      );
      hmac.update(rawPayload);
      const calculatedSignature = `sha256=${hmac.digest("hex")}`;

      if (signature !== calculatedSignature) {
        return NextResponse.json(
          { success: false, error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    // Only process push events to the configured branch
    const targetBranch = process.env.GIT_BRANCH || "main";
    const branch = payload.ref?.replace("refs/heads/", "");

    if (branch !== targetBranch) {
      return NextResponse.json({
        success: true,
        message: `Skipped import for branch ${branch} (only processing ${targetBranch})`,
      });
    }

    // Call the importVaultContent function with webhook mode
    const result = await importVaultContent({
      mode: "webhook",
      webhookPayload: payload,
      wikiSubdir: process.env.WIKI_DIRECTORY,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error processing webhook:", error);
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
