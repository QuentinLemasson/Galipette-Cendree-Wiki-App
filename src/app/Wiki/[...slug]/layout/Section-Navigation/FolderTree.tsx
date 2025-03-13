"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FolderNode } from "@/types/wiki";
import { FolderItem } from "./FolderItem";
import { buildTree, sortTreeItems } from "@/utils/treeUtils";

interface FolderTreeProps {
  initialData: FolderNode[];
}

export const FolderTree = ({ initialData }: FolderTreeProps) => {
  const [treeData, setTreeData] = useState<FolderNode[]>([]);
  const pathname = usePathname();
  const activePath = pathname.replace("/Wiki/", "");

  useEffect(() => {
    const cacheKey = "folderTreeData";
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setTreeData(JSON.parse(cachedData));
    } else {
      const tree = buildTree(initialData);
      // Sort the tree
      const sortedTree = tree.sort(sortTreeItems);
      setTreeData(sortedTree);
      localStorage.setItem(cacheKey, JSON.stringify(sortedTree));
    }
  }, [initialData]);

  return (
    <nav className="rounded-lg overflow-hidden">
      <div className="p-2 flex flex-col">
        {treeData.map(node => (
          <FolderItem
            key={node.id}
            node={node}
            level={0}
            activePath={activePath}
          />
        ))}
      </div>
    </nav>
  );
};
