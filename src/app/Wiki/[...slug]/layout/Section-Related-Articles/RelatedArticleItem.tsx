import { Article } from "db/types/db.types";

interface RelatedArticleItemProps {
  article: Article;
}

export const RelatedArticleItem = ({ article }: RelatedArticleItemProps) => {
  const { title, path } = article;

  return (
    <li className="list-none w-full">
      <a
        href={`/Wiki/${path}`}
        className="
            flex flex-row gap-2 items-end px-2 py-1
            border-solid border-2 border-slate-800 rounded-md
            bg-slate-800 bg-opacity-20 
            hover:bg-indigo-500 hover:bg-opacity-40 hover:border-indigo-500
            transition-all duration-100
            cursor-pointer"
      >
        <label className="text-sm pointer-events-none shrink-0">{title}</label>
        <div className="text-xs italic pointer-events-none text-gray-500 text-ellipsis overflow-hidden whitespace-nowrap">
          {path}
        </div>
      </a>
    </li>
  );
};
