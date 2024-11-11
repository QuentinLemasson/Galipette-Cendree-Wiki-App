import { Client } from "pg";

// Database connection helper
export async function getDbClient() {
  let client;

  if (process.env.NODE_ENV === "production") {
    client = new Client({
      connectionString: process.env.NEON_DB_URL,
      ssl: true,
    });
  } else {
    client = new Client({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      host: process.env.DB_HOST,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT || "5432"),
    });
  }

  await client.connect();
  return client;
}
