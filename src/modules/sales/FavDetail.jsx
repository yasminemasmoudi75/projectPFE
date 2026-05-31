import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  BanknotesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { fetchFavById, clearCurrentFav } from './favSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '@app/axios';

const fmt3 = (n) => (n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const FavDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentFav: fav, loading, error } = useSelector((state) => state.fav);

  useEffect(() => {
    if (id) dispatch(fetchFavById(id));
    return () => dispatch(clearCurrentFav());
  }, [dispatch, id]);

  const handleDownloadPDF = async () => {
    if (!fav) return;
    try {
      const response = await api.get(`/fav/${id}/pdf`, { responseType: 'blob' });
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${fav.Prfx || 'FAC'}${fav.Nf}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF généré avec succès');
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center">
        <span className="text-rose-400 text-xl font-bold">!</span>
      </div>
      <p className="text-sm font-semibold text-slate-700">Erreur lors du chargement</p>
      <p className="text-xs text-slate-400 max-w-xs text-center">{error}</p>
    </div>
  );
  if (!fav) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <BanknotesIcon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Facture introuvable</p>
      <button onClick={() => navigate('/fav')} className="text-xs text-slate-500 hover:text-slate-700">← Retour à la liste</button>
    </div>
  );

  const ref     = `${fav.Prfx || 'FAC'}${fav.Nf}`;
  const totalHT  = Number(fav.TotHT  || 0);
  const totalTVA = Number(fav.TotTva || 0);
  const totalRem = Number(fav.TotRem || 0);
  const totalTTC = Number(fav.TotTTC || 0);

  return (
    <div className="animate-fade-in space-y-5 max-w-5xl mx-auto pb-16">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">

          {/* Left */}
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => navigate('/fav')}
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all group flex-shrink-0 shadow-sm">
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-500/20">
              <BanknotesIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{ref}</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                {fav.LibTiers && <span className="font-semibold text-slate-600 truncate max-w-[200px]">{fav.LibTiers}</span>}
                {fav.LibTiers && fav.DatUser && <span className="text-slate-300">·</span>}
                {fav.DatUser && (
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="h-3 w-3 text-slate-400" />
                    {formatDate(fav.DatUser)}
                  </span>
                )}
                {totalTTC > 0 && <><span className="text-slate-300">·</span><span className="font-bold text-[#0062AF]">{fmt3(totalTTC)} TND</span></>}
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm">
              <PrinterIcon className="h-4 w-4 text-slate-400" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Document Card ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="px-12 py-10 print:p-8">

          {/* Company header */}
          <div className="flex justify-between items-start mb-10">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AMS-LABO</h1>
              <div className="text-xs text-slate-400 mt-2 space-y-0.5 leading-relaxed">
                <p className="text-slate-500">Rue Taher Kammoun · 3000 Sfax, Tunisie</p>
                <p>Tél : <span className="font-semibold text-slate-600">74 407 194</span></p>
                <p>Email : <span className="font-semibold text-slate-600">contact@amslabo.com</span></p>
              </div>
            </div>
            <div className="text-right flex flex-col items-end gap-0.5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Propulsé par</span>
              <span className="text-xl font-black text-[#0062AF]">NEXUS</span>
              <span className="text-[9px] text-slate-400 tracking-widest">CRM Suite</span>
            </div>
          </div>

          {/* Document title */}
          <div className="text-center mb-10">
            <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-[0.3em]">Facture</h2>
            <div className="mt-2 mx-auto w-32 h-0.5 bg-gradient-to-r from-transparent via-[#0062AF] to-transparent" />
          </div>

          {/* Meta + Client */}
          <div className="grid grid-cols-2 gap-12 mb-10 pb-10 border-b border-slate-100">
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Détails du document</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Référence</span>
                <span className="font-black text-[#0062AF] font-mono">{ref}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-700">{formatDate(fav.DatUser) || '—'}</span>
              </div>
              {fav.Remarq && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarques</p>
                  <p className="text-xs text-slate-500 italic leading-relaxed">{fav.Remarq}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Destinataire</p>
              <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{fav.LibTiers}</h3>
              <div className="text-sm text-slate-500 space-y-0.5 leading-relaxed">
                {fav.Adresse && <p>{fav.Adresse}</p>}
                {fav.Ville && <p className="font-semibold text-slate-700">{fav.Ville}</p>}
                {fav.Cin && <p className="font-mono text-slate-400 text-xs">ID : {fav.Cin}</p>}
              </div>
            </div>
          </div>

          {/* Articles table */}
          <div className="mb-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Articles</p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-28">Code</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Désignation</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-32">P.U TTC</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-20">Qté</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-36">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fav.details?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4"><span className="text-xs font-mono font-bold text-slate-500">{item.CodArt || '—'}</span></td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.LibArt}</p>
                        {item.ExLibArt && <p className="text-[11px] text-slate-400 mt-0.5">{item.ExLibArt}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 text-right tabular-nums font-medium">{fmt3(item.PuTTC || 0)} DT</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-center tabular-nums">{item.Qt}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                        {fmt3((item.Qt || 0) * (item.PuTTC || 0))} DT
                      </td>
                    </tr>
                  ))}
                  {(!fav.details || fav.details.length === 0) && (
                    <tr><td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400 italic">Aucun article.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-10">
            <div className="w-full sm:w-80 space-y-2">
              <div className="space-y-2 pb-4 border-b border-slate-200">
                {[
                  { label: 'Sous-total HT', value: totalHT,  color: 'text-slate-600' },
                  { label: `TVA (${fav.details?.[0]?.Tva ?? 19}%)`, value: totalTVA, color: 'text-slate-600' },
                  ...(totalRem > 0 ? [{ label: 'Remise', value: -totalRem, color: 'text-rose-600' }] : []),
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{row.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${row.color}`}>
                      {row.value < 0 ? '− ' : ''}{fmt3(Math.abs(row.value))} DT
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-end justify-between pt-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total TTC</p>
                  <p className="text-[11px] text-slate-400">Toutes taxes comprises</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[#0062AF] tabular-nums">{fmt3(totalTTC)}</span>
                  <span className="text-sm font-bold text-slate-400 ml-1.5">TND</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
            <p className="text-[11px] text-slate-300 font-medium">NexusCRM — Document généré automatiquement</p>
            <p className="text-[11px] text-slate-300 font-medium">{ref} · {formatDate(fav.DatUser)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavDetail;
