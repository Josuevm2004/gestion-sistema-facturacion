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

  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 mt-4 pt-3 border-top">
      <small className="text-muted fw-semibold">
        Mostrando <strong className="text-dark">{firstItem}-{lastItem}</strong> de <strong className="text-dark">{totalItems}</strong> registros
      </small>
      <div className="d-flex align-items-center gap-2" role="group" aria-label="Paginación de clientes">
        <button
          type="button"
          className="btn-meta-action btn-meta-action-secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={14} />
          <span>Anterior</span>
        </button>
        <span className="small fw-semibold text-muted px-2">
          Página <strong className="text-dark">{currentPage}</strong> de {totalPages}
        </span>
        <button
          type="button"
          className="btn-meta-action btn-meta-action-secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <span>Siguiente</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
