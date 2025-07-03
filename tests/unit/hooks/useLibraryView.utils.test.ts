import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getPageFromURL, updateURLPage, calculatePaginationMeta } from "../../../src/lib/utils/pagination.utils";

// =============================================================================
// SETUP MOCKS
// =============================================================================

// Mock window.location and window.history
const mockLocation = {
  href: "http://localhost:3000",
  search: "",
  origin: "http://localhost:3000",
  pathname: "/library",
};

const mockHistory = {
  pushState: vi.fn(),
};

// =============================================================================
// TESTS FOR getPageFromURL()
// =============================================================================

describe("getPageFromURL", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup fresh window mock
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { ...mockLocation },
        history: { ...mockHistory },
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up mocks
    vi.clearAllMocks();
  });

  it("should return 1 for empty URL", () => {
    // Arrange
    window.location.search = "";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(1);
  });

  it("should return correct page from ?page=3 parameter", () => {
    // Arrange
    window.location.search = "?page=3";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(3);
  });

  it("should return 1 for invalid parameter ?page=abc", () => {
    // Arrange
    window.location.search = "?page=abc";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(1);
  });

  it("should return 1 for negative value ?page=-1", () => {
    // Arrange
    window.location.search = "?page=-1";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(1);
  });

  it("should return 1 for zero value ?page=0", () => {
    // Arrange
    window.location.search = "?page=0";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(1);
  });

  it("should handle case when URLSearchParams throws error", () => {
    // Arrange - simulate problematic window.location scenario
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { search: null },
      writable: true,
    });

    // Act & Assert - function should not throw error and return 1
    expect(() => {
      const result = getPageFromURL();
      expect(result).toBe(1);
    }).not.toThrow();

    // Cleanup
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });

  it("should handle page parameter with other URL parameters", () => {
    // Arrange
    window.location.search = "?sort=desc&page=5&limit=20";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(5);
  });

  it("should handle very large page value", () => {
    // Arrange
    window.location.search = "?page=999999";

    // Act
    const result = getPageFromURL();

    // Assert
    expect(result).toBe(999999);
  });
});

// =============================================================================
// TESTS FOR updateURLPage()
// =============================================================================

describe("updateURLPage", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup fresh window mock
    Object.defineProperty(globalThis, "window", {
      value: {
        location: { ...mockLocation },
        history: { ...mockHistory },
      },
      writable: true,
    });
  });

  afterEach(() => {
    // Clean up mocks
    vi.clearAllMocks();
  });

  it("should remove page parameter for page 1", () => {
    // Arrange
    window.location.href = "http://localhost:3000/library?page=2&sort=desc";
    const expectedUrl = "http://localhost:3000/library?sort=desc";

    // Act
    updateURLPage(1);

    // Assert
    expect(window.history.pushState).toHaveBeenCalledWith({}, "", expectedUrl);
  });

  it("should add page parameter for page > 1", () => {
    // Arrange
    window.location.href = "http://localhost:3000/library";
    const expectedUrl = "http://localhost:3000/library?page=3";

    // Act
    updateURLPage(3);

    // Assert
    expect(window.history.pushState).toHaveBeenCalledWith({}, "", expectedUrl);
  });

  it("should update existing page parameter", () => {
    // Arrange
    window.location.href = "http://localhost:3000/library?page=2";
    const expectedUrl = "http://localhost:3000/library?page=5";

    // Act
    updateURLPage(5);

    // Assert
    expect(window.history.pushState).toHaveBeenCalledWith({}, "", expectedUrl);
  });

  it("should preserve other URL parameters", () => {
    // Arrange
    window.location.href = "http://localhost:3000/library?sort=asc&limit=50&page=1";
    const expectedUrl = "http://localhost:3000/library?sort=asc&limit=50&page=7";

    // Act
    updateURLPage(7);

    // Assert
    expect(window.history.pushState).toHaveBeenCalledWith({}, "", expectedUrl);
  });

  it("should handle complex URL with multiple parameters", () => {
    // Arrange
    window.location.href = "http://localhost:3000/library?search=metal&genre=death&page=1&sort=newest";

    // Act - removing page (page 1)
    updateURLPage(1);

    // Assert
    const expectedUrl = "http://localhost:3000/library?search=metal&genre=death&sort=newest";
    expect(window.history.pushState).toHaveBeenCalledWith({}, "", expectedUrl);
  });

  it("should handle URL without parameters when adding page", () => {
    // Arrange
    window.location.href = "http://localhost:3000/library";

    // Act
    updateURLPage(2);

    // Assert
    const expectedUrl = "http://localhost:3000/library?page=2";
    expect(window.history.pushState).toHaveBeenCalledWith({}, "", expectedUrl);
  });
});

// =============================================================================
// TESTS FOR calculatePaginationMeta()
// =============================================================================

describe("calculatePaginationMeta", () => {
  it("should correctly calculate metadata for first page", () => {
    // Arrange
    const currentPage = 1;
    const totalCount = 100;
    const limit = 20;
    const hasMore = true;

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result).toEqual({
      currentPage: 1,
      totalPages: 5, // Math.ceil(100/20)
      totalCount: 100,
      limit: 20,
      hasMore: true,
      total_count: 100, // Duplicated for compatibility
      offset: 0, // (1-1) * 20
    });
  });

  it("should correctly calculate metadata for middle page", () => {
    // Arrange
    const currentPage = 3;
    const totalCount = 100;
    const limit = 20;
    const hasMore = true;

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result).toEqual({
      currentPage: 3,
      totalPages: 5,
      totalCount: 100,
      limit: 20,
      hasMore: true,
      total_count: 100,
      offset: 40, // (3-1) * 20
    });
  });

  it("should correctly calculate metadata for last page", () => {
    // Arrange
    const currentPage = 5;
    const totalCount = 100;
    const limit = 20;
    const hasMore = false;

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result).toEqual({
      currentPage: 5,
      totalPages: 5,
      totalCount: 100,
      limit: 20,
      hasMore: false,
      total_count: 100,
      offset: 80, // (5-1) * 20
    });
  });

  it("should correctly handle empty library case", () => {
    // Arrange
    const currentPage = 1;
    const totalCount = 0;
    const limit = 20;
    const hasMore = false;

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result).toEqual({
      currentPage: 1,
      totalPages: 0, // Math.ceil(0/20)
      totalCount: 0,
      limit: 20,
      hasMore: false,
      total_count: 0,
      offset: 0,
    });
  });

  it("should correctly calculate hasMore flag - true when there are more pages", () => {
    // Arrange
    const currentPage = 2;
    const totalCount = 50;
    const limit = 20;
    const hasMore = true; // API says there are more

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result.hasMore).toBe(true);
    expect(result.totalPages).toBe(3); // Math.ceil(50/20)
  });

  it("should correctly calculate hasMore flag - false when it's the last page", () => {
    // Arrange
    const currentPage = 3;
    const totalCount = 50;
    const limit = 20;
    const hasMore = false; // API says it's the end

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result.hasMore).toBe(false);
    expect(result.totalPages).toBe(3);
  });

  it("should correctly calculate offset for different pages", () => {
    // Test different page/limit combinations -> offset
    const testCases = [
      { page: 1, limit: 10, expectedOffset: 0 },
      { page: 2, limit: 10, expectedOffset: 10 },
      { page: 3, limit: 25, expectedOffset: 50 },
      { page: 10, limit: 5, expectedOffset: 45 },
    ];

    testCases.forEach(({ page, limit, expectedOffset }) => {
      // Act
      const result = calculatePaginationMeta(page, 1000, limit, true);

      // Assert
      expect(result.offset).toBe(expectedOffset);
    });
  });

  it("should handle incomplete last page", () => {
    // Arrange - 47 elements, 20 per page = 3 pages (last incomplete)
    const currentPage = 3;
    const totalCount = 47;
    const limit = 20;
    const hasMore = false;

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result).toEqual({
      currentPage: 3,
      totalPages: 3, // Math.ceil(47/20) = 3
      totalCount: 47,
      limit: 20,
      hasMore: false,
      total_count: 47,
      offset: 40, // (3-1) * 20, last page will have 7 elements
    });
  });

  it("should handle case when limit is greater than totalCount", () => {
    // Arrange
    const currentPage = 1;
    const totalCount = 5;
    const limit = 20;
    const hasMore = false;

    // Act
    const result = calculatePaginationMeta(currentPage, totalCount, limit, hasMore);

    // Assert
    expect(result).toEqual({
      currentPage: 1,
      totalPages: 1, // Math.ceil(5/20) = 1
      totalCount: 5,
      limit: 20,
      hasMore: false,
      total_count: 5,
      offset: 0,
    });
  });
});
