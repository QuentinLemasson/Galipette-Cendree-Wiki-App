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
    // Get articles with pagination
    const articles = await prisma.article.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        updatedAt: "desc",
      },
      include: {
        folder: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.article.count();

    return NextResponse.json(
      createPaginatedResponse(articles, total, pagination),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching articles:", error);
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500 }
    );
  }
}
