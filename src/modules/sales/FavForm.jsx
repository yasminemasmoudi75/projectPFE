import { useState, useEffect, useCallback } from 'react';
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeftIcon,
    CheckIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    MapPinIcon,
    IdentificationIcon,
    BuildingOfficeIcon,
    ArrowPathIcon,
    TagIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    DocumentTextIcon,
    CurrencyDollarIcon,
    PhoneIcon,
    UserIcon,
    ShoppingCartIcon,
    ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { updateFav, createFav, fetchFavById, clearCurrentFav } from './favSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axiosInstance from '../../app/axios';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getProductName = (p = {}) => p.LibArt || p.Libelle || '';
const getProductLabel = (p = {}) => [p.CodArt, getProductName(p)].filter(Boolean).join(' – ');

const NON_NEG_MASTER = new Set([
    'TotHT', 'TotTva', 'TotFodec', 'TotRem', 'TotTTC', 'Frais', 'MntTotDev',
    'Timbre', 'Cours', 'avanceforf', 'MntDebit', 'MntCredit', 'Rest', 'MntAv', 'CodCateg',
]);
const NON_NEG_DETAIL = new Set([
    'Qt', 'PuHT', 'PuTTC', 'PvPub', 'PuDev', 'Tva', 'MntRem', 'MntTVA', 'MntHT', 'MntFodec', 'MntFrais',
]);

const toPos = (v, fb = 0) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? Math.max(0, n) : fb;
};

const fmt3 = (n) =>
    Number(n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const serializeDate = (v) => {
    if (!v || v === '' || v === 'null') return null;
    try {
        const d = v instanceof Date ? v : new Date(v);
        if (!isNaN(d.getTime())) return d.toISOString();
    } catch (_) { }
    return null;
};

const blankItem = () => ({
    tempId: Date.now() + Math.random(),
    CodArt: '', LibArt: '', ExLibArt: '', Qt: 1, PuHT: 0, PuTTC: 0,
    Tva: 19, MntRem: 0, MntTVA: 0, MntHT: 0, MntFodec: 0, PvPub: 0,
    CodColor: '', DesColor: '', CodTaille: '', Taille: '', PuDev: 0,
    MntFrais: 0, NumBL: '', DateBL: null, Codabar: '', NumImport: '',
    DatImport: null, productSearch: '', Remise: 0, Observation: '',
});

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Client', icon: UserGroupIcon },
    { id: 2, label: 'Articles', icon: ShoppingCartIcon },
    { id: 3, label: 'Validation', icon: ClipboardDocumentCheckIcon },
];

const StepBar = ({ current }) => (
    <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => {
            const done = s.id < current;
            const active = s.id === current;
            const Icon = s.icon;
            return (
                <React.Fragment key={s.id}>
                    <div className="flex flex-col items-center gap-1.5">
                        <div className={`
                            h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300
                            ${done ? 'bg-blue-600 shadow-lg shadow-blue-500/30' : ''}
                            ${active ? 'bg-white border-2 border-blue-600 shadow-lg shadow-blue-500/20' : ''}
                            ${!done && !active ? 'bg-slate-100 border border-slate-200' : ''}
                        `}>
                            {done
                                ? <CheckIcon className="h-4 w-4 text-white stroke-[3]" />
                                : <Icon className={`h-4 w-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-colors
                            ${active ? 'text-blue-600' : done ? 'text-slate-500' : 'text-slate-300'}`}>
                            {s.label}
                        </span>
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={`h-px flex-1 mx-3 mb-5 transition-all duration-500
                            ${done ? 'bg-blue-500' : 'bg-slate-200'}`} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Field wrapper ────────────────────────────────────────────────────────────

const Field = ({ label, icon: Icon, children, span2 = false, required = false }) => (
    <div className={`flex flex-col gap-1.5 ${span2 ? 'md:col-span-2' : ''}`}>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            {label}{required && <span className="text-blue-500">*</span>}
        </label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon className="h-3.5 w-3.5 text-slate-300" />
                </div>
            )}
            {React.cloneElement(children, {
                className: `${children.props.className || ''} ${Icon ? 'pl-9' : ''} w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all placeholder-slate-300`
            })}
        </div>
    </div>
);

const ReadonlyField = ({ label, icon: Icon, value, span2 = false }) => (
    <div className={`flex flex-col gap-1.5 ${span2 ? 'md:col-span-2' : ''}`}>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="relative">
            {Icon && (
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Icon className="h-3.5 w-3.5 text-slate-300" />
                </div>
            )}
            <div className={`${Icon ? 'pl-9' : 'px-3.5'} py-2.5 text-sm bg-slate-50/50 border border-slate-100 rounded-xl text-slate-500 min-h-[42px] flex items-center`}>
                {value || <span className="text-slate-300 italic text-xs">—</span>}
            </div>
        </div>
    </div>
);

// ─── Card section ─────────────────────────────────────────────────────────────

const SectionCard = ({ title, subtitle, icon: Icon, iconColor = 'blue', badge, children }) => {
    const colorMap = {
        blue: 'bg-blue-600 shadow-blue-500/25',
        amber: 'bg-amber-500 shadow-amber-500/25',
        green: 'bg-emerald-600 shadow-emerald-500/25',
        violet: 'bg-violet-600 shadow-violet-500/25',
    };
    return (
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
                <div className="flex items-center gap-3.5">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shadow-lg ${colorMap[iconColor]}`}>
                        <Icon className="h-4.5 w-4.5 text-white h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
                        {subtitle && <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                {badge}
            </div>
            <div className="p-6">{children}</div>
        </div>
    );
};

// ─── Item row ─────────────────────────────────────────────────────────────────

const ItemRow = ({ item, index, productOptions, loadingProducts, activeRowId, onSearchChange, onProductSelect, onItemChange, onRemove, onFocus }) => {
    const [expanded, setExpanded] = useState(false);
    const lineTotal = toPos(item.Qt) * toPos(item.PuHT);

    return (
        <div className="border-b border-slate-100 last:border-0 hover:bg-slate-50/40 transition-colors">
            {/* Main row */}
            <div className="px-4 py-3.5 flex flex-wrap lg:flex-nowrap items-center gap-3">
                {/* Index */}
                <span className="text-[10px] font-bold text-slate-300 w-5 text-center flex-shrink-0">{index + 1}</span>

                {/* Product search + select */}
                <div className="flex-1 min-w-0 flex gap-2">
                    <input
                        type="text"
                        value={item.productSearch ?? (item.LibArt ? getProductLabel(item) : '')}
                        placeholder="Rechercher un produit..."
                        onFocus={() => onFocus(item.tempId)}
                        onChange={(e) => onSearchChange(item.tempId, e.target.value)}
                        className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                    />
                    <select
                        value={item.IDArt || ''}
                        onChange={(e) => onProductSelect(item.tempId, e.target.value)}
                        className="w-44 bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs text-slate-600 focus:outline-none focus:border-blue-400"
                    >
                        <option value="">
                            {loadingProducts && activeRowId === item.tempId ? 'Chargement…' : '— Choisir —'}
                        </option>
                        {item.IDArt && (
                            <option value={item.IDArt}>{item.CodArt} – {item.LibArt}</option>
                        )}
                        {productOptions.map((p) => (
                            <option key={p.IDArt} value={p.IDArt}>{p.CodArt} – {getProductName(p)}</option>
                        ))}
                    </select>
                </div>

                {/* Qty */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Qté</span>
                    <input
                        type="number" min="0" step="1"
                        value={item.Qt}
                        onChange={(e) => onItemChange(item.tempId, 'Qt', parseFloat(e.target.value) || 0)}
                        className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-xs font-bold text-blue-600 focus:outline-none focus:border-blue-400 bg-white"
                    />
                </div>

                {/* PuHT */}
                <div className="flex flex-col items-center gap-1">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">P.U HT</span>
                    <input
                        type="number" min="0" step="0.001"
                        value={item.PuHT}
                        onChange={(e) => onItemChange(item.tempId, 'PuHT', parseFloat(e.target.value) || 0)}
                        className="w-24 text-right border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-400 bg-white"
                    />
                </div>

                {/* Line total */}
                <div className="flex flex-col items-end gap-1 min-w-[90px]">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total HT</span>
                    <span className="text-sm font-bold text-slate-800 tabular-nums">{fmt3(lineTotal)}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-all
                            ${expanded ? 'bg-blue-50 border-blue-200 text-blue-600' : 'border-slate-200 text-slate-400 hover:bg-slate-100'}`}
                    >
                        {expanded ? <ChevronUpIcon className="h-3.5 w-3.5" /> : <ChevronDownIcon className="h-3.5 w-3.5" />}
                    </button>
                    <button
                        type="button"
                        onClick={() => onRemove(item.tempId)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-300 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 transition-all"
                    >
                        <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Expanded details */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/60 border-t border-slate-100">
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TVA (%)</label>
                                <input
                                    type="number" min="0"
                                    value={item.Tva ?? 19}
                                    onChange={(e) => onItemChange(item.tempId, 'Tva', parseFloat(e.target.value) || 0)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Remise (%)</label>
                                <input
                                    type="number" min="0" max="100"
                                    value={item.Remise ?? 0}
                                    onChange={(e) => onItemChange(item.tempId, 'Remise', parseFloat(e.target.value) || 0)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex flex-col gap-1 md:col-span-2">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Observation</label>
                                <input
                                    type="text" maxLength="255"
                                    value={item.Observation ?? ''}
                                    onChange={(e) => onItemChange(item.tempId, 'Observation', e.target.value)}
                                    placeholder="Note interne sur cet article…"
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">P.U TTC</label>
                                <input
                                    type="number" min="0"
                                    value={item.PuTTC ?? 0}
                                    onChange={(e) => onItemChange(item.tempId, 'PuTTC', parseFloat(e.target.value) || 0)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FODEC</label>
                                <input
                                    type="number" min="0"
                                    value={item.MntFodec ?? 0}
                                    onChange={(e) => onItemChange(item.tempId, 'MntFodec', parseFloat(e.target.value) || 0)}
                                    className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-400"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ─── Totals bar ───────────────────────────────────────────────────────────────

const TotalsBar = ({ items, totRem }) => {
    const ht = items.reduce((s, i) => s + toPos(i.Qt) * toPos(i.PuHT), 0);
    const tva = items.reduce((s, i) => s + toPos(i.Qt) * toPos(i.PuHT) * (toPos(i.Tva) / 100), 0);
    const rem = toPos(totRem);
    const ttc = ht + tva - rem;

    return (
        <div className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-t border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {items.length} article{items.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total HT</p>
                    <p className="text-sm font-bold text-slate-600 tabular-nums">{fmt3(ht)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TVA</p>
                    <p className="text-sm font-bold text-slate-600 tabular-nums">{fmt3(tva)}</p>
                </div>
                {rem > 0 && (
                    <div className="text-right">
                        <p className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Remise</p>
                        <p className="text-sm font-bold text-rose-500 tabular-nums">−{fmt3(rem)}</p>
                    </div>
                )}
                <div className="text-right pl-4 border-l border-slate-200">
                    <p className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">Net TTC</p>
                    <p className="text-xl font-bold text-blue-600 tabular-nums">{fmt3(ttc)}</p>
                </div>
            </div>
        </div>
    );
};

// ─── Summary step ─────────────────────────────────────────────────────────────

const SummaryStep = ({ formData, items, saving, onBack, onSubmit, isEdit }) => {
    const ht = items.reduce((s, i) => s + toPos(i.Qt) * toPos(i.PuHT), 0);
    const tva = items.reduce((s, i) => s + toPos(i.Qt) * toPos(i.PuHT) * (toPos(i.Tva) / 100), 0);
    const ttc = ht + tva - toPos(formData.TotRem);

    const rows = [
        { label: 'Articles', value: `${items.length} ligne${items.length !== 1 ? 's' : ''}`, muted: true },
        { label: 'Total hors taxe', value: `${fmt3(ht)} TND` },
        { label: 'TVA totale', value: `${fmt3(tva)} TND` },
        ...(formData.TotRem > 0 ? [{ label: 'Remise globale', value: `−${fmt3(formData.TotRem)} TND`, danger: true }] : []),
    ];

    return (
        <motion.div
            key="step3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="max-w-lg mx-auto"
        >
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-center">
                    <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ClipboardDocumentCheckIcon className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="text-white font-bold text-lg">Résumé de la facture</h2>
                    <p className="text-blue-200 text-xs mt-1">Vérifiez avant de confirmer</p>
                </div>

                <div className="p-8 space-y-6">
                    {/* Client summary */}
                    {formData.CodTiers && (
                        <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                {(formData.LibTiers || '?').charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-sm text-blue-900 truncate">{formData.LibTiers}</p>
                                <p className="text-xs text-blue-600 font-mono">#{formData.CodTiers} · {formData.Ville || '—'}</p>
                            </div>
                        </div>
                    )}

                    {/* Line items */}
                    <div className="space-y-0 divide-y divide-slate-100">
                        {rows.map((r, i) => (
                            <div key={i} className="flex justify-between items-center py-3">
                                <span className={`text-sm ${r.muted ? 'text-slate-400' : 'text-slate-600'}`}>{r.label}</span>
                                <span className={`text-sm font-bold ${r.danger ? 'text-rose-500' : r.muted ? 'text-slate-500' : 'text-slate-800'} tabular-nums`}>
                                    {r.value}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="flex justify-between items-center pt-4 border-t-2 border-slate-100">
                        <span className="text-base font-bold text-slate-900 uppercase tracking-tight">NET À PAYER</span>
                        <span className="text-2xl font-bold text-blue-600 tabular-nums">{fmt3(ttc)} <span className="text-sm">TND</span></span>
                    </div>

                    {/* Items preview */}
                    {items.length > 0 && (
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 max-h-40 overflow-y-auto">
                            {items.map((item, i) => (
                                <div key={item.tempId} className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500 truncate flex-1 mr-2">
                                        <span className="text-slate-300 mr-1">{i + 1}.</span>
                                        {item.LibArt || <span className="italic text-slate-300">Sans désignation</span>}
                                    </span>
                                    <span className="font-mono text-slate-700 flex-shrink-0">
                                        {item.Qt} × {fmt3(item.PuHT)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                        )}
                        {saving ? 'Enregistrement…' : (isEdit ? 'Mettre à jour la facture' : 'Confirmer la facture')}
                    </button>

                    <button
                        type="button"
                        onClick={onBack}
                        className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1 font-medium"
                    >
                        ← Retour aux articles
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

const FavForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentFav, loading: loadingSlice } = useSelector((s) => s.fav);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Products
    const [productOptions, setProductOptions] = useState([]);
    const [productLookup, setProductLookup] = useState({});
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [activeProductRowId, setActiveProductRowId] = useState(null);

    // Clients
    const [clients, setClients] = useState([]);
    const [loadingClients, setLoadingClients] = useState(true);
    const [clientCin, setClientCin] = useState('');

    // Form master
    const [formData, setFormData] = useState({
        Prfx: 'FA', Sufx: '', Nf: '',
        CodTiers: '', LibTiers: '', IDContact: '',
        Adresse: '', Ville: '', LibTiersA: '', AdresseA: '', VilleA: '',
        Cin: '', CinA: '', AssujTiers: '',
        TotHT: 0, TotTva: 0, TotFodec: 0, TotRem: 0, TotTTC: 0,
        Frais: 0, MntTotDev: 0, Timbre: 0,
        NatReg: '', NbrLett: '', NImpA: '', NImpB: '', DatImp: null,
        Devise: 'TND', CodDev: '', Cours: 1,
        CodRepres: '', DesRepres: '', CodMag: '', DesMag: '',
        Remarq: '',
        DatUser: null, DatCreateUser: null, MDate: null, DatLiv: null,
        Valid: false, bTransf: false, bLivr: false,
        categ: '', type: '', Classe: '', Fonction: '', Categorie: '',
        Domaine: '', Responsable: '', Tel: '',
        avanceforf: 0, SourceBcvGuid: '', SourceBcvNf: '', SourceBcvPrfx: '',
        IsConverted: false, MntDebit: 0, MntCredit: 0, Rest: 0, NFav: '', MntAv: 0, CodCateg: 0,
    });

    // Items
    const [items, setItems] = useState([blankItem()]);

    // ── Product search debounce ─────────────────────────────────────────────
    const activeSearch = items.find((i) => i.tempId === activeProductRowId)?.productSearch?.trim() || '';

    useEffect(() => {
        if (!activeProductRowId || activeSearch.length < 2) {
            if (activeSearch.length < 2) { setProductOptions([]); setLoadingProducts(false); }
            return;
        }
        const t = setTimeout(async () => {
            setLoadingProducts(true);
            try {
                const res = await axiosInstance.get('/products', { params: { search: activeSearch, limit: 50 } });
                const list = (Array.isArray(res?.data) ? res.data : res?.data?.data || []).map((p) => ({ ...p, LibArt: p.LibArt || p.Libelle || '' }));
                setProductOptions(list);
                setProductLookup((prev) => {
                    const next = { ...prev };
                    list.forEach((p) => { next[String(p.IDArt)] = p; });
                    return next;
                });
            } catch (err) {
                toast.error('Erreur recherche produits');
                setProductOptions([]);
            } finally { setLoadingProducts(false); }
        }, 350);
        return () => clearTimeout(t);
    }, [activeProductRowId, activeSearch]);

    // ── Initial load ────────────────────────────────────────────────────────
    useEffect(() => {
        axiosInstance.get('/products', { params: { limit: 100 } }).then((res) => {
            const list = (Array.isArray(res?.data) ? res.data : res?.data?.data || []).map((p) => ({ ...p, LibArt: p.LibArt || p.Libelle || '' }));
            setProductOptions(list);
            setProductLookup(Object.fromEntries(list.map((p) => [String(p.IDArt), p])));
        }).catch(() => { });
    }, []);

    useEffect(() => {
        axiosInstance.get('/tiers').then((res) => {
            const list = Array.isArray(res?.data) ? res.data : res?.data?.data || [];
            setClients(list);
        }).catch(() => toast.error('Erreur chargement clients')).finally(() => setLoadingClients(false));
    }, []);

    useEffect(() => {
        if (isEdit && id) dispatch(fetchFavById(id));
        else { dispatch(clearCurrentFav()); setLoading(false); }
    }, [id, isEdit, dispatch]);

    useEffect(() => {
        if (isEdit && currentFav) {
            const { details, ...master } = currentFav;
            setFormData({ ...master, TotRem: master.TotRem || 0, Valid: master.Valid || false, bTransf: master.bTransf || false, IsConverted: master.IsConverted || false });
            if (details?.length) setItems(details.map((d) => ({ ...d, tempId: d.NoDetail || Math.random() })));
            setLoading(false);
        }
    }, [currentFav, isEdit]);

    // ── Totals recalc ───────────────────────────────────────────────────────
    useEffect(() => {
        const ht = items.reduce((s, i) => s + toPos(i.Qt) * toPos(i.PuHT), 0);
        const tva = items.reduce((s, i) => s + toPos(i.Qt) * toPos(i.PuHT) * (toPos(i.Tva) / 100), 0);
        const rem = toPos(formData.TotRem);
        setFormData((p) => ({ ...p, TotHT: ht, TotTva: tva, TotTTC: ht + tva - rem }));
    }, [items, formData.TotRem]);

    // ── Handlers ────────────────────────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (NON_NEG_MASTER.has(name)) {
            setFormData((p) => ({ ...p, [name]: value === '' ? '' : String(toPos(value)) }));
        } else {
            setFormData((p) => ({ ...p, [name]: value }));
        }
    };

    const handleClientSelect = (code) => {
        const c = clients.find((x) => x.CodTiers === code);
        if (!c) return;
        setFormData((p) => ({
            ...p,
            CodTiers: c.CodTiers, LibTiers: c.Raisoc || '',
            Adresse: c.Adresse || '', Ville: c.Ville || '',
            Classe: c.Classe || '', Fonction: c.Fonction || '',
            Categorie: c.Categorie || '', Domaine: c.Domaine || '',
            Responsable: c.Responsable || '', Tel: c.Tel || c.Gsm || '',
            CodRepres: c.CodRepres || '', DesRepres: c.DesRepres || '',
        }));
        setClientCin(c.Cin || '');
    };

    const addItem = () => setItems((p) => [...p, blankItem()]);
    const removeItem = (tempId) => { if (items.length > 1) setItems((p) => p.filter((i) => i.tempId !== tempId)); };

    const handleItemChange = (tempId, field, value) => {
        const v = NON_NEG_DETAIL.has(field) ? toPos(value) : value;
        setItems((p) => p.map((i) => i.tempId === tempId ? { ...i, [field]: v } : i));
    };

    const handleProductSearchChange = (tempId, value) => {
        setActiveProductRowId(tempId);
        setItems((p) => p.map((i) => i.tempId === tempId ? { ...i, productSearch: value } : i));
    };

    const handleProductSelect = (tempId, productId) => {
        const prod = productLookup[String(productId)] || productOptions.find((p) => String(p.IDArt) === String(productId));
        if (!prod) return;
        setItems((p) => p.map((i) => i.tempId === tempId ? {
            ...i,
            IDArt: prod.IDArt, CodArt: prod.CodArt,
            LibArt: getProductName(prod),
            productSearch: getProductLabel(prod),
            PuHT: toPos(prod.PrixVente),
            Tva: toPos(prod.Tva, 19),
        } : i));
        setActiveProductRowId(null);
        setProductOptions([]);
    };

    // ── Submit ──────────────────────────────────────────────────────────────
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        const payload = {
            master: {
                ...formData,
                TotHT: toPos(formData.TotHT), TotTva: toPos(formData.TotTva),
                TotFodec: toPos(formData.TotFodec), TotRem: toPos(formData.TotRem),
                TotTTC: toPos(formData.TotTTC), Frais: toPos(formData.Frais),
                MntTotDev: toPos(formData.MntTotDev), Timbre: toPos(formData.Timbre),
                Cours: toPos(formData.Cours, 1), avanceforf: toPos(formData.avanceforf),
                MntDebit: toPos(formData.MntDebit), MntCredit: toPos(formData.MntCredit),
                Rest: toPos(formData.Rest), MntAv: toPos(formData.MntAv),
                CodCateg: Math.trunc(toPos(formData.CodCateg)),
                Nf: parseInt(formData.Nf) || null,
                DatUser: serializeDate(formData.DatUser),
                MDate: serializeDate(formData.MDate),
                DatLiv: serializeDate(formData.DatLiv),
                DatCreateUser: serializeDate(formData.DatCreateUser),
                DatImp: serializeDate(formData.DatImp),
                Valid: !!formData.Valid, bTransf: !!formData.bTransf,
                bLivr: !!formData.bLivr, IsConverted: !!formData.IsConverted,
            },
            details: items.map(({ tempId, productSearch, ...rest }) => ({
                CodArt: rest.CodArt || '', LibArt: rest.LibArt || '',
                ExLibArt: rest.ExLibArt || '', IDArt: rest.IDArt || null,
                Qt: toPos(rest.Qt), PuHT: toPos(rest.PuHT), PuTTC: toPos(rest.PuTTC),
                PvPub: toPos(rest.PvPub), PuDev: toPos(rest.PuDev),
                Tva: toPos(rest.Tva, 19), MntRem: toPos(rest.MntRem),
                MntTVA: toPos(rest.MntTVA), MntHT: toPos(rest.MntHT),
                MntFodec: toPos(rest.MntFodec), MntFrais: toPos(rest.MntFrais),
                CodColor: rest.CodColor || '', DesColor: rest.DesColor || '',
                CodTaille: rest.CodTaille || '', Taille: rest.Taille || '',
                NumBL: rest.NumBL || '', DateBL: serializeDate(rest.DateBL),
                Codabar: rest.Codabar || '', NumImport: rest.NumImport || '',
                DatImport: serializeDate(rest.DatImport),
            })),
        };

        try {
            if (isEdit) {
                await dispatch(updateFav({ id, payload })).unwrap();
                toast.success('Facture mise à jour avec succès');
            } else {
                await dispatch(createFav(payload)).unwrap();
                toast.success('Facture créée avec succès');
            }
            navigate('/fav');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Une erreur est survenue';
            toast.error(msg);
        } finally {
            setSaving(false);
        }
    };

    if (loading || loadingSlice) return <LoadingSpinner />;

    // ── Render ──────────────────────────────────────────────────────────────
    return (
        <div className="animate-fade-in pb-24">
            {/* Page header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/fav')}
                        className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-sm flex items-center justify-center"
                    >
                        <ArrowLeftIcon className="h-4 w-4 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                                <CurrencyDollarIcon className="h-3 w-3" /> Facturation & Ventes
                            </span>
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">
                            {isEdit ? `Modification — Facture N°${formData.Nf}` : 'Nouvelle facture de vente'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="h-10 w-10 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 rounded-xl transition-all shadow-sm flex items-center justify-center"
                    >
                        <ArrowPathIcon className="h-4 w-4" />
                    </button>
                    {currentStep < 3 && (
                        <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all"
                        >
                            <CheckIcon className="h-4 w-4 stroke-[2.5]" />
                            {isEdit ? 'Mettre à jour' : 'Finaliser'}
                        </button>
                    )}
                </div>
            </div>

            {/* Form */}
            <form id="fav-form" onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <StepBar current={currentStep} />

                <AnimatePresence mode="wait">
                    {/* ── STEP 1 : CLIENT ── */}
                    {currentStep === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-5"
                        >
                            {/* Client selector card */}
                            <SectionCard
                                title="Informations client"
                                subtitle="Sélectionnez le tiers à facturer"
                                icon={UserGroupIcon}
                                iconColor="blue"
                                badge={formData.CodTiers && (
                                    <span className="text-[10px] font-mono text-blue-500 bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                                        #{formData.CodTiers}
                                    </span>
                                )}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Client dropdown */}
                                    <div className="md:col-span-2">
                                        <Field label="Choisir un client" icon={UserGroupIcon} required>
                                            <select
                                                value={formData.CodTiers || ''}
                                                onChange={(e) => handleClientSelect(e.target.value)}
                                                disabled={isEdit}
                                            >
                                                <option value="">— Sélectionner dans le référentiel —</option>
                                                {clients.map((c) => (
                                                    <option key={c.CodTiers} value={c.CodTiers}>
                                                        [{c.CodTiers}] {c.Raisoc}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                    </div>

                                    {/* Auto-filled readonly fields */}
                                    <ReadonlyField label="Code client" icon={IdentificationIcon} value={formData.CodTiers} />
                                    <ReadonlyField label="Raison sociale" icon={BuildingOfficeIcon} value={formData.LibTiers} />
                                    <ReadonlyField label="Adresse" icon={MapPinIcon} value={formData.Adresse} span2 />
                                    <ReadonlyField label="Ville / Gouvernorat" icon={MapPinIcon} value={formData.Ville} />
                                    <ReadonlyField label="Téléphone" icon={PhoneIcon} value={formData.Tel} />
                                    <ReadonlyField label="Code fiscal / MF" icon={IdentificationIcon} value={clientCin} />
                                    <ReadonlyField label="Commercial assigné" icon={UserIcon} value={formData.DesRepres} />
                                </div>

                                {/* Additional read-only info row */}
                                {(formData.Classe || formData.Categorie || formData.Domaine) && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <ReadonlyField label="Classe" icon={TagIcon} value={formData.Classe} />
                                        <ReadonlyField label="Catégorie" icon={TagIcon} value={formData.Categorie} />
                                        <ReadonlyField label="Domaine" icon={BuildingOfficeIcon} value={formData.Domaine} />
                                    </div>
                                )}
                            </SectionCard>

                            {/* Billing address card */}
                            <SectionCard
                                title="Adresse de facturation alternative"
                                subtitle="Optionnel — si différente de l'adresse principale"
                                icon={MapPinIcon}
                                iconColor="amber"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Raison sociale facturation" span2>
                                        <input
                                            type="text"
                                            name="LibTiersA"
                                            value={formData.LibTiersA || ''}
                                            onChange={handleChange}
                                            placeholder="Si différente du client principal"
                                        />
                                    </Field>
                                    <Field label="Adresse facturation" span2>
                                        <input
                                            type="text"
                                            name="AdresseA"
                                            value={formData.AdresseA || ''}
                                            onChange={handleChange}
                                            placeholder="Rue, numéro, bâtiment…"
                                        />
                                    </Field>
                                    <Field label="Ville facturation">
                                        <input
                                            type="text"
                                            name="VilleA"
                                            value={formData.VilleA || ''}
                                            onChange={handleChange}
                                            placeholder="Ville"
                                        />
                                    </Field>
                                    <Field label="Code fiscal / CIN facturation">
                                        <input
                                            type="text"
                                            name="CinA"
                                            value={formData.CinA || ''}
                                            onChange={handleChange}
                                            placeholder="MF ou CIN alternatif"
                                            style={{ fontFamily: 'monospace' }}
                                        />
                                    </Field>
                                </div>
                            </SectionCard>

                            {/* Navigation */}
                            <div className="flex justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all"
                                >
                                    Continuer vers les articles
                                    <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 2 : ARTICLES ── */}
                    {currentStep === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                            className="space-y-5"
                        >
                            <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
                                {/* Header */}
                                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-white">
                                    <div className="flex items-center gap-3.5">
                                        <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                                            <ShoppingCartIcon className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-800">Articles & lignes de facturation</h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Ajoutez, recherchez et configurez vos produits</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
                                    >
                                        <PlusIcon className="h-3.5 w-3.5 stroke-[3]" />
                                        Ajouter un article
                                    </button>
                                </div>

                                {/* Column headers */}
                                <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                    <span className="w-5 text-center">#</span>
                                    <span className="flex-1">Produit / Désignation</span>
                                    <span className="w-16 text-center">Qté</span>
                                    <span className="w-24 text-right">P.U HT</span>
                                    <span className="w-20 text-right mr-20">Total HT</span>
                                </div>

                                {/* Items */}
                                <div className="divide-y divide-slate-100">
                                    {items.length === 0 ? (
                                        <div className="text-center py-16 text-slate-400">
                                            <ShoppingCartIcon className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                                            <p className="text-sm">Aucun article. Cliquez sur "Ajouter un article" pour commencer.</p>
                                        </div>
                                    ) : (
                                        items.map((item, index) => (
                                            <ItemRow
                                                key={item.tempId}
                                                item={item}
                                                index={index}
                                                productOptions={productOptions}
                                                loadingProducts={loadingProducts}
                                                activeRowId={activeProductRowId}
                                                onSearchChange={handleProductSearchChange}
                                                onProductSelect={handleProductSelect}
                                                onItemChange={handleItemChange}
                                                onRemove={removeItem}
                                                onFocus={(id) => setActiveProductRowId(id)}
                                            />
                                        ))
                                    )}
                                </div>

                                {/* Totals footer */}
                                <TotalsBar items={items} totRem={formData.TotRem} />
                            </div>

                            {/* Global discount */}
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
                                <div className="flex flex-wrap items-center gap-6">
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                            Remise globale (TND)
                                        </label>
                                        <input
                                            type="number"
                                            name="TotRem"
                                            min="0"
                                            value={formData.TotRem || ''}
                                            onChange={handleChange}
                                            placeholder="0.000"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all tabular-nums"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                            Remarque / note
                                        </label>
                                        <input
                                            type="text"
                                            name="Remarq"
                                            value={formData.Remarq || ''}
                                            onChange={handleChange}
                                            placeholder="Remarque interne ou conditions particulières…"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Navigation */}
                            <div className="flex justify-between pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-semibold transition-all"
                                >
                                    <ArrowLeftIcon className="h-4 w-4" />
                                    Retour
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(3)}
                                    className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-500/20 transition-all"
                                >
                                    Vérifier & valider
                                    <ArrowLeftIcon className="h-4 w-4 rotate-180" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* ── STEP 3 : VALIDATION ── */}
                    {currentStep === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <SummaryStep
                                formData={formData}
                                items={items}
                                saving={saving}
                                onBack={() => setCurrentStep(2)}
                                isEdit={isEdit}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
};

export default FavForm;
