'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({
  currentPage,
  totalItems,
  pageSize = 10,
  onPageChange,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalItems <= pageSize) return null;

  const firstItem = (currentPage - 1) * pageSize + 1;
  const lastItem = Math.min(currentPage * pageSize, totalItems);
  const firstVisiblePage = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  );

  return (
    <div className="admin-pagination d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
      <small className="admin-pagination-summary">
        Mostrando <strong>{firstItem}–{lastItem}</strong> de <strong>{totalItems}</strong> registros
      </small>
      <div className="admin-pagination-controls d-flex align-items-center gap-2" role="group" aria-label="Paginación de registros">
        <button
          type="button"
          className="admin-pagination-arrow"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="admin-pagination-pages">
          {visiblePages.map((page) => (
            <button
              key={page}
              type="button"
              className={`admin-pagination-page${page === currentPage ? ' is-active' : ''}`}
              onClick={() => onPageChange(page)}
              aria-label={`Ir a página ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          ))}
        </div>
        <span className="admin-pagination-mobile-label">{currentPage} / {totalPages}</span>
        <button
          type="button"
          className="admin-pagination-arrow"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
