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

app.get("/api/articles/path/*", async (req, res) => {
  const path = req.params["0"];
  const client = await getDbClient();

  console.log(`🔄 Trying to fetch article by path: ${path}...`);

  try {
    const query = `
      SELECT 
        a.title, 
        a.content, 
        a.path, 
        a.metadata,
        json_agg(
          json_build_object(
            'title', related_a.title,
            'content', related_a.content,
            'path', related_a.path,
            'metadata', related_a.metadata
          )
        ) AS related_articles
      FROM articles a
      LEFT JOIN article_relations ar ON a.path = ar.article_path
      LEFT JOIN articles related_a ON ar.related_article_path = related_a.path
      WHERE a.path = $1
      GROUP BY a.title, a.content, a.path, a.metadata
    `;

    const result = await client.query(query, [path]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Article not found" });
      return;
    }

    const article = result.rows[0];
    article.related_articles = article.related_articles.filter(
      ra => ra.path !== null
    );

    res.json(article);
  } catch (error) {
    console.error("❌ Error fetching article by path:", error.message);
    res
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  } finally {
    await client.end();
  }
});

app.get("/api/articlepaths", async (req, res) => {
  console.log("🔄 Trying to fetch article paths...");

  const client = await getDbClient();
  try {
    const result = await client.query(
      "SELECT path FROM articles ORDER BY path"
    );
    console.log(`🔍 Found ${result.rows.length} article paths`);
    res.json(result.rows);
  } catch (error) {
    console.error("❌ Error fetching article paths:", error);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    await client.end();
  }
});

// Start server
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
