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
    // Get article tags with pagination
    const articleTags = await prisma.articleTag.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: [
        {
          articlePath: "asc",
        },
        {
          tagId: "asc",
        },
      ],
      include: {
        article: {
          select: {
            id: true,
            title: true,
            path: true,
          },
        },
        tag: true,
      },
    });

    // Get total count for pagination
    const total = await prisma.articleTag.count();

    return NextResponse.json(
      createPaginatedResponse(articleTags, total, pagination),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching article tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch article tags" },
      { status: 500 }
    );
  }
}
