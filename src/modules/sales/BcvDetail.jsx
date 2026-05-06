import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PrinterIcon,
  TruckIcon,
  BanknotesIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { fetchBcvById, clearCurrentBcv } from './bcvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import api from '@app/axios';
import toast from 'react-hot-toast';

const BcvDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBcv: bcv, loading, error } = useSelector((s) => s.bcv);
    const [showDriverForm, setShowDriverForm] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [chauffeur, setChauffeur] = useState({
        nom: '',
        tel: ''
    });

    const alreadyTransferred = Boolean(bcv?.bTransf);

    const canSubmitDriver = useMemo(() => {
        const nomOk = String(chauffeur?.nom || '').trim().length > 0;
        const tel = String(chauffeur?.tel || '').trim();
        const telOk = /^\d{8}$/.test(tel); // exactement 8 chiffres, uniquement nombres
        return nomOk && telOk;
    }, [chauffeur]);

    const phoneError = useMemo(() => {
        const tel = String(chauffeur?.tel || '').trim();
        if (!tel) return 'Téléphone obligatoire';
        if (!/^\d+$/.test(tel)) return 'Téléphone doit contenir uniquement des chiffres';
        if (tel.length !== 8) return 'Téléphone doit contenir exactement 8 chiffres';
        return '';
    }, [chauffeur?.tel]);

    useEffect(() => {
        if (id) dispatch(fetchBcvById(id));
        return () => dispatch(clearCurrentBcv());
    }, [dispatch, id]);

    const handleDownloadPDF = async () => {
        try {
            const response = await api.get(`/bcv/${id}/pdf`, {
                responseType: 'blob'
            });

            const pdfBlob = response instanceof Blob ? response : new Blob([response]);
            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `bc_${bcv.Prfx || 'BC'}${bcv.Nf}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success('PDF généré avec succès');
        } catch (err) {
            console.error('Erreur PDF BC:', err);
            toast.error('Erreur lors de la génération du PDF');
        }
    };

    const doTransfer = async (targetType, payload = {}) => {
        try {
            setIsTransferring(true);
            const response = await api.post(`/bcv/${id}/transfer`, { targetType, ...payload });
            if (response?.status === 'success') {
                toast.success(`Transféré avec succès vers ${targetType === 'BL' ? 'Bon de Livraison' : 'Facture'}`);
                const newId = response.data?.Guid;
                if (newId) {
                    navigate(targetType === 'BL' ? `/blv/${newId}` : `/fav/${newId}`);
                } else {
                    navigate(targetType === 'BL' ? '/blv' : '/fav');
                }
            }
        } catch (err) {
            console.error('Erreur transfert BC:', err);
            toast.error(err.response?.data?.message || 'Erreur lors du transfert');
        } finally {
            setIsTransferring(false);
        }
    };

    const handleTransfer = async (targetType) => {
        if (alreadyTransferred) {
            toast.error('Ce bon de commande a déjà été transféré');
            return;
        }
        if (targetType === 'BL') {
            // Ouvre un petit formulaire Chauffeur avant transformation vers BL
            setShowDriverForm(true);
            return;
        }
        await doTransfer(targetType);
    };

    const submitDriverAndTransfer = async () => {
        if (!canSubmitDriver) {
            toast.error(phoneError || 'Veuillez renseigner les informations du chauffeur');
            return;
        }
        const payload = {
            transport: {
                nom: String(chauffeur.nom || '').trim(),
                tel: String(chauffeur.tel || '').trim()
            }
        };
        setShowDriverForm(false);
        await doTransfer('BL', payload);
    };

    if (loading) return <LoadingSpinner />;
    if (error) return <div className="text-center text-red-600 p-8">Erreur: {error}</div>;
    if (!bcv) return <div className="text-center text-gray-500 p-8">Bon de commande non trouvé</div>;

    return (
        <div className="animate-fade-in space-y-8 max-w-5xl mx-auto pb-20 pt-10 px-4 font-sans">
            {/* Driver form modal (shown only for BC -> BL) */}
            {showDriverForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 print:hidden">
                    <div
                        className="absolute inset-0 bg-slate-900/40"
                        onClick={() => (isTransferring ? null : setShowDriverForm(false))}
                    />
                    <div className="relative w-full max-w-lg rounded-xl bg-white shadow-xl border border-slate-200">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-sm font-extrabold text-slate-900 tracking-wide uppercase">
                                Informations chauffeur
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Vous devez renseigner ces informations avant de créer le Bon de Livraison.
                            </p>
                        </div>

                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Nom du chauffeur <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    value={chauffeur.nom}
                                    onChange={(e) => setChauffeur((s) => ({ ...s, nom: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    placeholder="Ex: Mohamed Trabelsi"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                                    Numéro de téléphone <span className="text-rose-600">*</span>
                                </label>
                                <input
                                    value={chauffeur.tel}
                                    onChange={(e) => setChauffeur((s) => ({ ...s, tel: e.target.value }))}
                                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                                    placeholder="Ex: 22 123 456"
                                    inputMode="numeric"
                                    maxLength={8}
                                />
                                {!!phoneError && (
                                    <p className="text-[11px] text-rose-600 font-semibold mt-1">{phoneError}</p>
                                )}
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowDriverForm(false)}
                                disabled={isTransferring}
                                className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs disabled:opacity-60"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submitDriverAndTransfer}
                                disabled={!canSubmitDriver || isTransferring}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-extrabold text-xs disabled:opacity-60"
                            >
                                {isTransferring ? 'Transformation...' : 'Créer le BL'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Action Buttons (Print Hidden) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                <button
                    onClick={() => navigate('/bcv')}
                    className="flex items-center text-slate-500 hover:text-blue-600 transition-colors font-semibold text-xs py-2"
                >
                    <ArrowLeftIcon className="h-4 w-4 mr-2" />
                    Retour à la liste
                </button>
                <div className="flex gap-2 flex-wrap">
                    <div className="flex bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                        <button
                            onClick={() => handleTransfer('BL')}
                            disabled={isTransferring || alreadyTransferred}
                            className="inline-flex items-center px-4 py-2 text-slate-700 hover:bg-blue-50 border-r border-slate-100 transition-all font-bold text-xs"
                            title="Transférer vers Bon de Livraison"
                        >
                            <TruckIcon className="h-4 w-4 mr-2 text-blue-500" />
                            {alreadyTransferred ? 'Déjà transféré' : 'Transférer en BL'}
                        </button>
                        <button
                            onClick={() => handleTransfer('FAC')}
                            disabled={isTransferring || alreadyTransferred}
                            className="inline-flex items-center px-4 py-2 text-slate-700 hover:bg-emerald-50 transition-all font-bold text-xs"
                            title="Transférer vers Facture"
                        >
                            <BanknotesIcon className="h-4 w-4 mr-2 text-emerald-500" />
                            Facturer
                        </button>
                    </div>
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
                            <p className="pt-2">Tel: <span className="text-slate-700">74 407 194</span></p>
                            <p>Email: <span className="text-slate-700 lowercase">contact@amslabo.com</span></p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold text-slate-800 tracking-wider uppercase border-b border-slate-100 pb-1">NEXUS</h2>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1 italic">Innovation</p>
                    </div>
                </div>

                {/* Big Centered Title */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-[0.3em] py-4 border-y border-slate-100">Bon de Commande</h2>
                </div>

                {/* Ref & Client Information */}
                <div className="grid grid-cols-2 gap-20 mb-16">
                    <div className="space-y-4">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Détails Document</p>
                            <div className="space-y-1 text-sm">
                                <p className="font-bold text-slate-800">Réf: <span className="text-blue-600 tracking-tight">{bcv.Prfx || 'BC'}{bcv.Nf}</span></p>
                                <p>Date BC: <span className="font-semibold">{formatDate(bcv.DatUser)}</span></p>
                                <p>Date Livraison: <span className="font-semibold">{formatDate(bcv.DatLiv)}</span></p>
                                <p>État: <span className={`font-semibold ${bcv.Valid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {bcv.Valid ? 'Validé' : 'En cours'}
                                </span></p>
                            </div>
                        </div>
                        {bcv.Remarq && (
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-xs text-slate-500 italic leading-relaxed">{bcv.Remarq}</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Client</p>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900">{bcv.LibTiers}</h3>
                            <div className="text-sm text-slate-500 leading-relaxed">
                                <p>{bcv.Adresse}</p>
                                <p className="font-semibold text-slate-700">{bcv.Ville}</p>
                            </div>
                            {bcv.Cin && (
                                <p className="text-[10px] font-mono text-slate-400 mt-2 italic">ID: {bcv.Cin}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Articles Table */}
                <div className="mb-16">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-32">Article</th>
                                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Désignation</th>
                                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-32">P.U HT</th>
                                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center w-24">Qté</th>
                                <th className="py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right w-40">Total HT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {bcv.details?.map((item, idx) => (
                                <tr key={idx} className="group">
                                    <td className="py-5 font-mono text-[11px] text-slate-400 italic">#{item.CodArt}</td>
                                    <td className="py-5">
                                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{item.LibArt}</p>
                                        <p className="text-[11px] text-slate-500 leading-relaxed max-w-lg">{item.ExLibArt || '-'}</p>
                                    </td>
                                    <td className="py-5 text-sm font-medium text-slate-600 text-right tabular-nums">
                                        {formatCurrency(item.PuHT || 0).replace(' TND', '')}
                                    </td>
                                    <td className="py-5 text-sm font-bold text-slate-800 text-center tabular-nums">
                                        {item.Qt}
                                    </td>
                                    <td className="py-5 text-sm font-bold text-slate-900 text-right tabular-nums">
                                        {formatCurrency((item.Qt * (item.PuHT || 0))).replace(' TND', '')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!bcv.details || bcv.details.length === 0) && (
                        <div className="py-12 text-center text-slate-300 italic text-sm">
                            Aucun article présent.
                        </div>
                    )}
                </div>

                {/* Financial Summary */}
                <div className="flex justify-end pt-8">
                    <div className="w-80 space-y-3">
                        <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                            <span className="font-semibold text-slate-400 uppercase tracking-widest">Total Hors Taxe</span>
                            <span className="font-bold text-slate-700 tabular-nums">
                                {formatCurrency(bcv.TotHT || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50">
                            <span className="font-semibold text-slate-400 uppercase tracking-widest">TVA</span>
                            <span className="font-bold text-slate-700 tabular-nums">
                                {formatCurrency(bcv.TotTva || 0)}
                            </span>
                        </div>
                        {bcv.TotRem > 0 && (
                            <div className="flex justify-between items-center text-xs py-1 border-b border-slate-50 text-rose-600">
                                <span className="font-semibold uppercase tracking-widest">Remise</span>
                                <span className="font-bold tabular-nums">
                                    -{formatCurrency(bcv.TotRem || 0)}
                                </span>
                            </div>
                        )}
                        <div className="pt-6 mt-4 border-t-2 border-slate-100">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-bold text-slate-900 uppercase tracking-widest">Total Net TTC</span>
                                <div className="text-right">
                                    <span className="text-4xl font-black text-blue-600 tabular-nums">
                                        {formatCurrency(bcv.TotTTC || 0).replace(' TND', '')}
                                    </span>
                                    <span className="text-xs font-bold text-slate-400 ml-2">TND</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Delivery details footer (Minimal) */}
                <div className="mt-20 pt-10 border-t border-slate-50 grid grid-cols-3 gap-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Magasin</p>
                        <p className="text-xs font-semibold text-slate-700">{bcv.DesMag || bcv.CodMag || 'Magasin Général'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Représentant</p>
                        <p className="text-xs font-semibold text-slate-700">{bcv.DesRepres || bcv.CodRepres || '—'}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Transport</p>
                        <p className="text-xs font-semibold text-slate-700">{bcv.DesChauff || 'Non assigné'}</p>
                    </div>
                </div>

                <div className="mt-20 border-t border-slate-50 italic text-[10px] text-slate-400 text-center uppercase tracking-widest">
                    NexusCRM Suite — Document Officiel
                </div>
            </div>
        </div>
    );
};

export default BcvDetail;
