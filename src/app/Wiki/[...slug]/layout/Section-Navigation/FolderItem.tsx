import { useState } from "react";
import { FolderNode } from "@/types/wiki";
import { ArticleItem } from "./ArticleItem";

interface FolderItemProps {
  node: FolderNode;
  level: number;
  activePath?: string;
}

export const FolderItem = ({ node, level, activePath }: FolderItemProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasItems = (node.children?.length || node.articles.length) > 0;

  return (
    <div>
      <button
        className={`
          w-full text-left flex items-center gap-1 py-1
          hover:bg-neutral-800 transition-colors
          ${level > 0 ? "pl-6" : "pl-2"}
        `}
        onClick={() => setIsOpen(!isOpen)}
      >
        {hasItems && (
          <span
            className={`iconify mdi--chevron-right ${isOpen ? "rotate-90" : ""} transition-transform text-neutral-400`}
          />
        )}
        <span className="text-sm text-neutral-300 font-medium">
          {node.name}
        </span>
      </button>

      {isOpen && (
        <div className="ml-2">
          {node.children?.map(child => (
            <FolderItem
              key={child.id}
              node={child}
              level={level + 1}
              activePath={activePath}
            />
          ))}
          {node.articles.map(article => (
            <ArticleItem
              key={article.path}
              article={article}
              isActive={activePath === article.path}
            />
          ))}
        </div>
      )}
    </div>
  );
};
