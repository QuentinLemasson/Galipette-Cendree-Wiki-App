import { Analytics } from "@/lib/analytics";

export class SearchAnalytics {
  private static instance: SearchAnalytics;
  private searchPatterns: Map<string, number>;
  private analytics: Analytics;

  private constructor() {
    this.searchPatterns = new Map();
    this.analytics = new Analytics();
  }

  static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  logSearch(query: string, resultCount: number): void {
    this.searchPatterns.set(query, (this.searchPatterns.get(query) || 0) + 1);

    if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === "true") {
      this.analytics.logEvent("search", {
        query,
        resultCount,
        timestamp: Date.now(),
      });
    }
  }

  getPopularSearches(): string[] {
    return Array.from(this.searchPatterns.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([query]) => query)
      .slice(0, 10);
  }
}
