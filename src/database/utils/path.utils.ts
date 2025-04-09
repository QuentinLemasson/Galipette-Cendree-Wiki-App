import path from "path";

/**
 * @fileoverview Path manipulation utilities for consistent file handling
 *
 * @description
 * This file provides utility functions for manipulating and formatting file paths
 * in a consistent manner. It ensures that paths are handled uniformly throughout
 * the application, regardless of the operating system or file structure.
 *
 * @methods
 * - {@link formatArticlePath} - Formats article paths consistently
 * - {@link getParentDirectory} - Gets the parent directory of a path
 * - {@link getFilename} - Gets the filename from a path
 * - {@link joinPaths} - Joins path segments
 * - {@link getRelativePath} - Gets relative path between two paths
 *
 * @notes
 * - Normalizes path separators for cross-platform compatibility
 * - Handles edge cases like leading slashes and file extensions
 * - Provides consistent path formatting for database storage
 * - Supports both absolute and relative path operations
 */

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
