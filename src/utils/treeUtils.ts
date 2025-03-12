import { FolderNode } from "@/types/wiki";

export const buildTree = (folders: FolderNode[]) => {
  const folderMap = new Map<number, FolderNode>();
  const tree: FolderNode[] = [];

  // Create map of all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  // Build tree structure
  folderMap.forEach(folder => {
    if (folder.parentId === 1 || folder.parentId === null) {
      tree.push(folder);
    } else {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        if (!parent.children) parent.children = [];
        parent.children.push(folder);
      }
    }
  });

  return tree;
};

export const sortTreeItems = (a: FolderNode, b: FolderNode): number => {
  // Folders come before articles
  if (!!a.children && !b.children) return -1;
  if (!a.children && !!b.children) return 1;

  // Alphabetical sorting
  return a.name.localeCompare(b.name);
};
