import { Article } from "types/db.types";

class CacheEntry {
  constructor(
    public data: Article[],
    public timestamp: number = Date.now(),
    public ttl: number = 5 * 60 * 1000 // 5 minutes
  ) {}

  isValid(): boolean {
    return Date.now() - this.timestamp < this.ttl;
  }
}

export class SearchCache {
  private cache: Map<string, CacheEntry>;
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): CacheEntry | undefined {
    const entry = this.cache.get(key);
    if (entry && !entry.isValid()) {
      this.cache.delete(key);
      return undefined;
    }
    return entry;
  }

  set(key: string, value: Article[]): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, new CacheEntry(value));
  }

  cleanup(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!entry.isValid()) {
        this.cache.delete(key);
      }
    }
  }
}

export type { CacheEntry };
