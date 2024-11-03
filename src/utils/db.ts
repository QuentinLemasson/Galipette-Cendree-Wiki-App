import { Article } from "../../types/db.types.ts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

/**
 * Retrieves a article from the database by its path
 * @param path - The path of the article including .md extension
 * @returns The article object or null if not found
 */
export async function getArticleByPath(path: string): Promise<Article | null> {
  try {
    const response = await fetch(`${API_URL}/articles/path/${path}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching article:", error);
    throw error;
  }
}

/**
 * Retrieves all article paths from the database
 * @returns Array of article paths
 */
export async function getAllArticlePaths(): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/articles`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const articles: Article[] = await response.json();
    return articles.map(article => article.path);
  } catch (error) {
    console.error("Error fetching article paths:", error);
    throw error;
  }
}
