import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

const { Client } = pkg;

// Load environment variables
dotenv.config({ path: ".env.local" });

const app = express();
const port = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection helper
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

// API Routes
app.get("/api/articles/:id", async (req, res) => {
  const client = await getDbClient();
  try {
    const result = await client.query(
      "SELECT id, title, content, path, metadata FROM articles WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching article by ID:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

app.get("/api/articles/path/*", async (req, res) => {
  const path = req.params["0"];
  const client = await getDbClient();

  try {
    const result = await client.query(
      "SELECT id, title, content, path, metadata FROM articles WHERE path = $1",
      [path]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching article by path:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

app.get("/api/articles", async (req, res) => {
  const client = await getDbClient();
  try {
    const result = await client.query(
      "SELECT id, title, path FROM articles ORDER BY path"
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching articles:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

// Start server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
