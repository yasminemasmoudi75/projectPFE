import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { fetchFavById, clearCurrentFav } from './favSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '@app/axios';

const FavDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentFav: fav, loading, error } = useSelector((state) => state.fav);

  useEffect(() => {
    if (id) {
      dispatch(fetchFavById(id));
    }
    return () => {
      dispatch(clearCurrentFav());
    };
  }, [dispatch, id]);

  const handleDownloadPDF = async () => {
    if (!fav) return;
    try {
      const response = await api.get(`/fav/${id}/pdf`, {
        responseType: 'blob',
      });
      const pdfBlob = response instanceof Blob ? response : new Blob([response]);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_${fav.Prfx}${fav.Nf}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF généré avec succès');
    } catch (err) {
      console.error('Erreur PDF:', err);
      toast.error('Erreur lors de la génération du PDF');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="h-14 w-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-400 text-xl font-bold select-none">!</div>
      <p className="text-sm font-semibold text-slate-700">Erreur lors du chargement</p>
      <p className="text-xs text-slate-400 max-w-xs text-center">{error}</p>
    </div>
  );
  if (!fav) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
        <PrinterIcon className="h-7 w-7 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Facture introuvable</p>
      <button onClick={() => navigate('/fav')} className="btn btn-secondary text-xs mt-2">← Retour à la liste</button>
    </div>
  );

  const details = fav.details || [];

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl mx-auto pb-20">
      {/* ── Page Header ── */}
      <div className="card-luxury p-5 bg-gradient-to-r from-emerald-50 via-white to-blue-50/40 border-none print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/fav')}
              className="h-10 w-10 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-all flex-shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-0.5">Factures</p>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">{fav.Prfx || 'FAC'}{fav.Nf}</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Client · <span className="font-semibold text-slate-700">{fav.LibTiers}</span>
                {fav.Valid ? <span className="ml-2 badge badge-success">Validée</span> : <span className="ml-2 badge badge-warning">Brouillon</span>}
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-bold text-xs shadow-sm"
          >
            <PrinterIcon className="h-4 w-4 inline mr-2" />
            Télécharger PDF
          </button>
          </div>
        </div>
      </div>

      {/* CLEAN DOCUMENT VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[1000px] text-slate-700 print:shadow-none print:border-none print:p-0">
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-blue-500 to-sky-400 -mx-12 -mt-12 mb-12 print:hidden" />
        {/* Header Section */}
        <div className="flex justify-between items-start mb-16">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AMS-LABO</h1>
            <div className="text-[11px] text-slate-500 font-medium leading-relaxed uppercase tracking-wider space-y-0.5">
              <p>RUE TAHER KAMMOUN</p>
              <p>3000 SFAX — TUNISIE</p>
              <p className="pt-2">
                Tel: <span className="text-slate-700">74 407 194</span>
              </p>
              <p>
                Email: <span className="text-slate-700 lowercase">contact@amslabo.com</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-lg font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-1">
              NEXUS
            </h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1 italic">
              Innovation
            </p>
          </div>
        </div>

        {/* Big Centered Title */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-[0.3em] py-4 border-y border-slate-100">
            Facture
          </h2>
        </div>

        {/* Ref & Client Information */}
        <div className="grid grid-cols-2 gap-20 mb-16">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                Détails Document
              </p>
              <div className="space-y-1 text-sm">
                <p className="font-bold text-slate-800">
                  Réf:{' '}
                  <span className="text-blue-600 tracking-tight">
                    {fav.Prfx}
                    {fav.Nf}
                  </span>
                </p>
                <p>
                  Émis le:{' '}
                  <span className="font-semibold">{formatDate(fav.DatUser)}</span>
                </p>
                <p>
                  État:{' '}
                  <span
                    className={`font-semibold ${fav.Valid ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                  >
                    {fav.Valid ? 'Validée' : 'Brouillon'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Destinataire
            </p>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">{fav.LibTiers}</h3>
              <div className="text-sm text-slate-500 leading-relaxed">
                <p>{fav.Adresse}</p>
                <p className="font-semibold text-slate-700">{fav.Ville}</p>
              </div>
              {fav.Cin && (
                <p className="text-[10px] font-mono text-slate-400 mt-2 italic">
                  ID: {fav.Cin}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Simple Articles Table */}
        <div className="mb-16">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-32">
                  Article
                </th>
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Désignation
                </th>
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-32">
                  P.U TTC
                </th>
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24">
                  Qté
                </th>
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-40">
                  Total TTC
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.map((item, idx) => (
                <tr key={idx} className="group">
                  <td className="py-5 font-mono text-[11px] text-slate-400 italic">
                    #{item.CodArt}
                  </td>
                  <td className="py-5">
                    <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                      {item.LibArt}
                    </p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">
                      {item.ExLibArt || '-'}
                    </p>
                  </td>
                  <td className="py-5 text-sm font-medium text-slate-600 text-right tabular-nums">
                    {formatCurrency(item.PuTTC || 0).replace(' TND', '')}
                  </td>
                  <td className="py-5 text-sm font-bold text-slate-800 text-center tabular-nums">
                    {item.Qt}
                  </td>
                  <td className="py-5 text-sm font-bold text-slate-900 text-right tabular-nums">
                    {formatCurrency(item.Qt * (item.PuTTC || 0)).replace(' TND', '')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(!details || details.length === 0) && (
            <div className="py-12 text-center text-slate-300 italic text-sm">
              Aucun article présent.
            </div>
          )}
        </div>

        {/* Clean Financial Section */}
        <div className="flex justify-end pt-8">
          <div className="w-80 space-y-3">
            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
              <span className="font-semibold text-slate-400 uppercase tracking-widest">
                Total Hors Taxe
              </span>
              <span className="font-bold text-slate-700 tabular-nums">
                {formatCurrency(fav.TotHT || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
              <span className="font-semibold text-slate-400 uppercase tracking-widest">
                TVA (19%)
              </span>
              <span className="font-bold text-slate-700 tabular-nums">
                {formatCurrency(fav.TotTva || 0)}
              </span>
            </div>
            {fav.TotRem > 0 && (
              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50 text-rose-600">
                <span className="font-semibold uppercase tracking-widest">Remise</span>
                <span className="font-bold tabular-nums">
                  -{formatCurrency(fav.TotRem || 0)}
                </span>
              </div>
            )}
            <div className="pt-6 mt-4 border-t-2 border-slate-100">
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  Total Net TTC
                </span>
                <div className="text-right">
                  <span className="text-4xl font-black text-blue-600 tabular-nums">
                    {formatCurrency(fav.TotTTC || 0).replace(' TND', '')}
                  </span>
                  <span className="text-xs font-bold text-slate-400 ml-2">TND</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page End Design */}
        <div className="mt-32 border-t border-slate-50" />
      </div>
    </div>
  );
};

export default FavDetail;
