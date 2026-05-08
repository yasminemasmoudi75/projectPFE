import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { UserIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchCommercials, setSelectedCommercial, clearSelectedCommercial } from '../../modules/admin/adminSlice';
import clsx from 'clsx';

const CommercialSelector = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { selectedCommercial, commercials, loading } = useSelector((state) => state.admin);
  const isAdmin = ['admin', 'administrateur'].includes(user?.UserRole?.toLowerCase());

  useEffect(() => {
    if (isAdmin && commercials.length === 0) {
      dispatch(fetchCommercials());
    }
  }, [isAdmin, commercials.length, dispatch]);

  if (!isAdmin) return null;

  const handleSelect = (e) => {
    const value = e.target.value;
    if (value === '') {
      dispatch(clearSelectedCommercial());
    } else {
      dispatch(setSelectedCommercial(value));
    }
    // Refresh the page to apply filters globally
    window.location.reload();
  };

  const handleClear = () => {
    dispatch(clearSelectedCommercial());
    window.location.reload();
  };

  return (
    <div className="px-4 py-2">
      <div className="relative group">
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
          Vue Commercial
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 flex items-center pointer-events-none">
            <UserIcon className={clsx(
              "h-4 w-4 transition-colors",
              selectedCommercial ? "text-blue-500" : "text-slate-400"
            )} />
          </div>
          
          <select
            value={selectedCommercial || ''}
            onChange={handleSelect}
            className={clsx(
              "block w-full pl-9 pr-10 py-2.5 text-xs font-semibold rounded-xl border-none ring-1 transition-all appearance-none cursor-pointer",
              selectedCommercial 
                ? "bg-blue-50 ring-blue-200 text-blue-700 shadow-sm" 
                : "bg-slate-50 ring-slate-200 text-slate-600 hover:bg-slate-100"
            )}
          >
            <option value="">Tous les commerciaux</option>
            {commercials.map((c) => (
              <option key={c.userId} value={c.userId}>
                {c.fullName || c.login}
              </option>
            ))}
          </select>

          {selectedCommercial && (
            <button
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full hover:bg-blue-100 text-blue-500 transition-colors"
              title="Réinitialiser"
            >
              <XMarkIcon className="h-3.5 w-3.5" />
            </button>
          )}

          {!selectedCommercial && (
            <div className="absolute right-3 pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          )}
        </div>
        
        {selectedCommercial && (
          <div className="mt-1.5 px-1 flex items-center gap-1.5">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
            <span className="text-[10px] font-medium text-blue-600 italic">
              Filtrage actif sur tout l'ERP
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommercialSelector;
