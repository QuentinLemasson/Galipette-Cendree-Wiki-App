//** Collection of interfaces for git diff utilities */

export interface GitDiffResult {
  added: string[];
  modified: string[];
  deleted: string[];
  renamedFrom: Record<string, string>;
  renamedTo: Record<string, string>;
}

export interface GitFileStatus {
  status: "added" | "modified" | "deleted" | "renamed";
  oldPath?: string;
  newPath?: string;
}

export interface GitImportMetadata {
  branch?: string;
  author?: string;
  message?: string;
  timestamp?: string;
  [key: string]: unknown;
}

export interface GitImportLog {
  id: number;
  commit_hash: string;
  imported_at: Date;
  status: string;
  error: string | null;
  files_changed: number;
  metadata: Record<string, unknown>;
}
