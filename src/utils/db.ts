import { Client } from 'pg';

// Type definitions for better TypeScript support
export interface Note {
  title: string;
  content: string;
  path: string;
  metadata: Record<string, unknown>;
}

// Get a connected database client
async function getDbClient() {
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
 * Retrieves a note from the database by its path
 * @param path - The path of the note including .md extension
 * @returns The note object or null if not found
 */
export async function getNoteByPath(path: string): Promise<Note | null> {
  const client = await getDbClient();
  try {
    const result = await client.query<Note>(
      'SELECT title, content, path, metadata FROM notes WHERE path = $1',
      [path]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Retrieves all note paths from the database
 * @returns Array of note paths
 */
export async function getAllNotePaths(): Promise<string[]> {
  const client = await getDbClient();
  try {
    const result = await client.query<{ path: string }>(
      'SELECT path FROM notes ORDER BY path'
    );
    return result.rows.map(row => row.path);
  } catch (error) {
    console.error('Error fetching note paths:', error);
    throw error;
  } finally {
    await client.end();
  }
} 