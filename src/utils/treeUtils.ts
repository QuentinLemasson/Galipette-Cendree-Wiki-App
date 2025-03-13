import { FolderNode } from "@/types/wiki";
import { TTreeItem, TTreeMenu } from "@/components/ui/tree";

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

/**
 * Converts a FolderNode list structure to a TTreeMenu structure for the Tree component
 * @param folders Array of FolderNode objects
 * @returns TTreeMenu[] structure for the Tree component
 */
export const convertToTreeMenu = (folders: FolderNode[]): TTreeMenu[] => {
  const tree = buildTree(folders);

  // Function to recursively build the TTreeMenu structure with proper paths
  const buildTreeMenu = (
    node: FolderNode,
    parentPath: string = ""
  ): TTreeMenu => {
    // Create the current path by combining parent path with current node name
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

    // Convert children folders to TTreeMenu items
    const menus: TTreeMenu[] = node.children
      ? node.children.map(child => buildTreeMenu(child, currentPath))
      : [];

    // Convert articles to TTreeItem items
    const items: TTreeItem[] = node.articles.map(article => ({
      label: article.title,
      path: article.path,
    }));

    // Return the TTreeMenu structure for this node
    return {
      label: node.name,
      path: currentPath,
      menus,
      items,
    };
  };

  // Convert each top-level folder to a TTreeMenu
  return tree.map(folder => buildTreeMenu(folder));
};

export const sortTreeItems = (a: FolderNode, b: FolderNode): number => {
  // Folders come before articles
  if (!!a.children && !b.children) return -1;
  if (!a.children && !!b.children) return 1;

  // Alphabetical sorting
  return a.name.localeCompare(b.name);
};
