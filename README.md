# Wiki Database Manager 📚

A set of tools to manage a PostgreSQL database for a markdown-based wiki system. This project provides utilities for importing markdown files, managing relations between articles, and maintaining database schema.

---

## 🎯 Objectives

- Import markdown files from a vault into a PostgreSQL database
- Maintain relations between articles
- Support metadata in YAML format
- Provide clean logging of operations
- Ensure data consistency through transactions
- Export and maintain database schema

---

## 🗄️ Database Schema

### Articles Table

- Primary storage for markdown content
- Supports metadata in JSONB format
- Unique path identifiers
- Hierarchical organization through folders

### Relations

- Article-to-article relations
- Tag system
- Folder hierarchy

For complete schema details, see [db.schema.md](db/db.schema.md)

---

## 📜 Scripts

### Import Vault Content

```bash
npm run import-vault
```

Imports markdown files from a specified vault directory into the database.

**Environment Variables Required:**

- `VAULT_PATH`: Path to the vault directory
- `DB_USER`: PostgreSQL username
- `DB_HOST`: PostgreSQL host
- `DB_DATABASE`: Database name
- `DB_PASSWORD`: PostgreSQL password
- `DB_PORT`: PostgreSQL port
- `API_PORT`: Express server port (default: 3001)
- `NEXT_PUBLIC_API_URL`: Frontend API URL

**Logs:** Located in `db/script-logs/import.log.txt`

### Export Schema

```bash
npm run export-schema
```

Exports current database schema to markdown format.

---

## 📋 Expected File Formats

### Markdown Files

**YAML frontmatter:**

```yaml
---
tags: [tag1, tag2]
category: example
custom_field: value
---
```

Article Title
Content goes here...

### Relations

Relations are detected from markdown links using the following format:

```markdown
[Link Text](path/to/article)
```

---

## 🛠️ Development

### Project Structure

```
.
├── db/
│ ├── script-logs/ # Operation logs
│ │ └── import.log.txt # Import operation logs
│ ├── script-utils/ # Utility functions
│ │ ├── logger.utils.ts # Logging utility
│ │ ├── markdown.utils.ts # Markdown processing
│ │ └── database.utils.ts # Database operations
│ ├── flush_db.sql # Database reset script
│ ├── db.schema.md # Database schema documentation
│ └── import-vault-content.script.ts # Main import script
├── src/
│ └── utils/
│ ├── db.server.ts # Server-side database utilities
│ └── db.client.ts # Client-side API utilities
└── package.json
```

### Utility Modules

#### Logger (`logger.utils.ts`)

- Timestamp format: `DD/MM/YYYY-HH-MM-SS`
- Log levels: INFO, ERROR, WARNING, SUCCESS
- Automatic log file creation and cleanup
- Emoji indicators for different message types

Example usage:

```typescript
const logger = new Logger("import.log.txt");
logger.info("Starting import...", "🚀");
logger.success("Operation completed");
logger.error("Error occurred", error);
logger.warn("Warning message");
```

#### Markdown Utils (`markdown.utils.ts`)

- YAML metadata extraction
- Path normalization
- Recursive file collection
- Content processing

#### Database Utils (`database.utils.ts`)

- Batch article insertion
- Index management
- Transaction handling
- Error recovery

### Setting Up Development Environment

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env.local` with required environment variables
4. Run database setup: `psql -f db/flush_db.sql`

---

## 🔍 Logging

Operations are logged with timestamps and emojis for better readability:

- 🚀 Script start
- 📁 File operations
- 🔗 Database connections
- ✅ Success messages
- ❌ Error messages
- ⚠️ Warnings

Log Format:

```
[03/11/2024-18:51:49] 🚀 Starting import...
[03/11/2024-18:51:49] 📁 Found 100 articles
[03/11/2024-18:51:49] 🔗 Connected to database
[03/11/2024-18:51:49] ✅ Import completed successfully
```

---

## ⚠️ Important Notes

1. Always backup your database before running import scripts
2. The import process uses transactions - if an error occurs, changes will be rolled back
3. Existing articles with the same path will be updated
4. File paths are normalized and spaces are replaced with underscores
5. Logs are cleared at the start of each import operation
6. The logger automatically creates the script-logs directory if it doesn't exist

### Git Ignore

The following paths are ignored:

```
/node_modules
/.next
/dist
/build
db/script-logs/
db/db.schema.md
db/reset_schema.sql
.env
.env.local
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
