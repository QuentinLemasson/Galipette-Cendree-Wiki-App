import fs from 'fs';
import path from 'path';

// Helper function to get all .md files recursively
export const getAllMarkdownFiles = (dirPath: string, arrayOfFiles: string[] = []): string[] => {
    const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // Recurse into subdirectory
      getAllMarkdownFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.md')) {
      // Normalize path separators to forward slashes and add to array
      arrayOfFiles.push(fullPath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/'));
    }
  });

  return arrayOfFiles;
}