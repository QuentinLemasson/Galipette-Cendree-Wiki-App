# Database Module

The database module is responsible for importing, processing, and managing markdown files from various sources (local git repositories and GitHub webhooks) and storing them in the database.

## Architecture

The module follows a clean architecture with adapters, core, and utility components:

```
src/database/
├── core/
│   ├── client.ts           # Singleton Prisma client
│   ├── article.ts          # Article management
│   ├── import.ts           # Core import logic
│   └── database.ts         # Database operations
├── adapters/
│   ├── local-git.adapter.ts # Local git repository adapter
│   └── webhook.adapter.ts   # GitHub webhook adapter
├── utils/
│   ├── path.utils.ts        # Path handling utilities
│   ├── markdown.utils.ts    # Markdown processing
│   ├── git-diff.utils.ts    # Git operations
│   ├── database.utils.ts    # Database operations
│   └── articles.ts          # Article utilities
├── types/
│   ├── import.types.ts      # Import-related types
│   └── db.types.ts          # Database types
└── operations/              # Legacy operations (to be migrated)
```

## Core Components

### Client

A singleton Prisma client to prevent connection exhaustion. All database connections should use this client.

### Article Manager

Manages article operations:

- Creating and updating articles
- Managing article relationships
- Managing folder hierarchies

### Import Manager

Manages import operations:

- Full imports (importing the entire repository)
- Differential imports (importing only changed files)
- Tracking import metadata and logs

### Database Manager

Manages database operations:

- Flushing all database tables
- Safe transaction handling
- Detailed operation statistics

## Adapters

Adapters implement the `ImportSource` interface to standardize interactions with different content sources.

### Local Git Adapter

Handles importing from a local git repository:

- Finding markdown files
- Getting changes between commits
- Reading file content

### Webhook Adapter

Handles importing from GitHub webhooks:

- Processing webhook payloads
- Fetching content from GitHub API
- Managing authentication and API limitations

## Usage

The module provides a public API through `src/database/index.ts`:

```typescript
import {
  ImportManager,
  LocalGitAdapter,
  WebhookAdapter,
  DatabaseManager,
} from "@/database";

// Get the import manager singleton
const importManager = ImportManager.getInstance();

// Create an adapter
const localGitAdapter = new LocalGitAdapter("/path/to/repo", "main");

// Run an import
const result = await importManager.import(localGitAdapter, {
  mode: "diff",
  sourceType: "local-git",
});

// Database operations
const dbManager = DatabaseManager.getInstance();
const flushResult = await dbManager.flushDatabase();
```

## Future Improvements

1. Move remaining operations from `/operations` into the new structure
2. Improve error handling and logging
3. Add support for more content sources (GitLab, SVN, etc.)

# Database Manager

Manages database operations like flushing.

- Clearing all database tables
- Safe transaction handling
- Detailed statistics reporting
