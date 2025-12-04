import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  totalItems, 
  itemsPerPage,
  onItemsPerPageChange 
}) {
  const [showItemsSelector, setShowItemsSelector] = useState(false);

  // Always show if there are items or if items per page selector is available
  if (totalItems === 0 && !onItemsPerPageChange) return null;

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = totalItems > 0 ? Math.min(currentPage * itemsPerPage, totalItems) : 0;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 7; // Show max 7 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  const itemsPerPageOptions = [12, 24, 48, 96, 120];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 xs:mt-8 sm:mt-10 pt-4 xs:pt-6 border-t border-slate-200 dark:border-slate-800">
      {/* Results info and items per page selector */}
      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4">
        <div className="text-xs xs:text-sm text-slate-600 dark:text-slate-400">
          Showing <span className="font-semibold text-slate-900 dark:text-slate-100">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> recipes
        </div>
        
        {/* Items per page selector */}
        {onItemsPerPageChange && (
          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowItemsSelector(!showItemsSelector)}
              className="flex items-center gap-2 px-3 xs:px-4 py-2 rounded-lg text-xs xs:text-sm font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[36px] xs:min-h-0 touch-manipulation transition-colors"
              aria-label="Change items per page"
            >
              <span>Show:</span>
              <span className="font-semibold">{itemsPerPage}</span>
              <span className="text-slate-500 dark:text-slate-400">per page</span>
              <svg
                className={`w-4 h-4 transition-transform ${showItemsSelector ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showItemsSelector && (
                <>
                  {/* Overlay to close dropdown */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowItemsSelector(false)}
                  />
                  {/* Dropdown */}
                  <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 z-20 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 min-w-[160px] overflow-hidden"
                >
                  {itemsPerPageOptions.map((option) => (
                    <motion.button
                      key={option}
                      whileHover={{ backgroundColor: 'rgba(148, 163, 184, 0.1)' }}
                      onClick={() => {
                        onItemsPerPageChange(option);
                        setShowItemsSelector(false);
                        onPageChange(1); // Reset to first page when changing items per page
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                        itemsPerPage === option
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{option} per page</span>
                        {itemsPerPage === option && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </motion.button>
                  ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Pagination buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 xs:gap-2">
        {/* Previous button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 xs:px-4 py-2 rounded-lg text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[36px] xs:min-h-0 touch-manipulation transition-colors"
          aria-label="Previous page"
        >
          Previous
        </motion.button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 xs:px-3 py-2 text-xs xs:text-sm text-slate-500 dark:text-slate-400"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;
            return (
              <motion.button
                key={page}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page)}
                className={`px-3 xs:px-4 py-2 rounded-lg text-xs xs:text-sm font-medium min-w-[36px] xs:min-w-[40px] min-h-[36px] xs:min-h-0 touch-manipulation transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                aria-label={`Go to page ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </motion.button>
            );
          })}
        </div>

        {/* Next button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 xs:px-4 py-2 rounded-lg text-xs xs:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 min-h-[36px] xs:min-h-0 touch-manipulation transition-colors"
          aria-label="Next page"
        >
          Next
        </motion.button>
        </div>
      )}
    </div>
  );
}

