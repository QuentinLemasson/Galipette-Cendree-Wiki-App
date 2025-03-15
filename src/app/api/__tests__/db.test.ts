import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { POST as importVaultContent } from "../db/import/route";
import { POST as flushDatabase } from "../db/flush/route";

// Define interfaces for our mock functions
interface ImportResult {
  success: boolean;
  message: string;
  stats?: {
    articlesImported: number;
    relationsCreated: number;
  };
  error?: string;
}

interface DbOperationResult {
  success: boolean;
  message: string;
  error?: string;
}

// Create mock functions
const mockImportVaultContent = jest.fn<() => Promise<ImportResult>>();
const mockFlushDatabase = jest.fn<() => Promise<DbOperationResult>>();

// Mock the dbOperations module
jest.mock("@/utils/db/dbOperations", () => ({
  importVaultContent: () => mockImportVaultContent(),
  flushDatabase: () => mockFlushDatabase(),
}));

describe("Database Management API Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/db/import", () => {
    it("should import vault content", async () => {
      const mockResult: ImportResult = {
        success: true,
        message: "Import completed successfully",
        stats: {
          articlesImported: 10,
          relationsCreated: 15,
        },
      };
      mockImportVaultContent.mockResolvedValue(mockResult);

      const response = await importVaultContent();
      const data = await response.json();

      expect(mockImportVaultContent).toHaveBeenCalled();
      expect(data).toEqual(mockResult);
    });

    it("should handle errors", async () => {
      const mockError = new Error("Import error");
      mockImportVaultContent.mockRejectedValue(mockError);

      const response = await importVaultContent();
      const data = await response.json();

      expect(mockImportVaultContent).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Internal server error");
    });
  });

  describe("POST /api/db/flush", () => {
    it("should flush database", async () => {
      const mockResult: DbOperationResult = {
        success: true,
        message: "Database flushed successfully",
      };
      mockFlushDatabase.mockResolvedValue(mockResult);

      const response = await flushDatabase();
      const data = await response.json();

      expect(mockFlushDatabase).toHaveBeenCalled();
      expect(data).toEqual(mockResult);
    });

    it("should handle errors", async () => {
      const mockError = new Error("Flush error");
      mockFlushDatabase.mockRejectedValue(mockError);

      const response = await flushDatabase();
      const data = await response.json();

      expect(mockFlushDatabase).toHaveBeenCalled();
      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Internal server error");
    });
  });
});
