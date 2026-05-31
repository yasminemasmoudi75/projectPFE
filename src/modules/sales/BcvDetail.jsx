import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  TruckIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CalendarIcon,
  UserIcon,
  ArchiveBoxIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { fetchBcvById, clearCurrentBcv } from './bcvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import api from '@app/axios';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';

const fmt3 = (n) => (n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const StatusBadge = ({ bcv }) => {
    if (bcv?.bLivr || bcv?.IsConverted)
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Livré</span>;
    if (bcv?.bTransf)
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Transformé</span>;
    if (bcv?.Valid)
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />Validé</span>;
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />Brouillon</span>;
};

const BcvDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBcv: bcv, loading, error } = useSelector((s) => s.bcv);
    const { isAdmin, isCommercial } = useAuth();
    const [showDriverForm, setShowDriverForm] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [isRequesting, setIsRequesting] = useState(false);
    const [pendingRequestTarget, setPendingRequestTarget] = useState(null);
    const [chauffeur, setChauffeur] = useState({ nom: '', tel: '' });

    const alreadyTransferred = Boolean(bcv?.bTransf || bcv?.bLivr || bcv?.IsConverted);

    const canSubmitDriver = useMemo(() => {
        const nomOk = String(chauffeur?.nom || '').trim().length > 0;
        const tel = String(chauffeur?.tel || '').trim();
        return nomOk && /^\d{8}$/.test(tel);
    }, [chauffeur]);

    const phoneError = useMemo(() => {
        const tel = String(chauffeur?.tel || '').trim();
        if (!tel) return 'Téléphone obligatoire';
        if (!/^\d+$/.test(tel)) return 'Uniquement des chiffres';
        if (tel.length !== 8) return 'Exactement 8 chiffres';
        return '';
    }, [chauffeur?.tel]);

    useEffect(() => {
        if (id) dispatch(fetchBcvById(id));
        return () => dispatch(clearCurrentBcv());
    }, [dispatch, id]);

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/bcv/${id}/pdf`, { responseType: 'blob' });
            const blob = response.data instanceof Blob
                ? response.data
                : new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bc_${bcv.Prfx || 'BC'}${bcv.Nf}.pdf`);
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

    const doTransfer = async (targetType, payload = {}) => {
        try {
            setIsTransferring(true);
            const response = await api.post(`/bcv/${id}/transfer`, { targetType, ...payload });
            if (response?.status === 'success') {
                toast.success(`Transféré vers ${targetType === 'BL' ? 'Bon de Livraison' : 'Facture'}`);
                const newId = response.data?.Guid;
                navigate(newId ? (targetType === 'BL' ? `/blv/${newId}` : `/fav/${newId}`) : (targetType === 'BL' ? '/blv' : '/fav'));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Erreur lors du transfert');
        } finally { setIsTransferring(false); }
    };

    const handleRequestTransfer = async (targetType) => {
        if (isRequesting || alreadyTransferred) { toast.error('Ce bon a déjà été transféré'); return; }
        try {
            setIsRequesting(true);
            setPendingRequestTarget(targetType);
            await api.post(`/bcv/${id}/request-transfer`, { targetType });
            toast.success(`Demande ${targetType === 'FAC' ? 'Facture' : 'BL'} envoyée`);
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Erreur lors de la demande');
        } finally { setIsRequesting(false); setPendingRequestTarget(null); }
    };

    const handleTransfer = async (targetType) => {
        if (alreadyTransferred) { toast.error('Ce bon a déjà été transféré'); return; }
        if (targetType === 'BL') { setShowDriverForm(true); return; }
        await doTransfer(targetType);
    };

    const submitDriverAndTransfer = async () => {
        if (!canSubmitDriver) { toast.error(phoneError || 'Informations chauffeur incomplètes'); return; }
        setShowDriverForm(false);
        await doTransfer('BL', { transport: { nom: chauffeur.nom.trim(), tel: chauffeur.tel.trim() } });
    };

    if (loading) return <LoadingSpinner />;
    if (error || !bcv) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-16 w-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <ArchiveBoxIcon className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-sm font-semibold text-slate-700">{error ? 'Erreur de chargement' : 'Bon de commande introuvable'}</p>
            <button onClick={() => navigate('/bcv')} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-500 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                <ArrowLeftIcon className="h-4 w-4" /> Retour à la liste
            </button>
        </div>
    );

    return (
        <div className="animate-fade-in space-y-5 max-w-5xl mx-auto pb-20">

            {/* ── Modal Chauffeur ── */}
            {showDriverForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 print:hidden">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isTransferring && setShowDriverForm(false)} />
                    <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
                        <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-[#e0f0ff] flex items-center justify-center">
                                    <TruckIcon className="h-5 w-5 text-[#0062AF]" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">Informations chauffeur</h3>
                                    <p className="text-xs text-slate-400">Requis pour créer le Bon de Livraison</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDriverForm(false)} disabled={isTransferring} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 transition-all">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Nom <span className="text-rose-500">*</span></label>
                                <input value={chauffeur.nom} onChange={(e) => setChauffeur(s => ({ ...s, nom: e.target.value }))}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all"
                                    placeholder="Mohamed Trabelsi" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Téléphone <span className="text-rose-500">*</span></label>
                                <input value={chauffeur.tel} onChange={(e) => setChauffeur(s => ({ ...s, tel: e.target.value }))}
                                    className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 transition-all ${phoneError && chauffeur.tel ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100' : 'border-slate-200 focus:border-[#0062AF]/50 focus:ring-[#0062AF]/10'}`}
                                    placeholder="22123456" inputMode="numeric" maxLength={8} />
                                {phoneError && chauffeur.tel && <p className="text-[11px] text-rose-500 font-medium mt-1">{phoneError}</p>}
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex items-center justify-end gap-2">
                            <button onClick={() => setShowDriverForm(false)} disabled={isTransferring}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50">
                                Annuler
                            </button>
                            <button onClick={submitDriverAndTransfer} disabled={!canSubmitDriver || isTransferring}
                                className="px-5 py-2.5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-white text-sm font-semibold transition-all disabled:opacity-50 active:scale-95 shadow-sm shadow-blue-500/20">
                                {isTransferring ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Création...</span> : 'Créer le BL'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Page Header ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden">

                <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">

                    {/* ── Left: navigation + identity ── */}
                    <div className="flex items-center gap-4 min-w-0">
                        <button onClick={() => navigate('/bcv')}
                            className="h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all group flex-shrink-0 shadow-sm">
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>

                        {/* Icon */}
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#0062AF] to-sky-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                            <ArchiveBoxIcon className="h-5 w-5 text-white" />
                        </div>

                        {/* Identity block */}
                        <div className="min-w-0">
                            <div className="flex items-center gap-2.5 flex-wrap mb-0.5">
                                <h1 className="text-lg font-black text-slate-900 tracking-tight">
                                    {bcv.Prfx || 'BC'}{bcv.Nf}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                                {bcv.LibTiers && (
                                    <span className="font-semibold text-slate-600 truncate max-w-[200px]">{bcv.LibTiers}</span>
                                )}
                                {bcv.LibTiers && bcv.DatUser && <span className="text-slate-300">·</span>}
                                {bcv.DatUser && (
                                    <span className="flex items-center gap-1">
                                        <CalendarIcon className="h-3 w-3 text-slate-400" />
                                        {formatDate(bcv.DatUser)}
                                    </span>
                                )}
                                {(bcv.TotTTC > 0) && (
                                    <>
                                        <span className="text-slate-300">·</span>
                                        <span className="font-bold text-[#0062AF]">
                                            {fmt3(bcv.TotTTC)} TND
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right: actions ── */}
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">

                        {/* Admin: primary actions */}
                        {!alreadyTransferred && isAdmin && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleTransfer('BL')} disabled={isTransferring}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-sm shadow-blue-500/25 transition-all disabled:opacity-50 active:scale-[0.97]">
                                    <TruckIcon className="h-4 w-4" />
                                    {isTransferring ? <span className="flex items-center gap-1.5"><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Transfert...</span> : 'Créer BL'}
                                </button>
                                <button onClick={() => handleTransfer('FAC')} disabled={isTransferring}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all disabled:opacity-50 active:scale-[0.97]">
                                    <BanknotesIcon className="h-4 w-4" />
                                    Facturer
                                </button>
                            </div>
                        )}

                        {/* Commercial: request actions */}
                        {!alreadyTransferred && isCommercial && bcv?.CodDev && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleRequestTransfer('BL')} disabled={isRequesting}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all disabled:opacity-50">
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                    {isRequesting && pendingRequestTarget === 'BL' ? 'Envoi...' : 'Demander BL'}
                                </button>
                                <button onClick={() => handleRequestTransfer('FAC')} disabled={isRequesting}
                                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all disabled:opacity-50">
                                    <PaperAirplaneIcon className="h-4 w-4" />
                                    {isRequesting && pendingRequestTarget === 'FAC' ? 'Envoi...' : 'Demander Facture'}
                                </button>
                            </div>
                        )}

                        {/* Separator */}
                        {(isAdmin || isCommercial) && (
                            <div className="h-7 w-px bg-slate-200 mx-1 hidden sm:block" />
                        )}

                        {/* Secondary actions */}
                        <div className="flex items-center gap-1.5">
                            {(isAdmin || isCommercial) && (
                                <button onClick={() => navigate(`/bcv/edit/${id}`)}
                                    className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm">
                                    <PencilSquareIcon className="h-4 w-4 text-slate-400" />
                                    Modifier
                                </button>
                            )}
                            <button onClick={handleDownloadPDF}
                                className="flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-xl transition-all shadow-sm">
                                <PrinterIcon className="h-4 w-4 text-slate-400" />
                                PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Document Card ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:shadow-none print:border-none">
                <div className="h-1 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400 print:hidden" />

                <div className="px-12 py-10 print:p-8">

                    {/* ── En-tête : société + branding ── */}
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

                    {/* ── Titre document ── */}
                    <div className="text-center mb-10">
                        <h2 className="text-[22px] font-black text-slate-900 uppercase tracking-[0.3em]">Bon de Commande</h2>
                        <div className="mt-2 mx-auto w-32 h-0.5 bg-gradient-to-r from-transparent via-[#0062AF] to-transparent" />
                    </div>

                    {/* ── Référence + Client côte à côte ── */}
                    <div className="grid grid-cols-2 gap-12 mb-10 pb-10 border-b border-slate-100">
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Détails du document</p>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Référence</span>
                                <span className="font-black text-[#0062AF] font-mono">{bcv.Prfx || 'BC'}{bcv.Nf}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Date</span>
                                <span className="font-semibold text-slate-700">{formatDate(bcv.DatUser) || '—'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Livraison prévue</span>
                                <span className="font-semibold text-slate-700">{formatDate(bcv.DatLiv) || '—'}</span>
                            </div>
                            {bcv.Remarq && (
                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Remarques</p>
                                    <p className="text-xs text-slate-500 italic leading-relaxed">{bcv.Remarq}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Destinataire</p>
                            <h3 className="text-xl font-black text-slate-900 leading-tight mb-2">{bcv.LibTiers}</h3>
                            <div className="text-sm text-slate-500 space-y-0.5 leading-relaxed">
                                {bcv.Adresse && <p>{bcv.Adresse}</p>}
                                {bcv.Ville && <p className="font-semibold text-slate-700">{bcv.Ville}</p>}
                                {bcv.Cin && <p className="font-mono text-slate-400 text-xs">ID : {bcv.Cin}</p>}
                            </div>
                        </div>
                    </div>

                    {/* ── Table articles ── */}
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
                                    {bcv.details?.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-4 py-4">
                                                <span className="text-xs font-mono font-bold text-slate-500">{item.CodArt || '—'}</span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="text-sm font-semibold text-slate-800 leading-tight">{item.LibArt}</p>
                                                {item.ExLibArt && <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.ExLibArt}</p>}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600 text-right tabular-nums font-medium">
                                                {fmt3(item.PuHT || 0)} DT
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-slate-800 text-center tabular-nums">
                                                {item.Qt}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-bold text-slate-900 text-right tabular-nums">
                                                {fmt3(item.MntHT || (item.Qt * (item.PuHT || 0)))} DT
                                            </td>
                                        </tr>
                                    ))}
                                    {(!bcv.details || bcv.details.length === 0) && (
                                        <tr>
                                            <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-400 italic">Aucun article.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* ── Récapitulatif financier ── */}
                    <div className="flex justify-end mb-12">
                        <div className="w-full sm:w-80 space-y-2">
                            <div className="space-y-2 pb-4 border-b border-slate-200">
                                {[
                                    { label: 'Sous-total HT', value: bcv.TotHT || 0, color: 'text-slate-600' },
                                    { label: `TVA (${bcv.details?.[0]?.Tva ?? 19}%)`, value: bcv.TotTva || 0, color: 'text-slate-600' },
                                    ...((bcv.TotRem || 0) > 0 ? [{ label: 'Remise', value: -(bcv.TotRem || 0), color: 'text-rose-600' }] : []),
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
                                    <span className="text-3xl font-black text-[#0062AF] tabular-nums">
                                        {fmt3(bcv.TotTTC || 0)}
                                    </span>
                                    <span className="text-sm font-bold text-slate-400 ml-1.5">TND</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="pt-6 border-t border-slate-50 text-center text-[10px] text-slate-300 uppercase tracking-[0.2em]">
                        NexusCRM Suite — Document Officiel
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BcvDetail;
