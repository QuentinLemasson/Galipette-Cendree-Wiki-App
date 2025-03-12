import Link from "next/link";
import { ArticleTreeItem } from "@/types/wiki";

interface ArticleItemProps {
  article: ArticleTreeItem;
  isActive: boolean;
}

export const ArticleItem = ({ article, isActive }: ArticleItemProps) => (
  <Link
    href={`/Wiki/${article.path}`}
    className={`
        h-6
        rounded-md
        text-sm flex items-center gap-6
        hover:text-neutral-50 transition-colors
        group
        ${isActive ? "text-indigo-400 bg-neutral-800" : "text-neutral-300"}
    `}
  >
    <div
      className={`h-full w-0.5 bg-neutral-400 opacity-70 group-hover:bg-indigo-500 group-hover:opacity-100 transition-all`}
    />
    <span className="truncate">{article.title}</span>
  </Link>
);
