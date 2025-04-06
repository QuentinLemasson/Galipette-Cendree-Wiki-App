import { NextResponse } from "next/server";
import { execSync } from "child_process";
import crypto from "crypto";

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!process.env.GITHUB_WEBHOOK_SECRET) {
    console.warn("GITHUB_WEBHOOK_SECRET is not set");
    return false;
  }

  const hmac = crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET);
  const calculatedSignature = `sha256=${hmac.update(payload).digest("hex")}`;
  return crypto.timingSafeEqual(
    Buffer.from(calculatedSignature),
    Buffer.from(signature)
  );
}

/**
 * POST /api/webhook/github
 * Handle GitHub webhook events
 */
export async function POST(request: Request) {
  try {
    const payload = await request.text();
    const signature = request.headers.get("x-hub-signature-256");

    // Verify webhook signature
    if (!signature || !verifySignature(payload, signature)) {
      return NextResponse.json(
        { status: "error", message: "Invalid signature" },
        { status: 401 }
      );
    }

    const event = request.headers.get("x-github-event");
    const data = JSON.parse(payload);

    // Only process push events to the main branch
    if (event === "push" && data.ref === "refs/heads/main" && !data.deleted) {
      // Run diff-based import
      execSync("ts-node scripts/import-diff.script.ts", {
        stdio: "inherit",
        env: {
          ...process.env,
          GITHUB_SHA: data.after,
          GITHUB_BEFORE: data.before,
        },
      });

      return NextResponse.json({
        status: "success",
        data: {
          event,
          commitHash: data.after,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Acknowledge other events
    return NextResponse.json({
      status: "success",
      data: {
        event,
        message: "Event acknowledged but no action taken",
      },
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { status: "error", message: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhook/github
 * Test endpoint for webhook configuration
 */
export async function GET() {
  return NextResponse.json({
    status: "success",
    data: {
      message: "GitHub webhook endpoint is configured correctly",
      timestamp: new Date().toISOString(),
    },
  });
}
