import { getArticlePaths } from "@/database/utils/articles";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const paths = await getArticlePaths();
    return NextResponse.json(paths);
  } catch (error) {
    console.error("Error fetching article paths:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
