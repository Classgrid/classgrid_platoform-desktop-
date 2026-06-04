import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type CgPaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
};

/**
 * CgPagination — Previous / Page N / Next controls.
 *
 * Usage:
 *   <CgPagination currentPage={1} totalPages={5} onPageChange={setPage} />
 */
export function CgPagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
}: CgPaginationProps) {
  if (totalPages <= 1) return null;

  // Build visible page numbers (show max 5 with ellipsis)
  const pages = buildPageNumbers(currentPage, totalPages);

  return (
    <nav aria-label="Pagination" className={`cg-pagination flex items-center justify-center gap-1.5 ${className}`.trim()}>
      <button
        className="cg-pagination__btn flex items-center gap-1 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        type="button"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
        <span>Previous</span>
      </button>

      <div className="cg-pagination__pages flex items-center gap-1">
        {pages.map((page, i) =>
          page === "..." ? (
            <span key={`ellipsis-${i}`} className="cg-pagination__ellipsis px-2 text-muted-foreground">
              …
            </span>
          ) : (
            <button
              key={page}
              className={`cg-pagination__page relative flex h-9 w-9 items-center justify-center rounded-[var(--radius)] text-sm font-medium transition-colors hover:text-foreground active:scale-[0.96] ${
                page === currentPage ? "text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"
              }`}
              onClick={() => onPageChange(page as number)}
              type="button"
              aria-current={page === currentPage ? "page" : undefined}
            >
              {page === currentPage && (
                <motion.div
                  layoutId="active-pagination-pill"
                  className="absolute inset-0 rounded-[var(--radius)] bg-primary shadow-sm"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative z-10">{page}</span>
            </button>
          )
        )}
      </div>

      <button
        className="cg-pagination__btn flex items-center gap-1 rounded-[var(--radius)] px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        type="button"
        aria-label="Next page"
      >
        <span>Next</span>
        <ChevronRight size={14} />
      </button>
    </nav>
  );
}

/** Build an array like [1, 2, 3, "...", 10] */
function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) pages.push("...");

  pages.push(total);

  return pages;
}
