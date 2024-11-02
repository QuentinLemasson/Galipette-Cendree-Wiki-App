import React, { useEffect, useState } from "react";
import { getArticleByPath } from "@/utils/db.client";

/*
This file contains functions that interact with your Express API to fetch data. 
These functions are intended to be used on the client-side.
*/

interface Article {
  id: number;
  title: string;
  content: string;
  path: string;
  metadata: Record<string, unknown>;
}

const ArticleFetcher: React.FC<{ path: string }> = ({ path }) => {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const fetchedArticle = await getArticleByPath(path);
        if (fetchedArticle) {
          setArticle(fetchedArticle);
        } else {
          setError("Article not found");
        }
      } catch {
        setError("Error fetching article");
      }
    }

    fetchArticle();
  }, [path]);

  if (error) return <div>{error}</div>;
  if (!article) return <div>Loading...</div>;

  return (
    <div>
      <h2>{article.title}</h2>
      <div dangerouslySetInnerHTML={{ __html: article.content }} />
    </div>
  );
};

export default ArticleFetcher;
