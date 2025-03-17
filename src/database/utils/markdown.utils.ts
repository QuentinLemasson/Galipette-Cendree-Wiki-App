import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { Logger } from "../../utils/logger/logger.utils.ts";

/**
 * Formats the article path by normalizing separators, removing the root vault path,
 * stripping the file extension, and replacing spaces with underscores.
 * @param {string} filePath - The full file path of the Markdown file.
 * @param {string} vaultPath - The root path of the vault.
 * @returns {string} - The formatted article path.
 */
export const formatArticlePath = (
  filePath: string,
  vaultPath: string
): string => {
  const normalizedVaultPath = path.normalize(vaultPath);

  return filePath
    .replace(normalizedVaultPath + path.sep, "")
    .replace(/\\/g, "/")
    .replace(".md", "")
    .replaceAll(" ", "_");
};

/**
 * Extracts metadata and content from a Markdown file.
 * @param {string} content - The raw content of the Markdown file.
 * @returns {Object} - An object containing metadata and content.
 */
export const extractMetadata = (content: string, logger: Logger) => {
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
    logger.warn("Error parsing metadata for content:", error as Error);
  }

  return {
    metadata: {},
    content: content.trim(),
  };
};

/**
 * Recursively traverses the directory to collect all Markdown files.
 * @param {string} directory - The directory path to traverse.
 * @returns {Array<string>} - An array of Markdown file paths.
 */
export const collectMarkdownFiles = (directory: string): string[] => {
  let markdownFiles: string[] = [];
  const entries = fs.readdirSync(directory);

  for (const entry of entries) {
    const filePath = path.join(directory, entry);
    const stats = fs.statSync(filePath);

    if (stats.isFile() && entry.endsWith(".md")) {
      markdownFiles.push(filePath);
    } else if (stats.isDirectory()) {
      markdownFiles = markdownFiles.concat(collectMarkdownFiles(filePath));
    }
  }

  return markdownFiles;
};
