import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    BanknotesIcon,
    ChartBarIcon,
    ClockIcon,
    DocumentTextIcon,
    SparklesIcon,
    ShieldCheckIcon,
    CreditCardIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowUpRightIcon,
    BuildingOffice2Icon,
    PlusIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import axios from '../../app/axios';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatCurrency, formatDate } from '../../utils/format';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

/* ─── Variants ───────────────────────────────────────────────── */
const page = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } } };
const up   = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 270, damping: 24 } } };

/* ── Status config ───────────────────────────────────────────── */
const getStatusCfg = (remaining, paid) => {
    if (remaining <= 0) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', bar: 'from-emerald-400 to-teal-500',  label: 'Réglée',    pulse: false };
    if (paid > 0)       return { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   bar: 'from-amber-400 to-orange-500', label: 'Partielle', pulse: true  };
    return               { bg: 'bg-slate-50',   text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-300',   bar: 'from-slate-300 to-slate-400',  label: 'En attente', pulse: false };
};

/* ════════════════════════════════════════════════════════════════ */
const ClientReglements = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAdmin } = useAuth();

    const [loading, setLoading]   = useState(true);
    const [client, setClient]     = useState(null);
    const [invoices, setInvoices] = useState([]);

    useEffect(() => {
        if (!id) return;
        (async () => {
            try {
                setLoading(true);
                const cRes = await axios.get(`/tiers/${id}`);
                const clientData = cRes?.data?.data || cRes?.data;
                setClient(clientData || null);

                const fRes = await axios.get('/fav', { params: { search: clientData?.CodTiers || clientData?.Raisoc || '', limit: 500 } });
                const list = fRes?.data?.data || fRes?.data || [];
                const code = String(clientData?.CodTiers || '').trim();
                const name = String(clientData?.Raisoc || clientData?.LibTiers || '').trim().toLowerCase();
                setInvoices((Array.isArray(list) ? list : []).filter(inv =>
                    code && (String(inv.CodTiers || '').trim() === code || String(inv.LibTiers || '').trim().toLowerCase() === name)
                ));
            } catch {
                toast.error('Impossible de charger les règlements');
                setClient(null);
            } finally { setLoading(false); }
        })();
    }, [id]);

    const totals = useMemo(() => {
        const totalFacture = invoices.reduce((a, i) => a + Number(i.TotTTC    || 0), 0);
        const totalPaye    = invoices.reduce((a, i) => a + Number(i.MntCredit || 0), 0);
        const totalDu      = Math.max(totalFacture - totalPaye, 0);
        const taux         = totalFacture > 0 ? Math.min((totalPaye / totalFacture) * 100, 100) : 0;
        return { totalFacture, totalPaye, totalDu, taux };
    }, [invoices]);

    if (loading) return <LoadingSpinner />;

    /* ── Error states ── */
    if (!client) return (
        <Guard icon={<ExclamationTriangleIcon className="h-7 w-7 text-amber-500" />} iconBg="bg-amber-50"
            title="Client introuvable" subtitle="La fiche client n'est pas disponible."
            action={() => navigate('/clients')} actionLabel="Retour aux clients" actionColor="bg-blue-600 hover:bg-blue-700"
        />
    );
    if (!isAdmin) return (
        <Guard icon={<ShieldCheckIcon className="h-7 w-7 text-blue-600" />} iconBg="bg-blue-50"
            title="Accès restreint" subtitle="Cette page est réservée aux administrateurs."
            action={() => navigate(`/clients/${id}`)} actionLabel="Retour à la fiche client" actionColor="bg-slate-900 hover:bg-slate-800"
        />
    );

    const tauxColor = totals.taux >= 80 ? 'from-emerald-400 to-teal-500' : totals.taux >= 40 ? 'from-amber-400 to-orange-500' : 'from-rose-400 to-red-500';

    return (
        <motion.div variants={page} initial="hidden" animate="visible"
            className="min-h-screen pb-24 px-4 sm:px-6 lg:px-8"
            style={{ background: 'linear-gradient(155deg, #f0f5ff 0%, #f8fafc 50%, #f0fdf8 100%)' }}
        >
            {/* fixed top ribbon matching taux */}
            <div className={`h-1 w-full bg-gradient-to-r ${tauxColor} fixed top-0 left-0 z-50`} />

            <div className="mx-auto max-w-7xl pt-10 space-y-7">

                {/* ── Hero ─────────────────────────────────────── */}
                <motion.div variants={up}
                    className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-lg"
                    style={{ boxShadow: '0 8px 40px rgba(99,102,241,.08)' }}
                >
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-16 right-0   h-64 w-64 rounded-full bg-indigo-100/50 blur-3xl" />
                        <div className="absolute  bottom-0 left-16 h-48 w-48 rounded-full bg-cyan-100/40   blur-3xl" />
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-l-3xl" />

                    <div className="relative flex flex-col gap-5 p-8 pl-10 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-6 w-1 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Finance · Règlements client</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 leading-tight sm:text-4xl"
                                style={{ fontFamily: "'Georgia', serif" }}
                            >
                                {client.Raisoc || client.LibTiers}
                            </h1>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                    <BuildingOffice2Icon className="h-3 w-3" />
                                    {client.CodTiers}
                                </span>
                                {client.Ville && <span className="text-xs text-slate-400 font-medium">{client.Ville}</span>}
                                {client.Email && <span className="text-xs text-slate-400 font-medium">· {client.Email}</span>}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
                            <motion.button whileHover={{ x: -3 }} whileTap={{ scale: 0.96 }}
                                onClick={() => navigate(`/clients/${id}`)}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <ArrowLeftIcon className="h-4 w-4" /> Fiche client
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/fav/new')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                <PlusIcon className="h-4 w-4" /> Nouvelle facture
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* ── KPI row ──────────────────────────────────── */}
                <motion.div variants={up} className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                    <KpiCard label="Total facturé"      value={formatCurrency(totals.totalFacture)} icon={DocumentTextIcon} from="#3b82f6" to="#6366f1" sub={`${invoices.length} facture${invoices.length!==1?'s':''}`} />
                    <KpiCard label="Montant encaissé"   value={formatCurrency(totals.totalPaye)}    icon={CheckCircleIcon}  from="#10b981" to="#14b8a6" sub="paiements reçus" />
                    <KpiCard label="Reste à régler"     value={formatCurrency(totals.totalDu)}      icon={ClockIcon}        from="#f59e0b" to="#f97316" sub="en attente" />
                    <KpiCard label="Taux de règlement"  value={`${totals.taux.toFixed(0)} %`}       icon={ChartBarIcon}     from="#6366f1" to="#8b5cf6" sub="progression globale" progress={totals.taux} progressColor={tauxColor} />
                </motion.div>

                {/* ── Main layout ───────────────────────────────── */}
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_0.6fr]">

                    {/* ── Invoice list ── */}
                    <motion.div variants={up} className="rounded-3xl border border-slate-100 bg-white shadow-md overflow-hidden">
                        <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/30 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center">
                                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-slate-800">Factures du client</h2>
                                    <p className="text-xs text-slate-400 font-medium mt-0.5">{invoices.length} facture{invoices.length!==1?'s':''}</p>
                                </div>
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black border ${
                                totals.totalDu <= 0 && invoices.length > 0
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : totals.totalPaye > 0
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${
                                    totals.totalDu <= 0 && invoices.length > 0 ? 'bg-emerald-500' : totals.totalPaye > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-300'
                                }`} />
                                {totals.taux.toFixed(0)}% réglé
                            </span>
                        </div>

                        <div className="p-6">
                            {invoices.length === 0 ? (
                                <EmptyState navigate={navigate} />
                            ) : (
                                <div className="space-y-3">
                                    {invoices.map(invoice => {
                                        const total     = Number(invoice.TotTTC    || 0);
                                        const paid      = Number(invoice.MntCredit || 0);
                                        const remaining = Math.max(total - paid, 0);
                                        const pct       = total > 0 ? Math.min((paid / total) * 100, 100) : 0;
                                        const st        = getStatusCfg(remaining, paid);

                                        return (
                                            <motion.div key={invoice.Guid}
                                                whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}
                                                className="group rounded-2xl border border-slate-100 bg-slate-50/60 p-5 hover:bg-white hover:border-blue-100 transition-all shadow-sm"
                                            >
                                                {/* top row */}
                                                <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                                                                {invoice.Prfx}{invoice.Nf}
                                                            </span>
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-black ${st.bg} ${st.text} ${st.border}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${st.dot} ${st.pulse ? 'animate-pulse' : ''}`} />
                                                                {st.label}
                                                            </span>
                                                            {invoice.Valid && (
                                                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10px] font-black text-indigo-600">Validée</span>
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-black text-slate-900">{invoice.LibTiers || client.Raisoc}</h3>
                                                        <p className="text-xs text-slate-400 mt-0.5">Émise le {formatDate(invoice.DatUser)}</p>
                                                    </div>
                                                    <motion.button
                                                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                                                        onClick={() => navigate(`/fav/${invoice.Guid}`)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm group-hover:border-blue-200"
                                                    >
                                                        Voir <ArrowUpRightIcon className="h-3.5 w-3.5" />
                                                    </motion.button>
                                                </div>

                                                {/* metrics */}
                                                <div className="grid grid-cols-3 gap-2 mb-3">
                                                    <MiniStat label="Total TTC"  value={formatCurrency(total)}     tone="text-slate-800" />
                                                    <MiniStat label="Encaissé"   value={formatCurrency(paid)}      tone="text-emerald-600" />
                                                    <MiniStat label="Reste"      value={formatCurrency(remaining)} tone={remaining > 0 ? 'text-amber-600' : 'text-emerald-600'} />
                                                </div>

                                                {/* progress */}
                                                <div>
                                                    <div className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${pct}%` }}
                                                            transition={{ duration: 0.8, ease: 'easeOut' }}
                                                            className={`h-full rounded-full bg-gradient-to-r ${st.bar}`}
                                                        />
                                                    </div>
                                                    <p className="text-[9px] text-slate-400 font-semibold mt-1">{pct.toFixed(0)}% réglé</p>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Sidebar ── */}
                    <div className="space-y-5">

                        {/* Summary card */}
                        <motion.div variants={up} className="rounded-2xl border border-slate-100 bg-white shadow-md overflow-hidden">
                            <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600" />
                            <div className="p-6">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-5">Résumé client</p>
                                <div className="space-y-2">
                                    <SummaryRow label="Client"   value={client.Raisoc || client.LibTiers} />
                                    <SummaryRow label="Code"     value={client.CodTiers} />
                                    <SummaryRow label="Ville"    value={client.Ville || '—'} />
                                    <SummaryRow label="Factures" value={`${invoices.length}`} />
                                    <SummaryRow label="Taux"     value={`${totals.taux.toFixed(0)} %`} />
                                    <SummaryRow label="Reste"    value={formatCurrency(totals.totalDu)} highlight />
                                </div>
                            </div>
                        </motion.div>

                        {/* Global progress */}
                        <motion.div variants={up} className="rounded-2xl border border-slate-100 bg-white shadow-md p-6 overflow-hidden relative">
                            <div className={`absolute inset-0 opacity-[0.04] bg-gradient-to-br ${tauxColor}`} />
                            <p className="relative text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4">Progression globale</p>
                            <div className={`relative flex items-center gap-3 p-4 rounded-2xl border ${
                                totals.taux >= 80 ? 'bg-emerald-50 border-emerald-200' : totals.taux >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200'
                            }`}>
                                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${tauxColor} flex items-center justify-center shadow-md flex-shrink-0`}>
                                    <ChartBarIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className={`font-black text-xl ${totals.taux >= 80 ? 'text-emerald-700' : totals.taux >= 40 ? 'text-amber-700' : 'text-rose-600'}`}>
                                        {totals.taux.toFixed(0)} %
                                    </p>
                                    <p className="text-[10px] text-slate-400 font-semibold">encaissé sur total facturé</p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${totals.taux}%` }}
                                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
                                        className={`h-full rounded-full bg-gradient-to-r ${tauxColor}`}
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Notes card */}
                        <motion.div variants={up} className="rounded-2xl border border-slate-100 bg-white shadow-md overflow-hidden">
                            <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <CreditCardIcon className="h-4 w-4 text-indigo-500" />
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Lecture du règlement</h3>
                            </div>
                            <div className="p-5 space-y-3">
                                <NoteItem icon="💰" title="Payé"   text="Somme enregistrée via le champ MntCredit de la facture." />
                                <NoteItem icon="📊" title="Reste"  text="Différence entre total TTC et montant déjà payé." />
                                <NoteItem icon="🔒" title="Accès"  text="Page réservée à l'administration." />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

/* ── Guard screen ────────────────────────────────────────────── */
const Guard = ({ icon, iconBg, title, subtitle, action, actionLabel, actionColor }) => (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="rounded-3xl border border-slate-100 bg-white p-10 shadow-xl">
            <div className={`mx-auto h-14 w-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>{icon}</div>
            <h1 className="text-xl font-black text-slate-900">{title}</h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{subtitle}</p>
            <button onClick={action}
                className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-colors ${actionColor}`}
            >
                <ArrowLeftIcon className="h-4 w-4" /> {actionLabel}
            </button>
        </div>
    </div>
);

/* ── KPI Card ────────────────────────────────────────────────── */
const KpiCard = ({ label, value, icon: Icon, from, to, sub, progress, progressColor }) => (
    <motion.div variants={up} whileHover={{ y: -3 }}
        className="relative bg-white rounded-2xl border border-slate-100 shadow-md p-5 overflow-hidden"
    >
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10"
            style={{ background: `radial-gradient(circle, ${from}, ${to})` }}
        />
        <div className="absolute bottom-0 left-0 right-0 h-0.5"
            style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
        />
        <div className="flex items-start justify-between mb-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm"
                style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
            >
                <Icon className="h-5 w-5 text-white" />
            </div>
            <SparklesIcon className="h-3.5 w-3.5 text-slate-200" />
        </div>
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className="text-xl font-black text-slate-900 leading-tight">{value}</p>
        <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sub}</p>
        {progress !== undefined && (
            <div className="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.5 }}
                    className={`h-full rounded-full bg-gradient-to-r ${progressColor}`}
                />
            </div>
        )}
    </motion.div>
);

/* ── Sub-components ──────────────────────────────────────────── */
const MiniStat = ({ label, value, tone }) => (
    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">{label}</p>
        <p className={`text-xs font-black ${tone} truncate`}>{value}</p>
    </div>
);

const SummaryRow = ({ label, value, highlight }) => (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 ${highlight ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className={`text-xs font-black ${highlight ? 'text-amber-700' : 'text-slate-800'}`}>{value || '—'}</span>
    </div>
);

const NoteItem = ({ icon, title, text }) => (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
        <span className="text-base flex-shrink-0 mt-0.5">{icon}</span>
        <div>
            <p className="text-xs font-black text-slate-800">{title}</p>
            <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{text}</p>
        </div>
    </div>
);

const EmptyState = ({ navigate }) => (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center">
            <BanknotesIcon className="h-7 w-7 text-slate-300" />
        </div>
        <div>
            <p className="text-base font-black text-slate-700">Aucune facture trouvée</p>
            <p className="text-sm text-slate-400 mt-1">Ce client n'a pas encore de facture associée.</p>
        </div>
        <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/fav/new')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md"
        >
            <PlusIcon className="h-3.5 w-3.5" /> Créer une facture
        </motion.button>
    </div>
);

export default ClientReglements;
