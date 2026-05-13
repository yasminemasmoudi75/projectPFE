import { useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { fetchBlvById, clearCurrentBlv } from './blvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';

const BlvDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBlv: blv, loading, error } = useSelector((state) => state.blv);

  // Lire en priorité les colonnes dédiées CodChauff / DesChauff
  // Fallback sur l'ancien tag JSON dans Remarq pour les BL antérieurs à la migration
  const transport = useMemo(() => {
    // 1️⃣ Priorité : colonnes dédiées
    if (blv?.DesChauff) {
      return {
        nom: blv.DesChauff,
        tel: blv.CodChauff || ''
      };
    }
    // 2️⃣ Fallback : tag JSON encodé dans Remarq (ancien système)
    const raw = String(blv?.Remarq || '');
    const match = raw.match(/__transport__=({.*})/);
    if (!match?.[1]) return null;
    try {
      const parsed = JSON.parse(match[1]);
      if (!parsed || typeof parsed !== 'object') return null;
      return parsed;
    } catch {
      return null;
    }
  }, [blv?.DesChauff, blv?.CodChauff, blv?.Remarq]);

  useEffect(() => {
    if (id) {
      dispatch(fetchBlvById(id));
    }
    return () => {
      dispatch(clearCurrentBlv());
    };
  }, [dispatch, id]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center text-red-600 p-8">Erreur: {error}</div>;
  if (!blv) return <div className="text-center text-gray-500 p-8">Bon de livraison non trouvé</div>;

  const details = blv.details || [];

  return (
    <div className="animate-fade-in space-y-8 max-w-5xl mx-auto pb-20 pt-10 px-4 font-sans">
      {/* Action Buttons (Simple - Print Hidden) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate('/blv')}
          className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-semibold text-xs py-2"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Retour à la liste
        </button>
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
            Bon de Livraison
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
                    {blv.Prfx}
                    {blv.Nf}
                  </span>
                </p>
                <p>
                  Émis le: <span className="font-semibold">{formatDate(blv.DatUser)}</span>
                </p>
                <p>
                  État:{' '}
                  <span
                    className={`font-semibold ${
                      blv.Valid ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {blv.Valid ? 'Validé' : 'Brouillon'}
                  </span>
                </p>
              </div>
            </div>

            {transport?.nom && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Transport
                </p>
                <div className="text-sm text-slate-600 space-y-1">
                  <p>
                    Chauffeur: <span className="font-semibold text-slate-800">{transport.nom}</span>
                  </p>
                  {transport.tel ? <p>Tél: <span className="font-semibold">{transport.tel}</span></p> : null}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              Destinataire
            </p>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">{blv.LibTiers}</h3>
              <div className="text-sm text-slate-500 leading-relaxed">
                <p>{blv.Adresse}</p>
                <p className="font-semibold text-slate-700">{blv.Ville}</p>
              </div>
              {blv.Cin && (
                <p className="text-[10px] font-mono text-slate-400 mt-2 italic">
                  ID: {blv.Cin}
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
                  P.U HT
                </th>
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24">
                  Qté
                </th>
                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-40">
                  Total HT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {details.map((item, idx) => {
                const lineTotal =
                  Number.isFinite(Number(item.MntHT)) ? Number(item.MntHT) : (Number(item.Qt) || 0) * (Number(item.PuHT) || 0);

                return (
                  <tr key={idx} className="group">
                    <td className="py-5 font-mono text-[11px] text-slate-400 italic">#{item.CodArt}</td>
                    <td className="py-5">
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">{item.LibArt}</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">{item.ExLibArt || '-'}</p>
                    </td>
                    <td className="py-5 text-sm font-medium text-slate-600 text-right tabular-nums">
                      {formatCurrency(item.PuHT || 0).replace(' TND', '')}
                    </td>
                    <td className="py-5 text-sm font-bold text-slate-800 text-center tabular-nums">{item.Qt}</td>
                    <td className="py-5 text-sm font-bold text-slate-900 text-right tabular-nums">
                      {formatCurrency(lineTotal || 0).replace(' TND', '')}
                    </td>
                  </tr>
                );
              })}
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
                {formatCurrency(blv.TotHT || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
              <span className="font-semibold text-slate-400 uppercase tracking-widest">
                TVA (19%)
              </span>
              <span className="font-bold text-slate-700 tabular-nums">
                {formatCurrency(blv.TotTva || 0)}
              </span>
            </div>
            {blv.TotRem > 0 && (
              <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50 text-rose-600">
                <span className="font-semibold uppercase tracking-widest">Remise</span>
                <span className="font-bold tabular-nums">
                  -{formatCurrency(blv.TotRem || 0)}
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
                    {formatCurrency(blv.TotTTC || 0).replace(' TND', '')}
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

export default BlvDetail;
