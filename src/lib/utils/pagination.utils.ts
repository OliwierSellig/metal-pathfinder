import type { PaginationMeta } from "../../types";

/**
 * Utility functions for pagination management
 */

/**
 * Parsuje parametr page z URL
 */
export function getPageFromURL(): number {
  if (typeof window === "undefined") return 1;
  const urlParams = new URLSearchParams(window.location.search);
  const page = parseInt(urlParams.get("page") || "1", 10);
  return page > 0 ? page : 1;
}

/**
 * Aktualizuje parametr page w URL
 */
export function updateURLPage(page: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (page === 1) {
    url.searchParams.delete("page");
  } else {
    url.searchParams.set("page", page.toString());
  }
  window.history.pushState({}, "", url.toString());
}

/**
 * Oblicza metadane paginacji na podstawie odpowiedzi API
 */
export function calculatePaginationMeta(
  currentPage: number,
  totalCount: number,
  limit: number,
  hasMore: boolean
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (currentPage - 1) * limit;
  return {
    currentPage,
    totalPages,
    totalCount,
    limit,
    hasMore,
    total_count: totalCount,
    offset,
  };
}
