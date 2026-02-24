import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    ShoppingCartIcon,
    CheckBadgeIcon,
    ClockIcon,
    MapPinIcon,
    UserIcon,
    BuildingStorefrontIcon,
    TruckIcon,
    DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { fetchBcvById, clearCurrentBcv } from './bcvSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatDate, formatCurrency } from '../../utils/format';
import clsx from 'clsx';

const InfoRow = ({ label, value }) =>
    value ? (
        <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
            <span className="text-sm font-semibold text-slate-700">{value}</span>
        </div>
    ) : null;

const BcvDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBcv: bcv, loading } = useSelector((s) => s.bcv);

    useEffect(() => {
        if (id) dispatch(fetchBcvById(id));
        return () => dispatch(clearCurrentBcv());
    }, [dispatch, id]);

    if (loading) return <LoadingSpinner />;
    if (!bcv) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <ShoppingCartIcon className="h-8 w-8" />
            </div>
            <p className="text-slate-500 font-medium">Bon de commande introuvable.</p>
            <button onClick={() => navigate('/bcv')} className="btn-soft-primary">
                <ArrowLeftIcon className="h-4 w-4" /> Retour à la liste
            </button>
        </div>
    );

    const details = bcv.details || [];

    return (
        <div className="animate-fade-in space-y-8 pb-12">

            {/* ─── Header ─── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/bcv')}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft"
                    >
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-primary">
                                <ShoppingCartIcon className="h-3 w-3 mr-1" />
                                Bon de Commande
                            </span>
                            <span className={clsx(
                                'inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider',
                                bcv.Valid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            )}>
                                {bcv.Valid ? '✓ Validé' : '⏳ En cours'}
                            </span>
                            {bcv.bLivr && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
                                    🚚 Livré
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">
                            BC {bcv.Prfx || ''}{bcv.Nf}
                        </h1>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                            Créé le {formatDate(bcv.DatUser)} · {bcv.UserCreate || bcv.CUser || 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Infos principales ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Client */}
                <div className="card-luxury p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="icon-shape-sm bg-gradient-blue shadow-glow-blue">
                            <UserIcon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">Client</h3>
                    </div>
                    <div className="space-y-3">
                        <InfoRow label="Raison sociale" value={bcv.LibTiers} />
                        <InfoRow label="Code tiers" value={bcv.CodTiers} />
                        <InfoRow label="Adresse" value={bcv.Adresse} />
                        <InfoRow label="Ville" value={bcv.Ville} />
                        <InfoRow label="CIN" value={bcv.Cin} />
                    </div>
                </div>

                {/* Livraison */}
                <div className="card-luxury p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="icon-shape-sm bg-gradient-success shadow-glow-emerald">
                            <TruckIcon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">Livraison</h3>
                    </div>
                    <div className="space-y-3">
                        <InfoRow label="Adresse livraison" value={bcv.AdresseA} />
                        <InfoRow label="Ville livraison" value={bcv.VilleA} />
                        <InfoRow label="Date livraison" value={formatDate(bcv.DatLiv)} />
                        <InfoRow label="Chauffeur" value={bcv.DesChauff || bcv.CodChauff} />
                        <InfoRow label="Délai livraison" value={bcv.DiffLiv ? `${bcv.DiffLiv} j` : null} />
                    </div>
                </div>

                {/* Commercial */}
                <div className="card-luxury p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="icon-shape-sm bg-gradient-blue-cyan shadow-glow-blue">
                            <BuildingStorefrontIcon className="h-4 w-4 text-white" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-700">Informations commerciales</h3>
                    </div>
                    <div className="space-y-3">
                        <InfoRow label="Magasin" value={bcv.DesMag || bcv.CodMag} />
                        <InfoRow label="Représentant" value={bcv.DesRepres || bcv.CodRepres} />
                        <InfoRow label="Catégorie" value={bcv.categ} />
                        <InfoRow label="Type" value={bcv.type} />
                        <InfoRow label="Remarque" value={bcv.Remarq} />
                    </div>
                </div>
            </div>

            {/* ─── Récapitulatif financier ─── */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent">
                    <h3 className="text-sm font-bold text-slate-800">Récapitulatif financier</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 divide-x divide-y divide-slate-100 md:divide-y-0">
                    {[
                        { label: 'Total HT', value: formatCurrency(bcv.TotHT) },
                        { label: 'Remise', value: formatCurrency(bcv.TotRem) },
                        { label: 'Net HT', value: formatCurrency(bcv.NetHT) },
                        { label: 'TVA', value: formatCurrency(bcv.TotTva) },
                        { label: 'Fodec', value: formatCurrency(bcv.TotFodec) },
                        { label: 'Total TTC', value: formatCurrency(bcv.TotTTC), highlight: true },
                    ].map((f) => (
                        <div key={f.label} className={clsx('p-5 text-center', f.highlight && 'bg-blue-50/50')}>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                            <p className={clsx('text-base font-extrabold', f.highlight ? 'text-blue-700' : 'text-slate-800')}>
                                {f.value}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ─── Lignes de détail ─── */}
            <div className="card-luxury p-0 overflow-hidden">
                <div className="px-8 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-blue-500" />
                        <h3 className="text-sm font-bold text-slate-800">Lignes de commande</h3>
                    </div>
                    <span className="text-xs font-medium text-slate-500">{details.length} article{details.length !== 1 ? 's' : ''}</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 text-left border-b border-slate-100/50">
                                {['#', 'Code Art.', 'Désignation', 'Qté', 'PU HT', 'PU TTC', 'Remise', 'Mnt HT', 'TVA', 'Fodec', 'Total TTC'].map((h) => (
                                    <th key={h} className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {details.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-8 py-16 text-center text-slate-400 font-medium">
                                        Aucune ligne de commande
                                    </td>
                                </tr>
                            ) : (
                                details.map((d, i) => {
                                    const mntTTC = (d.MntHT || 0) + (d.MntTVA || 0) + (d.MntFodec || 0) - (d.MntRem || 0);
                                    return (
                                        <tr key={d.NoDetail ?? i} className="hover:bg-blue-50/20 transition-all">
                                            <td className="px-5 py-4 text-xs font-bold text-slate-400">{i + 1}</td>
                                            <td className="px-5 py-4">
                                                <span className="text-xs font-bold text-blue-600 font-mono">{d.CodArt || '—'}</span>
                                            </td>
                                            <td className="px-5 py-4 max-w-[240px]">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{d.LibArt || '—'}</p>
                                                {d.ExLibArt && (
                                                    <p className="text-[10px] text-slate-400 truncate">{d.ExLibArt}</p>
                                                )}
                                                {(d.DesColor || d.Taille) && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                                        {[d.DesColor, d.Taille].filter(Boolean).join(' · ')}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">{d.Qt ?? 0}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700 text-right">{formatCurrency(d.PuHT)}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700 text-right">{formatCurrency(d.PuTTC)}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700 text-right">{formatCurrency(d.MntRem)}</td>
                                            <td className="px-5 py-4 text-sm font-semibold text-slate-800 text-right">{formatCurrency(d.MntHT)}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700 text-right">{formatCurrency(d.MntTVA)}</td>
                                            <td className="px-5 py-4 text-sm text-slate-700 text-right">{formatCurrency(d.MntFodec)}</td>
                                            <td className="px-5 py-4 text-sm font-extrabold text-blue-700 text-right">{formatCurrency(mntTTC)}</td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                        {details.length > 0 && (
                            <tfoot>
                                <tr className="bg-blue-50/30 border-t-2 border-blue-100">
                                    <td colSpan="7" className="px-5 py-3 text-xs font-bold text-slate-500 uppercase">
                                        Total
                                    </td>
                                    <td className="px-5 py-3 text-sm font-extrabold text-slate-800 text-right">
                                        {formatCurrency(bcv.TotHT)}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-extrabold text-slate-800 text-right">
                                        {formatCurrency(bcv.TotTva)}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-extrabold text-slate-800 text-right">
                                        {formatCurrency(bcv.TotFodec)}
                                    </td>
                                    <td className="px-5 py-3 text-sm font-extrabold text-blue-700 text-right">
                                        {formatCurrency(bcv.TotTTC)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BcvDetail;
