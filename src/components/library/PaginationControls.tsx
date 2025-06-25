import * as React from "react";
import type { PaginationMeta } from "../../types";
import { Button } from "../ui/button";

// =============================================================================
// TYPES
// =============================================================================

interface PaginationControlsProps {
  /** Pagination metadata */
  pagination: PaginationMeta;
  /** Handler for page change */
  onPageChange: (newPage: number) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Pagination controls component for navigating between library pages
 */
const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, onPageChange }) => {
  const { currentPage, totalPages, totalCount, hasMore } = pagination;

  const handlePreviousPage = React.useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const handleNextPage = React.useCallback(() => {
    if (hasMore && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, totalPages, hasMore, onPageChange]);

  // Don't render if there's only one page or no pages
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 py-6">
      {/* Page Info */}
      <div className="text-sm text-gray-600 order-2 sm:order-1">
        Showing page {currentPage} of {totalPages} ({totalCount} tracks total)
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-2 order-1 sm:order-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePreviousPage}
          disabled={currentPage === 1}
          className="min-w-[80px]"
        >
          ← Previous
        </Button>

        {/* Page Numbers (show a few around current page) */}
        <div className="flex items-center gap-1">
          {/* First page */}
          {currentPage > 3 && (
            <>
              <Button
                variant={1 === currentPage ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(1)}
                className="w-8 h-8 p-0"
              >
                1
              </Button>
              {currentPage > 4 && <span className="text-gray-400 px-1">...</span>}
            </>
          )}

          {/* Pages around current */}
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = Math.max(1, currentPage - 2) + i;
            if (pageNum > totalPages) return null;

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="w-8 h-8 p-0"
              >
                {pageNum}
              </Button>
            );
          })}

          {/* Last page */}
          {currentPage < totalPages - 2 && (
            <>
              {currentPage < totalPages - 3 && <span className="text-gray-400 px-1">...</span>}
              <Button
                variant={totalPages === currentPage ? "default" : "ghost"}
                size="sm"
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 p-0"
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNextPage}
          disabled={!hasMore || currentPage >= totalPages}
          className="min-w-[80px]"
        >
          Next →
        </Button>
      </div>
    </div>
  );
};

export default PaginationControls;
