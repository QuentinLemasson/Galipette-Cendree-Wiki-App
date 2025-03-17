"use client";

import { useEffect, useState } from "react";
import { Article } from "@/database/types/db.types";
import { RelatedArticlesContainer } from "../Section-Related-Articles/RelatedArticlesContainer";

interface RecentArticlesWrapperProps {
  currentArticle: Pick<Article, "title" | "path">;
}

export const RecentArticlesWrapper = ({
  currentArticle,
}: RecentArticlesWrapperProps) => {
  const [recentArticles, setRecentArticles] = useState<Article[]>([]);

  useEffect(() => {
    // Get existing recent articles
    const stored = localStorage.getItem("recentArticles");
    const existing = stored ? JSON.parse(stored) : [];

    // Remove current article if it exists
    const filtered = existing.filter(
      (article: Article) => article.path !== currentArticle.path
    );

    // Store the filtered list (without current article) plus the current article at the start
    localStorage.setItem(
      "recentArticles",
      JSON.stringify([currentArticle, ...filtered].slice(0, 3))
    );

    // Only display the filtered list (without current article)
    setRecentArticles(filtered.slice(0, 3));
  }, [currentArticle]);

  return (
    <RelatedArticlesContainer
      title="Récemment consultés"
      articleList={recentArticles}
    />
  );
};
