import { NextRequest, NextResponse } from "next/server";
import { getDbClient } from "@/utils/server/getDbClient.lib";

type RouteParams = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(
  request: NextRequest,
  context: RouteParams
): Promise<NextResponse> {
  const path = (await context.params).slug.join("/");

  let client;
  try {
    client = await getDbClient();
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      { error: "Database connection failed" },
      { status: 500 }
    );
  }

  try {
    const query = `
      SELECT 
        a.title, 
        a.content, 
        a.path, 
        a.metadata,
        COALESCE(
          (
            SELECT json_agg(related_obj)
            FROM (
              SELECT DISTINCT jsonb_build_object(
                'title', related_a.title,
                'content', related_a.content,
                'path', related_a.path,
                'metadata', related_a.metadata
              ) as related_obj
              FROM article_relations ar2
              JOIN articles related_a ON ar2.related_article_path = related_a.path
              WHERE ar2.article_path = a.path
            ) t
          ),
          '[]'::json
        ) AS related_articles,
        COALESCE(
          (
            SELECT json_agg(mention_obj)
            FROM (
              SELECT DISTINCT jsonb_build_object(
                'title', mention_a.title,
                'content', mention_a.content,
                'path', mention_a.path,
                'metadata', mention_a.metadata
              ) as mention_obj
              FROM article_relations mention_ar2
              JOIN articles mention_a ON mention_ar2.article_path = mention_a.path
              WHERE mention_ar2.related_article_path = a.path
            ) t
          ),
          '[]'::json
        ) AS mention_articles
      FROM articles a
      WHERE a.path = $1 OR a.path = $1 || '/index'
    `;

    const result = await client.query(query, [path]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching article by path:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
