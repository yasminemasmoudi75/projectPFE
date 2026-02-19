import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  EyeIcon,
  PencilSquareIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { fetchDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';

const DevisList = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { devis, loading, pagination } = useSelector((state) => state.devis);

  const refreshData = () => {
    dispatch(fetchDevis({ page: 1, limit: 10 }));
  };

  useEffect(() => {
    refreshData();
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Ventes & Offres
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Registre des Devis</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Pilotez le cycle de vie de vos propositions commerciales.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshData}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate('/devis/new')}
            className="btn-soft-primary flex items-center gap-2"
          >
            <PlusIcon className="h-4 w-4 stroke-[3]" />
            Nouvelle Proposition
          </button>
        </div>
      </div>

      {/* Quick Stats Overlay (Optional but nice for consistency) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Encours Devis</p>
              <p className="text-2xl font-extrabold text-slate-800">12,5k <span className="text-xs text-slate-400 font-bold">TND</span></p>
            </div>
            <div className="icon-shape bg-gradient-blue shadow-glow-blue">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-blue"></div>
        </div>
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Taux Conversion</p>
              <p className="text-2xl font-extrabold text-slate-800">32% <span className="text-xs text-emerald-500 font-bold">+5%</span></p>
            </div>
            <div className="icon-shape bg-gradient-success shadow-glow-emerald">
              <ArrowTrendingUpIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-success"></div>
        </div>
        <div className="card-luxury p-0 overflow-hidden">
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nexus IA Score</p>
              <p className="text-2xl font-extrabold text-slate-800">85 <span className="text-xs text-blue-400 font-bold">Confiance</span></p>
            </div>
            <div className="icon-shape bg-gradient-blue-cyan shadow-glow-blue">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
          </div>
          <div className="h-1 bg-gradient-blue-cyan"></div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="p-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher par N° de pièce, client..."
              className="input-modern pl-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold uppercase tracking-widest border border-blue-100">Tous</button>
            <button className="px-4 py-2.5 bg-white text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all">Validés</button>
            <button className="px-4 py-2.5 bg-white text-slate-500 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all">En cours</button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="card-luxury p-0 overflow-hidden">
        <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Liste des Propositions Commerciales</h3>
          <span className="text-xs font-medium text-slate-500">{devis.length} documents trouvés</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Document</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Montant TTC</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Statut</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Probabilité IA</th>
                <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {devis.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                        <DocumentTextIcon className="h-8 w-8" />
                      </div>
                      <p className="text-slate-500 font-medium">Aucun devis trouvé</p>
                    </div>
                  </td>
                </tr>
              ) : (
                devis.map((item, i) => (
                  <tr
                    key={i}
                    className="group hover:bg-blue-50/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/devis/${item.Guid}`)}
                  >
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-blue-600 font-mono tracking-tight">{item.Prfx}{item.Nf}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase">{formatDate(item.DatUser)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-bold text-xs shadow-sm group-hover:scale-110 transition-transform">
                          {item.LibTiers?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase truncate max-w-[150px]">{item.LibTiers}</p>
                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Client Tiers</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm font-extrabold text-slate-800">{formatCurrency(item.TotTTC)}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={clsx(
                        "inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider",
                        item.IsConverted ? "bg-emerald-100 text-emerald-700" :
                          item.Valid ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
                      )}>
                        {item.IsConverted ? "Transformé" : item.Valid ? "Validé" : "Brouillon"}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      {item.IA_Probabilite ? (
                        <div className="flex items-center gap-3 min-w-[120px]">
                          <SparklesIcon className="h-4 w-4 text-blue-400 animate-pulse" />
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-blue shadow-glow-blue" style={{ width: `${item.IA_Probabilite}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-blue-600">{item.IA_Probabilite}%</span>
                        </div>
                      ) : <span className="text-slate-300 font-bold">--</span>}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/devis/edit/${item.Guid}`); }}
                          className="p-2.5 text-slate-400 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-all"
                          title="Modifier"
                        >
                          <PencilSquareIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/devis/${item.Guid}`); }}
                          className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-100 rounded-xl transition-all"
                          title="Détails"
                        >
                          <ArrowUpRightIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50/50 border-t border-slate-100/50 text-xs font-medium text-slate-500 flex justify-between items-center">
          <span>Performance CRM active</span>
          <span className="text-slate-400">NexuxCRM Suite v1.2</span>
        </div>
      </div>
    </div>
  );
};

export default DevisList;
