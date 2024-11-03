import type { Client } from "pg";
import path from "path";
import { extractMetadata, formatArticlePath } from "./markdown.utils.ts";
import fs from "fs";

interface Article {
  title: string;
  content: string;
  path: string;
  metadata: Record<string, unknown>;
}

/**
 * Inserts all articles into the database using batch inserts.
 * @param {Client} client - The PostgreSQL client.
 * @param {Array<string>} markdownFiles - List of Markdown file paths.
 * @param {string} vaultPath - The root path of the vault.
 * @returns {Map<string, Object>} - A map of article paths to their content and metadata.
 */
export const insertArticles = async (
  client: Client,
  markdownFiles: string[],
  vaultPath: string
): Promise<Map<string, Article>> => {
  console.log("📚 Starting to insert articles into the database...");

  const articlesMap = new Map();
  const articlesToInsert = [];

  // Create the map of articles to insert
  for (const filePath of markdownFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { metadata, content } = extractMetadata(fileContent);
    const formattedPath = formatArticlePath(filePath, vaultPath);
    const title = path.basename(filePath, ".md");

    console.log("📄 Inserting article ->", title);

    articlesMap.set(formattedPath, { title, content, metadata });
    articlesToInsert.push({
      title,
      content,
      path: formattedPath,
      metadata: JSON.stringify(metadata || {}),
    });
  }

  // Insert articles in batches
  if (articlesToInsert.length > 0) {
    const valuesClause = articlesToInsert
      .map(
        (_, index) =>
          `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${
            index * 4 + 4
          })`
      )
      .join(", ");

    const queryText =
      "INSERT INTO articles (title, content, path, metadata) VALUES " +
      valuesClause +
      " ON CONFLICT (path) DO UPDATE SET title = EXCLUDED.title, content = EXCLUDED.content, metadata = EXCLUDED.metadata";

    const queryValues = articlesToInsert.flatMap(article => [
      article.title,
      article.content,
      article.path,
      article.metadata,
    ]);

    try {
      await client.query(queryText, queryValues);
      console.log(`✅ Inserted ${articlesToInsert.length} articles.`);
    } catch (error) {
      console.error("❌ Error inserting articles batch:", error);
      throw error;
    }
  }

  return articlesMap;
};

/**
 * Inserts all relations into the database using batch inserts.
 * @param {Client} client - The PostgreSQL client.
 * @param {Map<string, Article>} articlesMap - Map of article paths to their data.
 */
export const insertRelations = async (
  client: Client,
  articlesMap: Map<string, Article>
): Promise<void> => {
  console.log("📚 Starting to insert relations into the database...");

  const relationsToInsert: {
    article_path: string;
    related_article_path: string;
  }[] = [];

  // Extract rootFolder from VAULT_PATH
  const vaultPathParts = path
    .normalize(process.env.VAULT_PATH ?? "")
    .split(path.sep);
  const rootFolder = vaultPathParts[vaultPathParts.length - 1]
    .replace(
      /\\/g,
      "\\\\" // Escape backslashes for regex
    )
    .replace(
      /\//g,
      "\\/" // Escape slashes for regex
    );

  for (const [articlePath, { content }] of articlesMap.entries()) {
    // Extract related articles using regex [[Article Name]]
    const rawRelations = content.match(/\[\[([^\]]+)\]\]/g) || [];

    // Process each related article link
    const relatedArticles = rawRelations
      .map((link: string) => {
        // Extract the link text without brackets
        const linkText = link.slice(2, -2).trim();

        // Check if the link starts with rootFolder
        if (linkText.startsWith(rootFolder)) {
          // Remove rootFolder from the start of the link
          const relativePath = linkText.slice(`${rootFolder}/`.length);
          // Format the relative path
          return formatArticlePath(relativePath, "");
        } else {
          // Search for the article by title (replace spaces with underscores)
          const formattedTitle = linkText.replace(/ /g, "_");
          // Find the corresponding path in articlesMap
          for (const [pathKey, article] of articlesMap.entries()) {
            if (article.title.replace(/ /g, "_") === formattedTitle) {
              return pathKey;
            }
          }
          // If not found, return null
          return null;
        }
      })
      .filter((link: string | null): link is string => link !== null); // Remove any null values

    // Add relations to insert to the list
    for (const relatedArticlePath of relatedArticles) {
      if (articlesMap.has(relatedArticlePath)) {
        console.log(
          `🔗 Found article relation: ${articlePath} ${relatedArticlePath} for article: `
        );
        relationsToInsert.push({
          article_path: articlePath,
          related_article_path: relatedArticlePath,
        });
      } else {
        console.warn(
          `⚠️ Related article not found for relation: ${relatedArticlePath} referenced in ${articlePath}`
        );
        // Optionally, handle missing related articles (e.g., create stub articles or log for manual review)
      }
    }
  }

  // Batch insert relations
  if (relationsToInsert.length > 0) {
    const valuesClause = relationsToInsert
      .map((_, index) => `($${index * 2 + 1}, $${index * 2 + 2})`)
      .join(", ");

    const queryText =
      "INSERT INTO article_relations (article_path, related_article_path) VALUES " +
      valuesClause +
      " ON CONFLICT DO NOTHING";

    const queryValues = relationsToInsert.flatMap(relation => [
      relation.article_path,
      relation.related_article_path,
    ]);

    try {
      await client.query(queryText, queryValues);
      console.log(`✅ Inserted ${relationsToInsert.length} relations.`);
    } catch (error) {
      console.error("❌ Error inserting relations batch:", error);
    }
  }
};

/**
 * Creates necessary indexes to optimize performance.
 * @param {Client} client - The PostgreSQL client.
 */
export const createIndexes = async (client: Client): Promise<void> => {
  // Define indexes
  const indexes = [
    {
      table: "articles",
      column: "path",
      indexName: "idx_articles_path",
      unique: true,
    },
    {
      table: "article_relations",
      column: ["article_path", "related_article_path"],
      indexName: "idx_article_relations_paths",
      unique: true,
    },
    {
      table: "tags",
      column: "id",
      indexName: "idx_tags_id",
      unique: true,
    },
  ];

  // Create indexes
  for (const index of indexes) {
    const { table, column, indexName, unique } = index;
    const uniqueClause = unique ? "UNIQUE " : "";
    const columns = Array.isArray(column) ? column.join(", ") : column;

    try {
      console.log(
        "Trying to create index with query : ",
        `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${table} (${columns});`
      );
      await client.query(
        `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${table} (${columns});`
      );
      console.log(`✅ Index created or already exists: ${indexName}`);
    } catch (error) {
      console.error(`❌ Error creating index ${indexName}:`, error);
      throw error;
    }
  }
};
