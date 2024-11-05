import { Article } from "types/db.types";
import { RelatedArticleItem } from "./RelatedArticleItem";

interface RelatedArticlesContainerProps {
  articleList: Article[];
}

export const RelatedArticlesContainer = ({
  articleList,
}: RelatedArticlesContainerProps) => {
  return (
    <section className="rounded-lg fixed right-16 p-4 top-24">
      <h1 className="text-xl font-bold mb-2">Articles liés</h1>
      <ul className="flex flex-col gap-2">
        {articleList.map(article => (
          <RelatedArticleItem key={article.path} article={article} />
        ))}
      </ul>
    </section>
  );
};
