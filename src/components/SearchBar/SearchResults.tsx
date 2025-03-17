import React, { useEffect, useRef } from "react";
import SearchResultItem from "./SearchResultItem";
import LoadingSpinner from "../common/LoadingSpinner";
import ErrorMessage from "../common/ErrorMessage";
import { Article } from "@/database/types/db.types";

interface SearchResultsProps {
  results: Article[];
  loading: boolean;
  error: string | null;
  onLoadMore: () => void;
  hasMore: boolean;
}

const SearchResults = ({
  results,
  loading,
  error,
  onLoadMore,
  hasMore,
}: SearchResultsProps) => {
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Implement infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div className="search-results-container">
      {results.map(result => (
        <SearchResultItem key={result.path} result={result} />
      ))}

      {loading && <LoadingSpinner />}

      {error && <ErrorMessage message={error} />}

      {hasMore && <div ref={loadMoreRef} className="load-more-trigger" />}
    </div>
  );
};

export default SearchResults;
