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
    // Get article relations with pagination
    const relations = await prisma.articleRelation.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        id: "asc",
      },
      include: {
        article: {
          select: {
            id: true,
            title: true,
            path: true,
          },
        },
        relatedArticle: {
          select: {
            id: true,
            title: true,
            path: true,
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.articleRelation.count();

    return NextResponse.json(
      createPaginatedResponse(relations, total, pagination),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching article relations:", error);
    return NextResponse.json(
      { error: "Failed to fetch article relations" },
      { status: 500 }
    );
  }
}
