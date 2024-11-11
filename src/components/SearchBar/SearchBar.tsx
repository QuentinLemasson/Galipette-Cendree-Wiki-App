"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";

interface SearchResult {
  title: string;
  path: string;
  content: string;
  tags: { tag: { name: string } }[];
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY = "search-cache";

// Helper functions for cache management
const loadCacheFromStorage = (): Map<string, CacheEntry> => {
  if (typeof window === "undefined") return new Map();

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return new Map();

    const entries = JSON.parse(cached);
    return new Map(Object.entries(entries));
  } catch (error) {
    console.error("Error loading cache:", error);
    return new Map();
  }
};

const saveCacheToStorage = (cache: Map<string, CacheEntry>) => {
  try {
    const entries = Object.fromEntries(cache.entries());
    localStorage.setItem(CACHE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Error saving cache:", error);
  }
};

export const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchCache = useMemo(() => loadCacheFromStorage(), []);

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

  const searchArticles = async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const normalizedQuery = query.toLowerCase().trim();
    const cachedResult = searchCache.get(normalizedQuery);
    const now = Date.now();

    // Check cache and validate timestamp
    if (cachedResult && now - cachedResult.timestamp < CACHE_DURATION) {
      setResults(cachedResult.results);
      return;
    }

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();

      // Update cache and persist
      searchCache.set(normalizedQuery, {
        results: data.articles,
        timestamp: now,
      });
      saveCacheToStorage(searchCache);

      setResults(data.articles);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // Clean up expired cache entries periodically
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      let hasChanges = false;

      searchCache.forEach((entry, key) => {
        if (now - entry.timestamp > CACHE_DURATION) {
          searchCache.delete(key);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        saveCacheToStorage(searchCache);
      }
    };

    // Run cleanup every minute
    const interval = setInterval(cleanupCache, 60000);
    return () => clearInterval(interval);
  }, [searchCache]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchArticles(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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
      {isDropdownVisible && results.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {results.map(article => (
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
