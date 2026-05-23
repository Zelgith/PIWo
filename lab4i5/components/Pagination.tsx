"use client";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav className="pagination" aria-label="Paginacja">
      <button
        type="button"
        className="button button--light pagination__button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Poprzednia
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          className={[
            "button",
            "pagination__button",
            currentPage === page ? "pagination__button--active" : "button--light",
          ].join(" ")}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="button button--light pagination__button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Następna
      </button>
    </nav>
  );
}
