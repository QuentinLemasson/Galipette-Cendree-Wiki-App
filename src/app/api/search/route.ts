import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ articles: [] });
  }

  // Get matches by title
  const titleMatches = await prisma.article.findMany({
    where: {
      title: { contains: query, mode: "insensitive" },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    take: 5,
  });

  // If we have 5 title matches, return them
  if (titleMatches.length >= 5) {
    return NextResponse.json({ articles: titleMatches });
  }

  // Get matches by tags
  const tagMatches = await prisma.article.findMany({
    where: {
      AND: [
        { NOT: { id: { in: titleMatches.map(a => a.id) } } }, // Exclude title matches
        {
          tags: {
            some: {
              tag: {
                name: { contains: query, mode: "insensitive" },
              },
            },
          },
        },
      ],
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    take: 5 - titleMatches.length,
  });

  // If we have enough combined matches, return them
  if (titleMatches.length + tagMatches.length >= 5) {
    return NextResponse.json({ articles: [...titleMatches, ...tagMatches] });
  }

  // Get matches by content
  const contentMatches = await prisma.article.findMany({
    where: {
      AND: [
        {
          NOT: {
            id: {
              in: [
                ...titleMatches.map(a => a.id),
                ...tagMatches.map(a => a.id),
              ],
            },
          },
        },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
    take: 5 - (titleMatches.length + tagMatches.length),
  });

  // Combine all results
  const allResults = [...titleMatches, ...tagMatches, ...contentMatches];

  return NextResponse.json({ articles: allResults });
}
