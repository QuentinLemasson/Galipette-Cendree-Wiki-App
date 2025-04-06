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
    // Get folders with pagination
    const folders = await prisma.folder.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        id: "asc",
      },
      include: {
        parent: true,
        children: true,
        articles: {
          select: {
            id: true,
            title: true,
            path: true,
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.folder.count();

    return NextResponse.json(
      createPaginatedResponse(folders, total, pagination),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching folders:", error);
    return NextResponse.json(
      { error: "Failed to fetch folders" },
      { status: 500 }
    );
  }
}
