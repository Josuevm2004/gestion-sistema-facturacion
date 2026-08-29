'use client';

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
    <div className="d-flex justify-content-between align-items-center gap-2 mt-3 pt-3 border-top">
      <small className="text-muted">
        Mostrando {firstItem}-{lastItem} de {totalItems} clientes
      </small>
      <div className="btn-group btn-group-sm" role="group" aria-label="Paginación de clientes">
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={currentPage === 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        >
          Anterior
        </button>
        <span className="btn btn-light disabled">Página {currentPage} de {totalPages}</span>
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
