import path from "path";

/**
 * Format an article path for consistency
 * @param filePath Original file path
 * @param basePath Base path to remove
 * @returns Formatted path
 */
export function formatArticlePath(filePath: string, basePath: string): string {
  // Remove base path if it exists
  let formattedPath = filePath;
  if (basePath && formattedPath.startsWith(basePath)) {
    formattedPath = formattedPath.substring(basePath.length);
  }

  // Convert backslashes to forward slashes
  formattedPath = formattedPath.replace(/\\/g, "/");

  // Remove leading slash
  formattedPath = formattedPath.startsWith("/")
    ? formattedPath.substring(1)
    : formattedPath;

  // Ensure .md extension is removed
  formattedPath = formattedPath.endsWith(".md")
    ? formattedPath.slice(0, -3)
    : formattedPath;

  return formattedPath;
}

/**
 * Get the parent directory of a path
 * @param filePath File path
 * @returns Parent directory path
 */
export function getParentDirectory(filePath: string): string {
  return path.dirname(filePath);
}

/**
 * Get the filename from a path
 * @param filePath File path
 * @param removeExtension Whether to remove the file extension
 * @returns Filename
 */
export function getFilename(
  filePath: string,
  removeExtension: boolean = false
): string {
  const filename = path.basename(filePath);
  if (removeExtension) {
    const extname = path.extname(filename);
    return filename.slice(0, -extname.length);
  }
  return filename;
}

/**
 * Join path segments
 * @param segments Path segments to join
 * @returns Joined path
 */
export function joinPaths(...segments: string[]): string {
  return path.join(...segments);
}

/**
 * Get relative path between two paths
 * @param from Source path
 * @param to Destination path
 * @returns Relative path
 */
export function getRelativePath(from: string, to: string): string {
  return path.relative(from, to);
}
