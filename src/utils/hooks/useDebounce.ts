import { useEffect, useState } from "react";

export const useDebounce = <T>(
  value: T,
  delay: number,
  callback: (value: T) => void
): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
      callback(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay, callback]);

  return debouncedValue;
};
