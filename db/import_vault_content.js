import fs from "fs";
import path from "path";
import pkg from "pg";
const { Client } = pkg;
import yaml from "js-yaml";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Formats the article path by normalizing separators, removing the root vault path,
 * stripping the file extension, and replacing spaces with underscores.
 * @param {string} filePath - The full file path of the Markdown file.
 * @returns {string} - The formatted article path.
 */
const formatArticlePath = filePath => {
  // Normalize path separators based on OS
  const normalizedVaultPath = path.normalize(process.env.VAULT_PATH);

  return filePath
    .replace(normalizedVaultPath + path.sep, "")
    .replace(/\\/g, "/")
    .replace(".md", "")
    .replaceAll(" ", "_");
};

/**
 * Extracts metadata and content from a Markdown file.
 * @param {string} content - The raw content of the Markdown file.
 * @returns {Object} - An object containing metadata and content.
 */
const extractMetadata = content => {
  try {
    const matches = content.match(/^---\n([\s\S]*?)\n---/);

    if (matches) {
      const metadataText = matches[1];
      const metadata = yaml.load(metadataText);

      if (metadata && typeof metadata === "object") {
        const contentWithoutMetadata = content
          .replace(/^---\n[\s\S]*?\n---\n/, "")
          .trim();
        return {
          metadata: metadata,
          content: contentWithoutMetadata,
        };
      }
    }
  } catch (error) {
    console.warn("Error parsing metadata for content:", error);
  }

  return {
    metadata: {},
    content: content.trim(),
  };
};

/**
 * Recursively traverses the directory to collect all Markdown files.
 * @param {string} directory - The directory path to traverse.
 * @returns {Array<string>} - An array of Markdown file paths.
 */
const collectMarkdownFiles = directory => {
  let markdownFiles = [];
  const entries = fs.readdirSync(directory);

  for (const entry of entries) {
    const filePath = path.join(directory, entry);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && entry.endsWith(".md")) {
      markdownFiles.push(filePath);
    } else if (stats.isDirectory()) {
      markdownFiles = markdownFiles.concat(collectMarkdownFiles(filePath));
    }
  }

  return markdownFiles;
};

/**
 * Inserts all articles into the database using batch inserts.
 * @param {Client} client - The PostgreSQL client.
 * @param {Array<string>} markdownFiles - List of Markdown file paths.
 * @returns {Map<string, Object>} - A map of article paths to their content and metadata.
 */
const insertArticles = async (client, markdownFiles) => {
  const articlesMap = new Map();
  const articlesToInsert = [];

  for (const filePath of markdownFiles) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    const { metadata, content } = extractMetadata(fileContent);
    const formattedPath = formatArticlePath(filePath);
    const title = path.basename(filePath, ".md");

    // Store articles for later relations processing
    articlesMap.set(formattedPath, { title, content, metadata });

    // Prepare article data for batch insertion
    articlesToInsert.push({
      title,
      content,
      path: formattedPath,
      metadata: JSON.stringify(metadata || {}),
    });
  }

  // Batch insert articles
  if (articlesToInsert.length > 0) {
    const valuesClause = articlesToInsert
      .map(
        (_, index) =>
          `($${index * 4 + 1}, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4})`
      )
      .join(", ");

    const queryText =
      "INSERT INTO articles (title, content, path, metadata) VALUES " +
      valuesClause +
      " ON CONFLICT (path) DO NOTHING";

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
    }
  }

  return articlesMap;
};

/**
 * Creates necessary indexes to optimize performance.
 * @param {Client} client - The PostgreSQL client.
 */
const createIndexes = async client => {
  const indexes = [
    {
      table: "articles",
      column: "path",
      indexName: "idx_articles_path",
      unique: true,
    },
    {
      table: "article_relations",
      columns: ["article_path", "related_article_path"],
      indexName: "idx_article_relations_paths",
      unique: true,
    },
    {
      table: "tags",
      column: "id",
      indexName: "idx_tags_id",
      unique: true,
    },
    // Add more indexes if necessary
  ];

  for (const index of indexes) {
    const { table, column, indexName, unique } = index;
    const uniqueClause = unique ? "UNIQUE" : "";

    // For multiple columns
    const columns = Array.isArray(column) ? column.join(", ") : column;

    const queryText = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${table} (${columns}) ${uniqueClause};`;

    try {
      await client.query(queryText);
      console.log(`✅ Index created or already exists: ${indexName}`);
    } catch (error) {
      console.error(`❌ Error creating index ${indexName}:`, error);
    }
  }
};

/**
 * Main function to orchestrate the import process.
 */
const main = async () => {
  console.log(
    `🚀 Importing from ${process.env.VAULT_PATH} into ${process.env.DB_DATABASE} on ${process.env.DB_HOST}`
  );

  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log("🔗 Connected to PostgreSQL database.");

    const articlesDirectory = process.env.VAULT_PATH; // Using env variable for articles directory
    const markdownFiles = collectMarkdownFiles(articlesDirectory);

    console.log(
      `📁 Found ${markdownFiles.length} Markdown files. Starting import...`
    );

    // Begin Transaction
    await client.query("BEGIN");

    // Create Indexes for Optimization
    await createIndexes(client);

    // First Pass: Insert Articles (Batch Insert)
    const articlesMap = await insertArticles(client, markdownFiles);

    // Second Pass: Insert Relations (Batch Insert)
    await insertRelations(client, articlesMap);

    // Commit Transaction
    await client.query("COMMIT");

    console.log("✅ Import completed successfully.");
  } catch (error) {
    console.error("❌ Error importing vault:", error);
    try {
      await client.query("ROLLBACK");
      console.log("🔄 Transaction rolled back due to errors.");
    } catch (rollbackError) {
      console.error("❌ Error during rollback:", rollbackError);
    }
  } finally {
    await client.end();
    console.log("🔌 Disconnected from PostgreSQL database.");
  }
};

main();
