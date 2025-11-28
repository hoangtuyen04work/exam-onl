// src/components/common/Pagination.tsx

import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hideIfSinglePage?: boolean;
  className?: string;
}


const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hideIfSinglePage = true,
  className = '',
}) => {
  if (hideIfSinglePage && totalPages <= 1) return null;

  return (
    <div className={`flex justify-center items-center gap-4 py-2 ${className}`}>
      {/* Prev */}
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className={`
          px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer
          ${currentPage === 1
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'}
        `}
      >
        &lt;
      </button>

      <div className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer
              ${page === currentPage
                ? 'bg-blue-600 text-white shadow'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}
            `}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next */}
      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className={`
          px-3 py-1.5 rounded-md text-sm font-medium transition cursor-pointer
          ${currentPage === totalPages
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-blue-600 hover:bg-blue-100'}
        `}
      >
        &gt;
      </button>
    </div>
  );
};

export default Pagination; 