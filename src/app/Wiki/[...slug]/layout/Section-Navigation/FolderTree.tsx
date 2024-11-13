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

const ArticleItem = ({ article }: { article: ArticleTreeItem }) => (
  <Link
    href={`/Wiki/${article.path}`}
    className="group hover:text-indigo-500 text-sm flex items-center gap-4 hover:gap-3.5"
  >
    <div className="w-0.5 group-hover:w-1 h-6 bg-indigo-900 group-hover:bg-indigo-500 opacity-70 group-hover:opacity-90 transition-all duration-100" />
    <span>{article.title}</span>
  </Link>
);

const FolderItem = ({
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
        <div className="">
          {node.children?.map(child => (
            <FolderItem key={child.id} node={child} level={level + 1} />
          ))}
          {node.articles.map(article => (
            <ArticleItem key={article.path} article={article} />
          ))}
        </div>
      )}
    </div>
  );
};

const RootFolderItem = ({ node }: { node: FolderNode }) => (
  <FolderItem node={node} level={0} />
);

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
    <nav className="w-64 bg-neutral-900 shadow-lg rounded-lg p-4 flex flex-col gap-3">
      {treeData.map(node => (
        <RootFolderItem key={node.id} node={node} />
      ))}
    </nav>
  );
};
