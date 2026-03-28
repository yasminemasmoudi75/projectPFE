import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    TruckIcon,
    UserIcon,
    BuildingStorefrontIcon,
    DocumentTextIcon,
    MapPinIcon,
} from '@heroicons/react/24/outline';
import { fetchBlvById, clearCurrentBlv } from './blvSlice';
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

const BlvDetail = () => {
    const { id } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentBlv: blv, loading } = useSelector((s) => s.blv);

    useEffect(() => {
        if (id) dispatch(fetchBlvById(id));
        return () => dispatch(clearCurrentBlv());
    }, [dispatch, id]);

    if (loading) return <LoadingSpinner />;
    if (!blv) return (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                <TruckIcon className="h-8 w-8" />
            </div>
            <p className="text-slate-500 font-medium">Bon de livraison introuvable.</p>
            <button onClick={() => navigate('/blv')} className="btn-soft-primary">
                <ArrowLeftIcon className="h-4 w-4" /> Retour à la liste
            </button>
        </div>
    );

    const details = blv.details || [];

    return (
        <div className="animate-fade-in space-y-8 pb-12">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/blv')} className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft">
                        <ArrowLeftIcon className="h-5 w-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-primary">
                                <TruckIcon className="h-3 w-3 mr-1" />
                                Bon de Livraison
                            </span>
                            <span className={clsx('inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider', blv.Valid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{blv.Valid ? '✓ Validé' : '⏳ En cours'}</span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight font-mono">BL {blv.Prfx || ''}{blv.Nf}</h1>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">Créé le {formatDate(blv.DatUser)}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card-luxury p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="icon-shape-sm bg-gradient-blue shadow-glow-blue"><UserIcon className="h-4 w-4 text-white" /></div>
                        <h3 className="text-sm font-bold text-slate-700">Client</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Raison sociale" value={blv.LibTiers} />
                        <InfoRow label="Code tiers" value={blv.CodTiers} />
                        <InfoRow label="Adresse" value={blv.Adresse} />
                    </div>
                </div>
                <div className="card-luxury p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="icon-shape-sm bg-gradient-success shadow-glow-emerald"><BuildingStorefrontIcon className="h-4 w-4 text-white" /></div>
                        <h3 className="text-sm font-bold text-slate-700">Commercial</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <InfoRow label="Magasin" value={blv.CodMag} />
                        <InfoRow label="Représentant" value={blv.CodRepres} />
                    </div>
                </div>
            </div>

            <div className="card-luxury p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-100/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                <th className="px-5 py-3">Code Art.</th>
                                <th className="px-5 py-3">Désignation</th>
                                <th className="px-5 py-3 text-right">Qté</th>
                                <th className="px-5 py-3 text-right">PU HT</th>
                                <th className="px-5 py-3 text-right">Total HT</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/50">
                            {details.map((d, i) => (
                                <tr key={i} className="hover:bg-blue-50/20 transition-all">
                                    <td className="px-5 py-4 text-xs font-bold text-blue-600 font-mono">{d.CodArt}</td>
                                    <td className="px-5 py-4 text-sm font-semibold text-slate-800">{d.LibArt}</td>
                                    <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">{d.Qt}</td>
                                    <td className="px-5 py-4 text-sm text-slate-700 text-right">{formatCurrency(d.PuHT)}</td>
                                    <td className="px-5 py-4 text-sm font-extrabold text-blue-700 text-right">{formatCurrency(d.MntHT)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-blue-50/30 font-extrabold text-slate-800 border-t-2 border-blue-100">
                                <td colSpan="4" className="px-5 py-3 text-right">TOTAL TTC</td>
                                <td className="px-5 py-3 text-right text-blue-700">{formatCurrency(blv.TotTTC)}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BlvDetail;
