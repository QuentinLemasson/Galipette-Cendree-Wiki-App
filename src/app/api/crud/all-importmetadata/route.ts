import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getPaginationParams,
  createPaginatedResponse,
} from "src/utils/api/pagination.utils";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const pagination = getPaginationParams(req);

    // TODO : database operation should not be done here, but in a service layer
    // Get import metadata with pagination
    const importMetadata = await prisma.importMetadata.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        lastImport: "desc",
      },
    });

    // Get total count for pagination
    const total = await prisma.importMetadata.count();

    return NextResponse.json(
      createPaginatedResponse(importMetadata, total, pagination),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching import metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch import metadata" },
      { status: 500 }
    );
  }
}
