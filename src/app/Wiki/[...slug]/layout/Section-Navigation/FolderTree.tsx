"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ArticleTreeItem {
  title: string;
  path: string;
}

interface FolderNode {
  id: number;
  name: string;
  parentId: number | null;
  articles: ArticleTreeItem[];
  children?: FolderNode[];
}

interface FolderTreeProps {
  initialData: FolderNode[];
}

const FolderTreeItem = ({
  node,
  level = 0,
}: {
  node: FolderNode;
  level?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="ml-2">
      <div
        className="flex items-center gap-2 cursor-pointer hover:text-indigo-500"
        onClick={() => setIsOpen(!isOpen)}
      >
        {(node.children?.length || node.articles.length) > 0 && (
          <span className="text-xs">{isOpen ? "▼" : "▶"}</span>
        )}
        <span className="font-medium">{node.name}</span>
      </div>

      {isOpen && (
        <div className="ml-4">
          {node.children?.map(child => (
            <FolderTreeItem key={child.id} node={child} level={level + 1} />
          ))}
          {node.articles.map(article => (
            <Link
              key={article.path}
              href={`/Wiki/${article.path}`}
              className="block py-1 hover:text-indigo-500 text-sm"
            >
              {article.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export const FolderTree = ({ initialData }: FolderTreeProps) => {
  const [treeData, setTreeData] = useState<FolderNode[]>([]);

  useEffect(() => {
    // Build tree structure from flat data
    const buildTree = (folders: FolderNode[]) => {
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

    // Cache the tree data in localStorage
    const cacheKey = "folderTreeData";
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setTreeData(JSON.parse(cachedData));
    } else {
      const tree = buildTree(initialData);
      setTreeData(tree);
      localStorage.setItem(cacheKey, JSON.stringify(tree));
    }
  }, [initialData]);

  return (
    <nav className="w-64 bg-transparent shadow-lg rounded-lg p-4">
      {treeData.map(node => (
        <FolderTreeItem key={node.id} node={node} />
      ))}
    </nav>
  );
};
