import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../app/axios';
import {
  ArrowPathIcon, FunnelIcon, XMarkIcon, MagnifyingGlassIcon,
  ChevronLeftIcon, ChevronRightIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';

const DOC_CFG = {
  DEV: { label: 'Devis',           bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200'   },
  BCV: { label: 'Bon commande',    bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  BLV: { label: 'Bon livraison',   bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200'},
  FAV: { label: 'Facture',         bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};
const ACT_CFG = {
  0: { label: 'Création',       bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  1: { label: 'Transformation', bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200'   },
};

const DocBadge = ({ type }) => {
  const c = DOC_CFG[type] || { label: type, bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label || type}
    </span>
  );
};

const ActBadge = ({ flags }) => {
  const c = ACT_CFG[parseInt(flags)] || { label: 'Autre', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold border ${c.bg} ${c.text} ${c.border}`}>
      {c.label}
    </span>
  );
};

const INP = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:border-[#0062AF] focus:ring-2 focus:ring-[#0062AF]/10 focus:outline-none transition-all';

const EMPTY_FILTERS = { dateDebut: '', dateFin: '', docType: '', flags: '', codTiers: '', libTiers: '' };

const MouvementsPage = () => {
  const [mouvements, setMouvements]   = useState([]);
  const [loading, setLoading]         = useState(false);
  const [filters, setFilters]         = useState(EMPTY_FILTERS);
  const [pagination, setPagination]   = useState({ page: 1, limit: 50, total: 0, totalPages: 1 });

  const activeCount = Object.values(filters).filter(Boolean).length;

  const fetchMouvements = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', pagination.limit);
      params.append('_t', Date.now());

      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
      if (filters.dateFin)   params.append('dateFin',   filters.dateFin);
      if (filters.docType)   params.append('docType',   filters.docType);
      if (filters.codTiers)  params.append('codTiers',  filters.codTiers);
      if (filters.flags !== '') params.append('flags',  filters.flags);
      if (filters.libTiers)  params.append('libTiers',  filters.libTiers);

      const response = await axios.get(`/mouvements?${params.toString()}`);

      let data = [];
      let pag  = { total: 0, page: 1, limit: 50, totalPages: 1 };

      if (response?.status === 'success') {
        data = response.data || [];
        pag  = {
          total:      response.pagination?.total      || 0,
          page:       response.pagination?.page       || 1,
          limit:      response.pagination?.limit      || 50,
          totalPages: response.pagination?.totalPages || 1,
        };
      } else if (Array.isArray(response)) {
        data = response;
      }

      /* Fallback client-side pour les champs que le backend pourrait ignorer */
      if (filters.flags !== '') {
        const f = parseInt(filters.flags);
        data = data.filter(m => m.Flags === f);
      }
      if (filters.libTiers) {
        const q = filters.libTiers.toLowerCase();
        data = data.filter(m => m.LibTiers?.toLowerCase().includes(q));
      }

      setMouvements(data);
      setPagination(prev => ({ ...prev, ...pag, page }));
    } catch (err) {
      console.error('Erreur mouvements:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.limit]);

  useEffect(() => { fetchMouvements(1); }, [filters]);
  useEffect(() => { fetchMouvements(pagination.page); }, [pagination.page]);

  const setFilter = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const from = ((pagination.page - 1) * pagination.limit) + 1;
  const to   = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-5 pb-12">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0062AF] flex items-center justify-center flex-shrink-0">
            <DocumentTextIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Mouvements des Documents</h1>
            <p className="text-xs text-slate-400 mt-0.5">Créations et transformations de documents</p>
          </div>
        </div>
        <button onClick={() => fetchMouvements(pagination.page)} disabled={loading}
          className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40">
          <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Filtres ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Filtres</span>
            {activeCount > 0 && (
              <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-[#0062AF] text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </div>
          {activeCount > 0 && (
            <button onClick={handleReset}
              className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-500 font-semibold transition-colors">
              <XMarkIcon className="h-3.5 w-3.5" /> Réinitialiser
            </button>
          )}
        </div>

        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Date début */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date début</p>
            <input type="date" value={filters.dateDebut}
              onChange={e => setFilter('dateDebut', e.target.value)} className={INP} />
          </div>
          {/* Date fin */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Date fin</p>
            <input type="date" value={filters.dateFin}
              onChange={e => setFilter('dateFin', e.target.value)} className={INP} />
          </div>
          {/* Type doc */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Type de document</p>
            <select value={filters.docType} onChange={e => setFilter('docType', e.target.value)} className={INP}>
              <option value="">Tous les types</option>
              <option value="DEV">Devis (DEV)</option>
              <option value="BCV">Bon de Commande (BCV)</option>
              <option value="BLV">Bon de Livraison (BLV)</option>
              <option value="FAV">Facture (FAV)</option>
            </select>
          </div>
          {/* Action */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Action</p>
            <select value={filters.flags} onChange={e => setFilter('flags', e.target.value)} className={INP}>
              <option value="">Toutes les actions</option>
              <option value="0">Création</option>
              <option value="1">Transformation</option>
            </select>
          </div>
          {/* Code client */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Code client</p>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input type="text" placeholder="Ex : CLI1234…" value={filters.codTiers}
                onChange={e => setFilter('codTiers', e.target.value)}
                className={`${INP} pl-9`} />
            </div>
          </div>
          {/* Nom client */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nom société / client</p>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input type="text" placeholder="Ex : TRABELSI…" value={filters.libTiers}
                onChange={e => setFilter('libTiers', e.target.value)}
                className={`${INP} pl-9`} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
              <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0062AF] animate-spin" />
            </div>
            <p className="text-sm text-slate-400">Chargement…</p>
          </div>
        ) : mouvements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <DocumentTextIcon className="h-7 w-7 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Aucun mouvement trouvé</p>
            <p className="text-xs text-slate-400">Modifiez les filtres pour élargir la recherche</p>
            {activeCount > 0 && (
              <button onClick={handleReset}
                className="mt-1 h-8 px-4 rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors">
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    {[
                      { label: 'Date / Heure',  align: 'left'  },
                      { label: 'Type doc',       align: 'left'  },
                      { label: 'N° Document',    align: 'left'  },
                      { label: 'Client',         align: 'left'  },
                      { label: 'Action',         align: 'left'  },
                      { label: 'Montant TTC',    align: 'right' },
                      { label: 'TVA',            align: 'right' },
                    ].map((h, i) => (
                      <th key={i} className={`px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest ${h.align === 'right' ? 'text-right' : 'text-left'}`}>
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mouvements.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap">
                        {m.MDate ? new Date(m.MDate).toLocaleString('fr-FR') : '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <DocBadge type={m.Document} />
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-slate-800 font-mono">{m.NF || '—'}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-xs font-semibold text-slate-800">{m.LibTiers || '—'}</p>
                        {m.CodTiers && <p className="text-[10px] text-slate-400 font-mono mt-0.5">{m.CodTiers}</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <ActBadge flags={m.Flags} />
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs font-bold text-slate-900 tabular-nums whitespace-nowrap">
                        {m.TotTTC ? m.TotTTC.toFixed(3) : '0.000'} DT
                      </td>
                      <td className="px-5 py-3.5 text-right text-xs text-slate-600 tabular-nums whitespace-nowrap">
                        {m.TotTva ? `${m.TotTva.toFixed(3)} DT` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between gap-4">
              <p className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{from}–{to}</span> sur <span className="font-semibold text-slate-700">{pagination.total}</span> mouvements
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{pagination.page}</span>
                  <span className="text-slate-400">/</span>
                  <span>{pagination.totalPages}</span>
                </div>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-all">
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MouvementsPage;
