import type { Client } from "pg";
import path from "path";
import { extractMetadata, formatArticlePath } from "./markdown.utils.ts";
import fs from "fs";
import { Logger } from "./logger.utils.ts";
import { Article, Folder } from "../../types/db.types.ts";

/**
 * Ensures the root folder exists in the database and returns its ID.
 * If the root folder does not exist, it is created.
 *
 * @param {Client} client - The PostgreSQL client.
 * @param {Logger} logger - The logger instance.
 * @returns {Promise<number>} The ID of the root folder.
 */
async function ensureRootFolder(
  client: Client,
  logger: Logger
): Promise<number> {
  try {
    // Check if root folder exists
    const result = await client.query<Folder>(
      "SELECT id FROM folders WHERE parent_id IS NULL AND name = 'root'"
    );

    if (result.rows.length > 0) {
      return result.rows[0].id;
    }

    // Create root folder if it doesn't exist
    const insertResult = await client.query<{ id: number }>(
      "INSERT INTO folders (name, parent_id) VALUES ('root', NULL) RETURNING id"
    );

    logger.info("Created root folder", "📁");
    return insertResult.rows[0].id;
  } catch (error) {
    logger.error("Error ensuring root folder:", error as Error);
    throw error;
  }
}

/**
 * Creates or gets the folder hierarchy for a given path
 * @param client - PostgreSQL client
 * @param folderPath - Path to the folder (e.g., "folder1/folder2")
 * @param logger - Logger instance
 * @returns The ID of the last folder in the path
 */
async function getOrCreateFolderHierarchy(
  client: Client,
  folderPath: string,
  logger: Logger
): Promise<number> {
  try {
    // Get root folder ID
    const rootId = await ensureRootFolder(client, logger);

    // If it's a root-level file
    if (!folderPath || folderPath === ".") {
      return rootId;
    }

    // Split path into folder names
    const folders = folderPath.split("/").filter(Boolean);
    let currentParentId = rootId;

    // Process each folder in the path
    for (const folderName of folders) {
      // Try to find existing folder under current parent
      const result = await client.query<Folder>(
        "SELECT id FROM folders WHERE name = $1 AND parent_id = $2",
        [folderName, currentParentId]
      );

      if (result.rows.length > 0) {
        currentParentId = result.rows[0].id;
        logger.info(
          `Found existing folder: ${folderName} (ID: ${currentParentId})`
        );
      } else {
        // Create new folder under current parent
        const insertResult = await client.query<{ id: number }>(
          "INSERT INTO folders (name, parent_id) VALUES ($1, $2) RETURNING id",
          [folderName, currentParentId]
        );
        currentParentId = insertResult.rows[0].id;
        logger.info(
          `Created new folder: ${folderName} (ID: ${currentParentId})`,
          "📁"
        );
      }
    }

    return currentParentId;
  } catch (error) {
    logger.error(
      `Error processing folder hierarchy for ${folderPath}:`,
      error as Error
    );
    throw error;
  }
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
  vaultPath: string,
  logger: Logger
): Promise<Map<string, Article>> => {
  logger.info("Starting to insert articles into the database...", "📚");

  const articlesMap = new Map();
  const articlesToInsert = [];

  // Create the map of articles to insert
  for (const filePath of markdownFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { metadata, content } = extractMetadata(fileContent, logger);
    const formattedPath = formatArticlePath(filePath, vaultPath);
    const title = path.basename(filePath, ".md");

    // Get folder path (everything before the last segment)
    const folderPath = path.dirname(formattedPath);
    const folderId = await getOrCreateFolderHierarchy(
      client,
      folderPath,
      logger
    );

    logger.info(
      `Inserting article -> ${title} (folder: ${folderPath || "root"})`,
      "📄"
    );

    articlesMap.set(formattedPath, { title, content, metadata });
    articlesToInsert.push({
      title,
      content,
      path: formattedPath,
      metadata: JSON.stringify(metadata || {}),
      folder_id: folderId,
    });
  }

  // Insert articles in batches
  if (articlesToInsert.length > 0) {
    const valuesClause = articlesToInsert
      .map(
        (_, index) =>
          `($${index * 5 + 1}, $${index * 5 + 2}, $${index * 5 + 3}, $${
            index * 5 + 4
          }, $${index * 5 + 5})`
      )
      .join(", ");

    const queryText =
      "INSERT INTO articles (title, content, path, metadata, folder_id) VALUES " +
      valuesClause +
      " ON CONFLICT (path) DO UPDATE SET " +
      "title = EXCLUDED.title, content = EXCLUDED.content, " +
      "metadata = EXCLUDED.metadata, folder_id = EXCLUDED.folder_id";

    const queryValues = articlesToInsert.flatMap(article => [
      article.title,
      article.content,
      article.path,
      article.metadata,
      article.folder_id,
    ]);

    try {
      await client.query(queryText, queryValues);
      logger.success(`Inserted ${articlesToInsert.length} articles.`);
    } catch (error) {
      logger.error("❌ Error inserting articles batch:", error as Error);
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
  articlesMap: Map<string, Article>,
  logger: Logger
): Promise<void> => {
  logger.info("Starting to insert relations into the database...", "📚");

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
        const linkTexts = link.slice(2, -2).trim().split("|");

        if (linkTexts.length === 2 && linkTexts[0].startsWith(rootFolder)) {
          // Remove rootFolder from the start of the links
          const relativePath = linkTexts[0]
            .slice(`${rootFolder}/`.length)
            .replace(/\\+$/, ""); // Remove rootFolder from the start of the link

          // Format the relative path
          return formatArticlePath(relativePath, "");
        } else {
          // Search for the article by title (replace spaces with underscores)
          const formattedTitle = linkTexts[0].replace(/ /g, "_");
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
        logger.info(
          `Found article relation: ${articlePath} -> ${relatedArticlePath}`,
          "🔗"
        );
        relationsToInsert.push({
          article_path: articlePath,
          related_article_path: relatedArticlePath,
        });
      } else {
        logger.warn(
          `Related article not found for relation: ${relatedArticlePath} referenced in ${articlePath}`
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
      logger.success(`Inserted ${relationsToInsert.length} relations.`);
    } catch (error) {
      logger.error("❌ Error inserting relations batch:", error as Error);
    }
  }
};

/**
 * Creates necessary indexes to optimize performance.
 * @param {Client} client - The PostgreSQL client.
 */
export const createIndexes = async (
  client: Client,
  logger: Logger
): Promise<void> => {
  logger.info("Starting to create indexes...", "🔍");

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
    {
      table: "folders",
      column: "parent_id",
      indexName: "idx_folders_parent_id",
      unique: false,
    },
    {
      table: "articles",
      column: "folder_id",
      indexName: "idx_articles_folder_id",
      unique: false,
    },
  ];

  // Create indexes
  for (const index of indexes) {
    const { table, column, indexName, unique } = index;
    const uniqueClause = unique ? "UNIQUE " : "";
    const columns = Array.isArray(column) ? column.join(", ") : column;

    try {
      await client.query(
        `CREATE ${uniqueClause}INDEX IF NOT EXISTS ${indexName} ON ${table} (${columns});`
      );
      logger.success(`Index created or already exists: ${indexName}`);
    } catch (error) {
      logger.error(`❌ Error creating index ${indexName}:`, error as Error);
      throw error;
    }
  }
};
