import { Client } from "pg";
import dotenv from "dotenv";
import { Article } from "../../types/db.types.ts";

/*
This file contains functions that directly interact with the PostgreSQL database using the pg library. 
These functions are intended to be used only on the server-side, such as during the build process.
*/

// Load environment variables
dotenv.config({ path: ".env.local" });

/**
 * Get a connected database client
 */
async function getDbClient(): Promise<Client> {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: Number(process.env.DB_PORT),
  });

  await client.connect();
  return client;
}

/**
 * Retrieves an article from the database by its path
 * @param path - The path of the article (without .md extension)
 * @returns The article object or null if not found
 */
export async function getArticleByPath(path: string): Promise<Article | null> {
  const client = await getDbClient();
  try {
    const result = await client.query<Article>(
      "SELECT title, content, path, metadata, folder_id FROM articles WHERE path = $1",
      [path]
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error("Error fetching article by path:", error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Retrieves all article paths from the database
 * @returns Array of article paths
 */
export async function getAllArticlePaths(): Promise<string[]> {
  const client = await getDbClient();
  try {
    const result = await client.query<{ path: string }>(
      "SELECT path FROM articles ORDER BY path"
    );
    return result.rows.map(row => row.path);
  } catch (error) {
    console.error("Error fetching article paths:", error);
    throw error;
  } finally {
    await client.end();
  }
}
