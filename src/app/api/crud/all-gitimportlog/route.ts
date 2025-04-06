import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import {
  getPaginationParams,
  createPaginatedResponse,
} from "../../../../utils/api/pagination.utils";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const pagination = getPaginationParams(req);

    // TODO : database operation should not be done here, but in a service layer
    // Get git import logs with pagination
    const gitImportLogs = await prisma.gitImportLog.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        importedAt: "desc",
      },
    });

    // Get total count for pagination
    const total = await prisma.gitImportLog.count();

    return NextResponse.json(
      createPaginatedResponse(gitImportLogs, total, pagination),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching git import logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch git import logs" },
      { status: 500 }
    );
  }
}
