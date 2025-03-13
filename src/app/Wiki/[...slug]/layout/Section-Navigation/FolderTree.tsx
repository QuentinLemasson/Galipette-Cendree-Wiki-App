"use client";

import { useEffect, useState } from "react";
import { FolderNode } from "@/types/wiki";
import { convertToTreeMenu } from "@/utils/treeUtils";
import { Tree, TTreeMenu } from "@/components/ui/tree";
interface FolderTreeProps {
  initialData: FolderNode[];
}

export const FolderTree = ({ initialData }: FolderTreeProps) => {
  const [treeData, setTreeData] = useState<TTreeMenu[]>([]);
  // const pathname = usePathname();
  // const activePath = pathname.replace("/Wiki/", "");

  useEffect(() => {
    const cacheKey = "folderTreeData";
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      setTreeData(JSON.parse(cachedData));
    } else {
      const tree = convertToTreeMenu(initialData);
      // Sort the tree
      // const sortedTree = tree.sort(sortTreeItems);
      setTreeData(tree);
      localStorage.setItem(cacheKey, JSON.stringify(tree));
    }
  }, [initialData]);

  console.log("initialData", initialData);
  console.log("treeData", treeData);

  return <Tree items={treeData} />;
};
