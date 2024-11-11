export const SEARCH_CONFIG = {
  minChars: 3,
  debounceMs: 300,
  maxResults: 10,
  cacheTimeout: 60 * 60 * 1000, // 1 hour
} as const;
