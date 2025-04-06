/**
 * Database public API
 */
import { ImportManager } from "./core/import";
import { LocalGitAdapter } from "./adapters/local-git.adapter";
import { WebhookAdapter } from "./adapters/webhook.adapter";
import { ArticleManager } from "./core/article";
import { DatabaseManager } from "./core/database";

// Re-export types
export * from "./types/import.types";

// Export database facade
export {
  ImportManager,
  LocalGitAdapter,
  WebhookAdapter,
  ArticleManager,
  DatabaseManager,
};
