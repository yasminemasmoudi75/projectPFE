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
  BuildingOffice2Icon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { fetchDevisById, validateDevis, convertDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import toast from 'react-hot-toast';
import api from '@app/axios';
import useAuth from '../../hooks/useAuth';

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
      const pdfBlob = response instanceof Blob ? response : new Blob([response]);
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis_${devis.Prfx}${devis.Nf}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF généré avec succès');
    } catch (err) {
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
      <button onClick={() => navigate('/devis')} className="btn btn-secondary text-xs">← Retour à la liste</button>
    </div>
  );

  const ref = `${devis.Prfx || 'DV'}${devis.Nf}`;
  const totalHT  = Number(devis.TotHT  || 0);
  const totalTVA = Number(devis.TotTva || 0);
  const totalRem = Number(devis.TotRem || 0);
  const totalTTC = Number(devis.TotTTC || 0);

  return (
    <div className="animate-fade-in space-y-5 max-w-5xl mx-auto pb-16">

      {/* ── Top action bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

          {/* Left: nav + title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/devis')}
              className="h-9 w-9 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-bold text-slate-900">{ref}</h1>
                <StatusBadge devis={devis} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {devis.LibTiers} · {formatDate(devis.DatUser)}
              </p>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex gap-2 flex-wrap">
            {!devis.Valid && (
              <button onClick={handleValidate} disabled={isValidating}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors font-semibold text-xs disabled:opacity-50">
                <CheckCircleIcon className="h-3.5 w-3.5" />
                {isValidating ? 'Validation...' : 'Valider'}
              </button>
            )}
            {!(devis.IsConverted || devis.bTransf) && devis.Valid && (
              (isAdmin || isCommercial) ? (
                <button onClick={handleConvert} disabled={isConverting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#0062AF]/10 text-[#0062AF] border border-[#0062AF]/20 rounded-xl hover:bg-[#0062AF]/15 transition-colors font-semibold text-xs disabled:opacity-50">
                  <ArrowPathIcon className="h-3.5 w-3.5" />
                  {isConverting ? 'Conversion...' : 'Convertir en BC'}
                </button>
              ) : (
                <button onClick={handleRequestConvert} disabled={isRequesting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors font-semibold text-xs disabled:opacity-50">
                  <PaperAirplaneIcon className="h-3.5 w-3.5" />
                  {isRequesting ? 'Envoi...' : 'Demander conversion'}
                </button>
              )
            )}
            <button onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-xs shadow-sm">
              <PrinterIcon className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* ── Document ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">

        {/* Brand accent line */}
        <div className="h-1 bg-gradient-to-r from-[#0062AF] via-sky-400 to-[#0062AF]" />

        <div className="p-8 sm:p-12">

          {/* Document Header */}
          <div className="flex items-start justify-between mb-10 pb-8 border-b border-slate-100">
            {/* Company info */}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AMS-LABO</h1>
              <div className="space-y-0.5 text-xs text-slate-500 leading-relaxed">
                <p className="font-medium">RUE TAHER KAMMOUN</p>
                <p>3000 SFAX — TUNISIE</p>
                <p className="flex items-center gap-1 pt-1">
                  <span className="font-semibold text-slate-700">Tél:</span> 74 407 194
                </p>
                <p className="flex items-center gap-1">
                  <span className="font-semibold text-slate-700">Email:</span> contact@amslabo.com
                </p>
              </div>
            </div>

            {/* Document badge */}
            <div className="text-right">
              <div className="inline-block px-5 py-3 bg-[#0062AF]/5 border border-[#0062AF]/15 rounded-2xl">
                <p className="text-[10px] font-bold text-[#0062AF]/60 uppercase tracking-widest mb-0.5">Document</p>
                <h2 className="text-xl font-black text-[#0062AF]">DEVIS</h2>
                <p className="text-sm font-bold text-slate-800 mt-0.5 font-mono">{ref}</p>
              </div>
            </div>
          </div>

          {/* Meta + Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">

            {/* Document meta */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Détails du document</p>
              {[
                { icon: DocumentTextIcon, label: 'Référence', value: ref },
                { icon: CalendarDaysIcon, label: 'Date d\'émission', value: formatDate(devis.DatUser) },
                { icon: null, label: 'Statut', value: <StatusBadge devis={devis} /> },
              ].map((row, i) => (
                <div key={i} className="flex items-center gap-3">
                  {row.icon && (
                    <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <row.icon className="h-3.5 w-3.5 text-slate-500" />
                    </div>
                  )}
                  {!row.icon && <div className="w-7" />}
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{row.label}</p>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5">{row.value}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Client info */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <BuildingOffice2Icon className="h-4 w-4 text-[#0062AF]" />
                <p className="text-[10px] font-bold text-[#0062AF] uppercase tracking-widest">Destinataire</p>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-2">{devis.LibTiers}</h3>
              {(devis.Adresse || devis.Ville) && (
                <div className="flex items-start gap-1.5 text-sm text-slate-500">
                  <MapPinIcon className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    {devis.Adresse && <p>{devis.Adresse}</p>}
                    {devis.Ville && <p className="font-semibold text-slate-700">{devis.Ville}</p>}
                  </div>
                </div>
              )}
              {devis.Cin && (
                <p className="text-[11px] font-mono text-slate-400 mt-2">ID: {devis.Cin}</p>
              )}
            </div>
          </div>

          {/* Articles table */}
          <div className="mb-10">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Articles</p>
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Code</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Désignation</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">P.U HT</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-20">Qté</th>
                    <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-36">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {devis.details?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-4 font-mono text-[11px] text-slate-400">{item.CodArt}</td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-slate-800 leading-tight">{item.LibArt}</p>
                        {item.ExLibArt && (
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed max-w-sm">{item.ExLibArt}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600 text-right tabular-nums font-medium">
                        {formatCurrency(item.PuHT || 0).replace(' TND', '')}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-800 text-center tabular-nums">
                        {item.Qt}
                      </td>
                      <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                        {formatCurrency((item.Qt || 0) * (item.PuHT || 0)).replace(' TND', '')}
                      </td>
                    </tr>
                  ))}
                  {(!devis.details || devis.details.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400 italic">
                        Aucun article présent.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-full sm:w-80 space-y-2">
              <div className="space-y-2 pb-4 border-b border-slate-200">
                {[
                  { label: 'Sous-total HT',  value: totalHT,  color: 'text-slate-600' },
                  { label: 'TVA (19%)',       value: totalTVA, color: 'text-slate-600' },
                  ...(totalRem > 0 ? [{ label: 'Remise', value: -totalRem, color: 'text-rose-600' }] : []),
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{row.label}</span>
                    <span className={`text-sm font-bold tabular-nums ${row.color}`}>
                      {row.value < 0 ? '-' : ''}{formatCurrency(Math.abs(row.value))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grand total */}
              <div className="flex items-end justify-between pt-2">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total TTC</p>
                  <p className="text-[11px] text-slate-400">Toutes taxes comprises</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-[#0062AF] tabular-nums">
                    {formatCurrency(totalTTC).replace(' TND', '')}
                  </span>
                  <span className="text-sm font-bold text-slate-400 ml-1.5">TND</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-300 font-medium">NexusCRM — Document généré automatiquement</p>
            <p className="text-[11px] text-slate-300 font-medium">{ref} · {formatDate(devis.DatUser)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevisDetail;
