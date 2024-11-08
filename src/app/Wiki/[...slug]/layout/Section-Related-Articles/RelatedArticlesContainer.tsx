import { Article } from "types/db.types";
import { RelatedArticleItem } from "./RelatedArticleItem";

interface RelatedArticlesContainerProps {
  articleList: Article[];
  title: string;
}

export const RelatedArticlesContainer = ({
  articleList,
  title,
}: RelatedArticlesContainerProps) => {
  return (
    <section className="rounded-lg right-16 p-4 top-24 w-96">
      <h1 className="text-xl font-bold mb-2">{title}</h1>
      <ul className="flex flex-col gap-2">
        {articleList.map(article => (
          <RelatedArticleItem key={article.path} article={article} />
        ))}
      </ul>
    </section>
  );
};
