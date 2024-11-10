import { getDbClient } from "@/utils/server/getDbClient.lib";
import { Article } from "types/db.types";

export async function getArticlePaths(): Promise<{ path: string }[]> {
  const client = await getDbClient();
  try {
    const result = await client.query(
      "SELECT path FROM articles ORDER BY path"
    );
    return result.rows;
  } finally {
    await client.end();
  }
}

export async function getArticleByPath(path: string): Promise<Article | null> {
  const client = await getDbClient();
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
    return result.rows[0] || null;
  } finally {
    await client.end();
  }
}
