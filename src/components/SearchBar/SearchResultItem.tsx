import React from "react";
import Link from "next/link";
import { Article } from "types/db.types";

interface SearchResultItemProps {
  result: Article;
}

const SearchResultItem = ({ result }: SearchResultItemProps) => {
  return (
    <Link href={`/Wiki/${result.path}`}>
      <div className="group py-1 px-3 hover:bg-zinc-700 cursor-pointer border-b border-gray-700 last:border-0">
        <div className="text-m font-normal text-gray-200 group-hover:text-indigo-400">
          {result.title}
        </div>
        {result.tags && result.tags.length > 0 && (
          <div className="flex gap-2 mt-1">
            {result.tags.map(({ tagId }) => (
              <span
                key={tagId}
                className="text-xs px-2 py-0.5 bg-zinc-700 rounded-full text-gray-300"
              >
                {tagId}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default SearchResultItem;
