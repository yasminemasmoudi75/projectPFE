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
  if (error) return <div className="text-center text-red-600 p-8">Erreur: {error}</div>;
  if (!fav) return <div className="text-center text-gray-500 p-8">Facture non trouvée</div>;

  const details = fav.details || [];

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto pb-20 pt-10 px-4 font-sans">
      {/* Action Buttons (Simple - Print Hidden) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/fav')}
          className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-semibold text-xs py-2"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
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

      {/* CLEAN DOCUMENT VIEW */}
      <div className="bg-white rounded-lg border border-slate-100 p-12 shadow-sm min-h-[1000px] text-slate-700 print:shadow-none print:border-none print:p-0">
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
                    className={`font-semibold ${
                      fav.Valid ? 'text-emerald-600' : 'text-amber-600'
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
