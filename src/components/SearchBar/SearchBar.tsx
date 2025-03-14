"use client";

import { useState, useRef } from "react";
import { SearchCache } from "@/utils/search/cache";
import { SEARCH_CONFIG } from "@/utils/search/config";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useDebounce } from "@/hooks/useDebounce";
import SearchResults from "./SearchResults";
import { Article } from "types/db.types";

interface SearchState {
  results: Article[];
  loading: boolean;
  error: string | null;
}

export const SearchBar = () => {
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [searchState, setSearchState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
  });
  const [hasMore] = useState(false);

  // Initialize utilities
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCache = useRef(new SearchCache());

  // Combined search function
  const searchArticles = async (query: string) => {
    const normalizedQuery = query.toLowerCase().trim();

    // Reset state if query is too short
    if (normalizedQuery.length < SEARCH_CONFIG.minChars) {
      setSearchState({ results: [], loading: false, error: null });
      return;
    }

    setSearchState(prev => ({ ...prev, loading: true }));

    // Check cache
    const cachedResult = searchCache.current.get(normalizedQuery);
    if (cachedResult?.isValid()) {
      setSearchState({
        results: cachedResult.data as Article[],
        loading: false,
        error: null,
      });
      return;
    }

    // API call if needed
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(normalizedQuery)}`
      );
      const data = await response.json();

      // Cache update
      searchCache.current.set(normalizedQuery, data.articles);

      // State update
      setSearchState({
        results: data.articles,
        loading: false,
        error: null,
      });
    } catch (err: unknown) {
      // Error handling
      const errorMessage =
        err instanceof Error ? err.message : "Search failed. Please try again.";
      setSearchState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
    }
  };

  // Use debounced search query
  useDebounce(searchQuery, SEARCH_CONFIG.debounceMs, searchArticles);

  useClickOutside([dropdownRef, inputRef], () => {
    setIsDropdownVisible(false);
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsDropdownVisible(true);
  };

  const handleLoadMore = () => {
    console.log("Loading more results...");
  };

  return (
    <div className="relative w-3/5 min-w-96">
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={() => setIsDropdownVisible(true)}
        placeholder="Rechercher un article..."
        className="text-sm w-full px-2 py-0.5 rounded-lg border bg-zinc-700 border-gray-600 focus:outline-hidden focus:border-indigo-500"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
        🔍
      </span>

      {isDropdownVisible && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          <SearchResults
            results={searchState.results as Article[]}
            loading={searchState.loading}
            error={searchState.error}
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
          />
        </div>
      )}
    </div>
  );
};
