const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const yaml = require("js-yaml");
require("dotenv").config({ path: ".env.local" });

const formatArticlePath = filePath => {
  return filePath
    .replace(`${process.env.VAULT_PATH}\\`, "")
    .replace(/\\/g, "/")
    .replace(".md", "")
    .replaceAll(" ", "_");
};

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

const importVaultContent = async (client, directory) => {
  const entries = fs.readdirSync(directory);

  for (const entry of entries) {
    const filePath = path.join(directory, entry);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && entry.endsWith(".md")) {
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { metadata, content } = extractMetadata(fileContent);

      try {
        await client.query(
          "INSERT INTO articles (title, content, path, metadata) VALUES ($1, $2, $3, $4)",
          [
            entry.replace(".md", ""),
            content,
            formatArticlePath(filePath),
            JSON.stringify(metadata || {}),
          ]
        );

        console.log("*********************");
        console.log(`Imported: ${formatArticlePath(filePath)}`);
        console.log("Metadata:", metadata);
      } catch (error) {
        console.error(`Error importing file ${filePath}:`, error);
      }
    } else if (stats.isDirectory()) {
      await importVaultContent(client, filePath);
    }
  }
};

const main = async () => {
  console.log(
    `Importing from ${process.env.VAULT_PATH} into ${process.env.DB_DATABASE} on ${process.env.DB_HOST}`
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

    const articlesDirectory = process.env.VAULT_PATH; // Using env variable for articles directory
    await importVaultContent(client, articlesDirectory);
  } catch (error) {
    console.error("Error importing vault:", error);
  } finally {
    await client.end();
  }
};

main();
