import fs from "fs";
import path from "path";
import pg from "pg";
const { Client } = pg;
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const schemaPath = path.resolve(__dirname, "../prisma/db.schema.md");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: ".env.local" });

const client = new Client({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || "5432"),
});

const markdownLines = [];

const getTables = async () => {
  const res = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  return res.rows.map(row => row.table_name);
};

const getColumns = async table => {
  const res = await client.query(
    `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position;
    `,
    [table]
  );
  return res.rows;
};

const getPrimaryKeys = async table => {
  const res = await client.query(
    `
    SELECT kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = $1;
    `,
    [table]
  );
  return res.rows.map(row => row.column_name);
};

const getForeignKeys = async table => {
  const res = await client.query(
    `
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1;
    `,
    [table]
  );
  return res.rows;
};

const generateMarkdown = async () => {
  const tables = await getTables();

  for (const table of tables) {
    markdownLines.push(`## Table: \`${table}\``);
    markdownLines.push("");
    markdownLines.push("| Column | Data Type | Nullable | Default |");
    markdownLines.push("| --- | --- | --- | --- |");

    const columns = await getColumns(table);
    const primaryKeys = await getPrimaryKeys(table);
    const foreignKeys = await getForeignKeys(table);

    columns.forEach(column => {
      const { column_name, data_type, is_nullable, column_default } = column;
      const isPrimary = primaryKeys.includes(column_name);
      const fk = foreignKeys.find(fk => fk.column_name === column_name);
      let columnInfo = `\`${column_name}\``;
      if (isPrimary) columnInfo += " **PK**";
      if (fk)
        columnInfo += ` **FK** (references \`${fk.foreign_table_name}(${fk.foreign_column_name})\`)`;

      markdownLines.push(
        `| ${columnInfo} | ${data_type} | ${is_nullable} | \`${column_default}\` |`
      );
    });

    markdownLines.push("");
  }

  // Write to db.schema.md
  fs.writeFileSync(schemaPath, markdownLines.join("\n"), "utf8");
  console.log(`Database schema has been exported to ${schemaPath}`);
};

const main = async () => {
  try {
    await client.connect();
    await generateMarkdown();
  } catch (err) {
    console.error("Error exporting schema:", err);
  } finally {
    await client.end();
  }
};

main();
