/**
 * File metadata for import operations
 */
export interface FileMetadata {
  commitHash: string;
  timestamp: Date;
  author?: string;
  status?: string;
  error?: string | null;
  importType?: string;
  [key: string]: unknown;
}

/**
 * Standardized file representation for import operations
 */
export interface ImportFile {
  path: string;
  content: string;
  metadata: FileMetadata;
}

/**
 * Changed files from a Git source
 */
export interface ChangedFiles {
  added: string[];
  modified: string[];
  deleted: string[];
}

/**
 * Standardized import source interface
 */
export interface ImportSource {
  /**
   * Gets all files from the source
   */
  getFiles(): Promise<ImportFile[]>;

  /**
   * Gets only changed files since the last import
   */
  getChangedFiles(): Promise<ChangedFiles>;

  /**
   * Gets metadata about the current import source
   */
  getMetadata(): Promise<FileMetadata>;
}

/**
 * Import result data
 */
export interface ImportResult {
  success: boolean;
  message: string;
  stats: {
    articlesImported: number;
    relationsCreated: number;
    filesDeleted?: number;
  };
  metadata: FileMetadata;
}

/**
 * Import mode options
 */
export type ImportMode = "full" | "diff";

/**
 * Source type options
 */
export type SourceType = "local-git" | "webhook";

/**
 * Configuration for import operations
 */
export interface ImportConfig {
  mode: ImportMode;
  sourceType: SourceType;
  localGitPath?: string;
  localGitBranch?: string;
  wikiSubdir?: string;
  webhookPayload?: Record<string, unknown>;
}
