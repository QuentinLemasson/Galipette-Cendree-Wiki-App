"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { SearchCache } from "@/utils/search/cache";
import { useDebounce, SEARCH_CONFIG } from "@/utils/search/config";

interface SearchResult {
  title: string;
  path: string;
  content: string;
  tags: { tag: { name: string } }[];
}

interface SearchState {
  results: SearchResult[];
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

  // Initialize utilities
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchCache = useRef(new SearchCache());

  // Use debounced search query
  const debouncedQuery = useDebounce(searchQuery, SEARCH_CONFIG.debounceMs);

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
        results: cachedResult.data,
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

  // Watch for changes in debounced query
  useEffect(() => {
    if (debouncedQuery) {
      searchArticles(debouncedQuery);
    }
  }, [debouncedQuery]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsDropdownVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    setIsDropdownVisible(true);
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
        className="text-sm w-full px-2 py-0.5 rounded-lg border bg-zinc-700 border-gray-600 focus:outline-none focus:border-indigo-500"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">
        🔍
      </span>

      {/* Dropdown Results */}
      {isDropdownVisible && searchState.results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {searchState.results.map(article => (
            <Link
              key={article.path}
              href={`/Wiki/${article.path}`}
              onClick={() => {
                setIsDropdownVisible(false);
                setSearchQuery("");
              }}
            >
              <div className="p-3 hover:bg-zinc-700 cursor-pointer border-b border-gray-700 last:border-0">
                <div className="font-medium text-gray-200">{article.title}</div>
                <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {article.content}
                </div>
                {article.tags.length > 0 && (
                  <div className="flex gap-2 mt-1">
                    {article.tags.map(({ tag }) => (
                      <span
                        key={tag.name}
                        className="text-xs px-2 py-0.5 bg-zinc-700 rounded-full text-gray-300"
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
