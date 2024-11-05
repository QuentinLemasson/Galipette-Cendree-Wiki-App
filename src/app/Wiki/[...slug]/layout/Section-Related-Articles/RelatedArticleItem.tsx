import { Article } from "types/db.types";

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
            border-solid border-2 border-indigo-500 rounded-md
            bg-indigo-500 bg-opacity-20 hover:bg-opacity-40
            transition-all duration-100
            cursor-pointer"
      >
        <label className="text-sm">{title}</label>
        <div className="text-xs italic mb-0.5">{path}</div>
      </a>
    </li>
  );
};
