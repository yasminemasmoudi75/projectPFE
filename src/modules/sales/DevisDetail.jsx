import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowLeftIcon,
  PrinterIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { fetchDevisById, validateDevis, convertDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '@app/axios';
import useAuth from '../../hooks/useAuth';

const fmt3 = (n) => (n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const StatusBadge = ({ devis }) => {
  if (devis.IsConverted || devis.bTransf)
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Transformé</span>;
  if (devis.Valid)
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Validé</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Brouillon</span>;
};

const DevisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentDevis: devis, loading, error } = useSelector((state) => state.devis);
  const { isAdmin, isCommercial } = useAuth();
  const [isConverting, setIsConverting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchDevisById(id));
  }, [dispatch, id]);

  const handleValidate = async () => {
    if (isValidating) return;
    setIsValidating(true);
    try {
      await dispatch(validateDevis(id)).unwrap();
      toast.success('Devis validé avec succès');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la validation');
    } finally { setIsValidating(false); }
  };

  const handleConvert = async () => {
    if (isConverting) return;
    setIsConverting(true);
    try {
      await dispatch(convertDevis(id)).unwrap();
      toast.success('Devis converti en commande');
      navigate('/bcv');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la conversion');
    } finally { setIsConverting(false); }
  };

  const handleRequestConvert = async () => {
    if (isRequesting) return;
    setIsRequesting(true);
    try {
      await api.post(`/devis/${id}/request-convert`);
      toast.success("Demande envoyée à l'administrateur");
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de la demande');
    } finally { setIsRequesting(false); }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await api.get(`/devis/${id}/pdf`, { responseType: 'blob' });
      const blob = response.data instanceof Blob
        ? response.data
        : new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis_${devis.Prfx || 'DV'}${devis.Nf}.pdf`);
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

  if (!devis) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <DocumentTextIcon className="h-8 w-8 text-slate-300" />
      </div>
      <p className="text-sm font-semibold text-slate-700">Devis introuvable</p>
      <button onClick={() => navigate('/devis')} className="text-xs text-slate-500 hover:text-slate-700">← Retour à la liste</button>
    </div>
  );

  const ref = `${devis.Prfx || 'DV'}${devis.Nf}`;
  const totalHT  = Number(devis.TotHT  || 0);
  const totalTVA = Number(devis.TotTva || 0);
  const totalRem = Number(devis.TotRem || 0);
  const totalTTC = Number(devis.TotTTC || 0);

  return (
    <div className="animate-fade-in space-y-5 max-w-5xl mx-auto pb-16">

      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">

          {/* Left */}
          <div className="flex items-center gap-4 min-w-0">
            <button onClick={() => navigate('/devis')}
              className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all group flex-shrink-0 shadow-sm">
              <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            </button>
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">{ref}</h1>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                {devis.LibTiers && <span className="font-semibold text-slate-600 truncate max-w-[200px]">{devis.LibTiers}</span>}
                {devis.LibTiers && devis.DatUser && <span className="text-slate-300">·</span>}
                {devis.DatUser && (
                  <span className="flex items-center gap-1">
                    <CalendarDaysIcon className="h-3 w-3 text-slate-400" />
                    {formatDate(devis.DatUser)}
                  </span>
                )}
                {totalTTC > 0 && <><span className="text-slate-300">·</span><span className="font-bold text-[#0062AF]">{fmt3(totalTTC)} TND</span></>}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {!devis.Valid && (
              <button onClick={handleValidate} disabled={isValidating}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all disabled:opacity-50 active:scale-[0.97]">
                <CheckCircleIcon className="h-4 w-4" />
                {isValidating ? 'Validation...' : 'Valider'}
              </button>
            )}
            {!(devis.IsConverted || devis.bTransf) && devis.Valid && (
              (isAdmin || isCommercial) ? (
                <button onClick={handleConvert} disabled={isConverting}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-[0.97]">
                  <ArrowPathIcon className="h-4 w-4" />
                  {isConverting ? 'Conversion...' : 'Convertir en BC'}
                </button>
              ) : (
                <button onClick={handleRequestConvert} disabled={isRequesting}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all disabled:opacity-50">
                  <PaperAirplaneIcon className="h-4 w-4" />
                  {isRequesting ? 'Envoi...' : 'Demander conversion'}
                </button>
              )
            )}
            {(isAdmin || isCommercial) && <div className="h-7 w-px bg-slate-200 mx-1 hidden sm:block" />}
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
            <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-[0.3em]">Devis</h2>
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
                <span className="font-semibold text-slate-700">{formatDate(devis.DatUser) || '—'}</span>
              </div>
              {devis.Remarq && (
                <div className="pt-3 border-t border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarques</p>
                  <p className="text-xs text-slate-500 italic leading-relaxed">{devis.Remarq}</p>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Destinataire</p>
              <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{devis.LibTiers}</h3>
              <div className="text-sm text-slate-500 space-y-0.5 leading-relaxed">
                {devis.Adresse && <p>{devis.Adresse}</p>}
                {devis.Ville && <p className="font-semibold text-slate-700">{devis.Ville}</p>}
                {devis.Cin && <p className="font-mono text-slate-400 text-xs">ID : {devis.Cin}</p>}
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
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-32">P.U HT</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-20">Qté</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-36">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devis.details?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4"><span className="text-xs font-mono font-bold text-slate-500">{item.CodArt || '—'}</span></td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.LibArt}</p>
                        {item.ExLibArt && <p className="text-[11px] text-slate-400 mt-0.5">{item.ExLibArt}</p>}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 text-right tabular-nums font-medium">{fmt3(item.PuHT || 0)} DT</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-center tabular-nums">{item.Qt}</td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                        {fmt3(item.MntHT || ((item.Qt || 0) * (item.PuHT || 0)))} DT
                      </td>
                    </tr>
                  ))}
                  {(!devis.details || devis.details.length === 0) && (
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
                  { label: `TVA (${devis.details?.[0]?.Tva ?? 19}%)`, value: totalTVA, color: 'text-slate-600' },
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
            <p className="text-[11px] text-slate-300 font-medium">{ref} · {formatDate(devis.DatUser)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisDetail;
