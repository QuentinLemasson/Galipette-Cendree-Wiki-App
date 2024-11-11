import { Client } from "pg";

// Database connection helper
export async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DB_URL,
    ssl: true,
  });

  await client.connect();
  return client;
}
