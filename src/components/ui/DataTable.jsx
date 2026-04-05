import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const DataTable = ({ 
  columns, 
  data, 
  loading = false,
  onRowClick,
  actions,
  pagination = true,
  itemsPerPage = 10
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Sorting
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = pagination 
    ? sortedData.slice(startIndex, startIndex + itemsPerPage)
    : sortedData;

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          <p className="text-slate-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-slate-500 font-medium">Aucune donnée trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              {columns.map((col) => (
                <th 
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${
                    col.sortable !== false ? 'cursor-pointer hover:bg-slate-100 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.title}
                    {sortConfig.key === col.key && (
                      sortConfig.direction === 'asc' 
                        ? <ChevronUpIcon className="h-4 w-4" />
                        : <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </th>
              ))}
              {actions && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.map((row, idx) => (
              <tr 
                key={idx}
                onClick={() => onRowClick?.(row)}
                className={`group hover:bg-blue-50/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.render ? col.render(row[col.key], row) : (
                      <span className="text-sm text-slate-700">{row[col.key] || '-'}</span>
                    )}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {actions(row)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && totalPages > 1 && (
        <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, data.length)} sur {data.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-slate-700">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
