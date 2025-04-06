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
    // Get tags with pagination
    const tags = await prisma.tag.findMany({
      skip: pagination.skip,
      take: pagination.take,
      orderBy: {
        name: "asc",
      },
      include: {
        articles: {
          include: {
            article: {
              select: {
                id: true,
                title: true,
                path: true,
              },
            },
          },
        },
      },
    });

    // Get total count for pagination
    const total = await prisma.tag.count();

    return NextResponse.json(createPaginatedResponse(tags, total, pagination), {
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
