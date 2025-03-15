import { NextRequest } from "next/server";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { GET as getArticlePaths } from "../articles/paths/route";
import { GET as getArticleByPath } from "../articles/path/[...slug]/route";
import { GET as searchArticles } from "../articles/search/route";
import { GET as getRelatedArticles } from "../articles/related/[...slug]/route";
import { GET as getFolderTree } from "../folders/tree/route";

// Define interfaces for our mock functions
interface ArticlePathsResult {
  path: string;
}

interface ArticleResult {
  title: string;
  content: string;
  path: string;
  metadata: Record<string, unknown>;
  related_articles?: unknown[];
  mention_articles?: unknown[];
}

interface FolderTreeItem {
  id: number;
  name: string;
  parentId: number | null;
  articles: { title: string; path: string }[];
}

// Create mock functions
const mockGetArticlePaths = jest.fn<() => Promise<ArticlePathsResult[]>>();
const mockGetArticleByPath =
  jest.fn<(path: string) => Promise<ArticleResult | null>>();
const mockSearchArticles =
  jest.fn<(query: string) => Promise<ArticleResult[]>>();
const mockGetRelatedArticlesByTags =
  jest.fn<(path: string) => Promise<ArticleResult[] | null>>();
const mockGetFolderTree = jest.fn<() => Promise<FolderTreeItem[]>>();

// Mock the articles module
jest.mock("@/data/articles", () => ({
  getArticlePaths: () => mockGetArticlePaths(),
  getArticleByPath: (path: string) => mockGetArticleByPath(path),
  searchArticles: (query: string) => mockSearchArticles(query),
  getRelatedArticlesByTags: (path: string) =>
    mockGetRelatedArticlesByTags(path),
  getFolderTree: () => mockGetFolderTree(),
}));

describe("Article API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/articles/paths", () => {
    it("should return article paths", async () => {
      const mockPaths = [
        { path: "folder1/article1" },
        { path: "folder2/article2" },
      ];
      mockGetArticlePaths.mockResolvedValue(mockPaths);

      const response = await getArticlePaths();
      const data = await response.json();

      expect(mockGetArticlePaths).toHaveBeenCalled();
      expect(data).toEqual(mockPaths);
    });

    it("should handle errors", async () => {
      const mockError = new Error("Database error");
      mockGetArticlePaths.mockRejectedValue(mockError);

      const response = await getArticlePaths();
      const data = await response.json();

      expect(mockGetArticlePaths).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("GET /api/articles/path/[...slug]", () => {
    it("should return article by path", async () => {
      const mockArticle = {
        title: "Test Article",
        content: "Test content",
        path: "folder/article",
        metadata: {},
        related_articles: [],
        mention_articles: [],
      };
      mockGetArticleByPath.mockResolvedValue(mockArticle);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/path/folder/article"
      );
      const context = {
        params: Promise.resolve({ slug: ["folder", "article"] }),
      };

      const response = await getArticleByPath(request, context);
      const data = await response.json();

      expect(mockGetArticleByPath).toHaveBeenCalledWith("folder/article");
      expect(data).toEqual(mockArticle);
    });

    it("should return 404 if article not found", async () => {
      mockGetArticleByPath.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/path/folder/article"
      );
      const context = {
        params: Promise.resolve({ slug: ["folder", "article"] }),
      };

      const response = await getArticleByPath(request, context);
      const data = await response.json();

      expect(mockGetArticleByPath).toHaveBeenCalledWith("folder/article");
      expect(response.status).toBe(404);
      expect(data.error).toBe("Article not found");
    });

    it("should handle errors", async () => {
      const mockError = new Error("Database error");
      mockGetArticleByPath.mockRejectedValue(mockError);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/path/folder/article"
      );
      const context = {
        params: Promise.resolve({ slug: ["folder", "article"] }),
      };

      const response = await getArticleByPath(request, context);
      const data = await response.json();

      expect(mockGetArticleByPath).toHaveBeenCalledWith("folder/article");
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("GET /api/articles/search", () => {
    it("should return search results", async () => {
      const mockArticles: ArticleResult[] = [
        {
          title: "Test Article",
          content: "Test content",
          path: "folder/article",
          metadata: {},
          related_articles: [],
          mention_articles: [],
        },
      ];
      mockSearchArticles.mockResolvedValue(mockArticles);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/search?q=test"
      );
      const response = await searchArticles(request);
      const data = await response.json();

      expect(mockSearchArticles).toHaveBeenCalledWith("test");
      expect(data.articles).toEqual(mockArticles);
    });

    it("should return empty array for short queries", async () => {
      const request = new NextRequest(
        "http://localhost:3000/api/articles/search?q=t"
      );
      const response = await searchArticles(request);
      const data = await response.json();

      expect(mockSearchArticles).not.toHaveBeenCalled();
      expect(data.articles).toEqual([]);
    });

    it("should handle errors", async () => {
      const mockError = new Error("Database error");
      mockSearchArticles.mockRejectedValue(mockError);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/search?q=test"
      );
      const response = await searchArticles(request);
      const data = await response.json();

      expect(mockSearchArticles).toHaveBeenCalledWith("test");
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("GET /api/articles/related/[...slug]", () => {
    it("should return related articles", async () => {
      const mockArticles: ArticleResult[] = [
        {
          title: "Related Article",
          content: "Related content",
          path: "folder/related",
          metadata: {},
          related_articles: [],
          mention_articles: [],
        },
      ];
      mockGetRelatedArticlesByTags.mockResolvedValue(mockArticles);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/related/folder/article"
      );
      const context = {
        params: Promise.resolve({ slug: ["folder", "article"] }),
      };

      const response = await getRelatedArticles(request, context);
      const data = await response.json();

      expect(mockGetRelatedArticlesByTags).toHaveBeenCalledWith(
        "folder/article"
      );
      expect(data).toEqual(mockArticles);
    });

    it("should return 404 if no related articles found", async () => {
      mockGetRelatedArticlesByTags.mockResolvedValue(null);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/related/folder/article"
      );
      const context = {
        params: Promise.resolve({ slug: ["folder", "article"] }),
      };

      const response = await getRelatedArticles(request, context);
      const data = await response.json();

      expect(mockGetRelatedArticlesByTags).toHaveBeenCalledWith(
        "folder/article"
      );
      expect(response.status).toBe(404);
      expect(data.error).toBe("No related articles found");
    });

    it("should handle errors", async () => {
      const mockError = new Error("Database error");
      mockGetRelatedArticlesByTags.mockRejectedValue(mockError);

      const request = new NextRequest(
        "http://localhost:3000/api/articles/related/folder/article"
      );
      const context = {
        params: Promise.resolve({ slug: ["folder", "article"] }),
      };

      const response = await getRelatedArticles(request, context);
      const data = await response.json();

      expect(mockGetRelatedArticlesByTags).toHaveBeenCalledWith(
        "folder/article"
      );
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("GET /api/folders/tree", () => {
    it("should return folder tree", async () => {
      const mockFolderTree = [
        {
          id: 1,
          name: "Folder 1",
          parentId: null,
          articles: [{ title: "Article 1", path: "folder1/article1" }],
        },
        {
          id: 2,
          name: "Folder 2",
          parentId: null,
          articles: [{ title: "Article 2", path: "folder2/article2" }],
        },
      ];
      mockGetFolderTree.mockResolvedValue(mockFolderTree);

      const response = await getFolderTree();
      const data = await response.json();

      expect(mockGetFolderTree).toHaveBeenCalled();
      expect(data).toEqual(mockFolderTree);
    });

    it("should handle errors", async () => {
      const mockError = new Error("Database error");
      mockGetFolderTree.mockRejectedValue(mockError);

      const response = await getFolderTree();
      const data = await response.json();

      expect(mockGetFolderTree).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(data.error).toBe("Internal server error");
    });
  });
});
