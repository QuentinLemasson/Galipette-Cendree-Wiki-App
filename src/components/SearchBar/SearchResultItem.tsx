import React from "react";
import Link from "next/link";

interface Article {
  path: string;
  title: string;
  tags?: { name: string }[];
}

interface SearchResultItemProps {
  result: Article;
}

const SearchResultItem = ({ result }: SearchResultItemProps) => {
  return (
    <Link href={`/Wiki/${result.path}`}>
      <div className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-gray-700 last:border-0">
        <div className="font-medium text-gray-200">{result.title}</div>
        {result.tags && result.tags.length > 0 && (
          <div className="flex gap-2 mt-1">
            {result.tags.map(({ name }) => (
              <span
                key={name}
                className="text-xs px-2 py-0.5 bg-zinc-700 rounded-full text-gray-300"
              >
                {name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default SearchResultItem;
