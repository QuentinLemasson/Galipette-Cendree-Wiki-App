import { useState, useEffect } from "react";

export const SEARCH_CONFIG = {
  minChars: 3,
  debounceMs: 300,
  maxResults: 10,
  cacheTimeout: 60 * 60 * 1000, // 1 hour
} as const;

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
