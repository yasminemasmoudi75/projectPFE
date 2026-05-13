import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    ChatBubbleLeftEllipsisIcon,
    UserCircleIcon,
    ExclamationTriangleIcon,
    TagIcon,
    InformationCircleIcon,
    CheckCircleIcon,
    SparklesIcon,
    BoltIcon,
    ClockIcon,
    ShieldCheckIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';

const pageVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.08, delayChildren: 0.08 } }
};

const cardVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 250, damping: 24 } }
};

const ClaimForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [clients, setClients] = useState([]);
    const [step, setStep] = useState(1);
    const [searchClient, setSearchClient] = useState('');
    const isClientUser = user?.UserRole?.toLowerCase() === 'client';

    const [formData, setFormData] = useState({
        CodTiers: '',
        LibTiers: '',
        Objet: '',
        Description: '',
        Priorite: 'Moyenne',
        TypeReclamation: 'Technique'
    });

    const isStep1Complete = formData.CodTiers && formData.LibTiers;
    const isStep2Complete = formData.Objet && formData.TypeReclamation && formData.Priorite;
    const isStep3Complete = formData.Description;

    useEffect(() => {
        const fetchClients = async () => {
            try {
                setLoading(true);
                const response = await axios.get('/tiers?limit=10000');
                const list = response?.data?.data ?? response?.data ?? [];
                const normalized = (Array.isArray(list) ? list : []).map((client) => ({
                    ...client,
                    LibTiers: client.LibTiers || client.Raisoc || client.CodTiers
                }));
                setClients(normalized);

                // Auto-select client for Client role users
                if (isClientUser) {
                    const userCodTiers = String(user?.CodTiers || user?.codTiers || '').trim().toLowerCase();
                    const userEmail = String(user?.EmailPro || user?.LoginName || '').trim().toLowerCase();
                    const matchingClient = normalized.find((c) => {
                        const clientCodTiers = String(c.CodTiers || '').trim().toLowerCase();
                        const clientEmail = String(c.Email || c.email || '').trim().toLowerCase();
                        return (userCodTiers && clientCodTiers === userCodTiers) || (userEmail && clientEmail === userEmail);
                    }) || normalized[0] || null;

                    if (matchingClient) {
                        setFormData((prev) => ({
                            ...prev,
                            CodTiers: matchingClient.CodTiers,
                            LibTiers: matchingClient.LibTiers || matchingClient.Raisoc || matchingClient.CodTiers
                        }));
                    }
                }
            } catch (error) {
                console.error('Error fetching clients:', error);
                toast.error('Impossible de charger la liste des clients');
            } finally {
                setLoading(false);
            }
        };

        fetchClients();
    }, [isClientUser, user?.CodTiers, user?.EmailPro, user?.LoginName]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'CodTiers') {
            const client = clients.find((c) => c.CodTiers === value);
            setFormData((prev) => ({
                ...prev,
                CodTiers: value,
                LibTiers: client ? (client.LibTiers || client.Raisoc || '') : ''
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        try {
            const response = await axios.post('/reclamations', formData);
            if (response?.status === 'success') {
                toast.success('Réclamation enregistrée avec succès');
                navigate('/claims');
            } else {
                toast.error('Création de la réclamation échouée');
            }
        } catch (error) {
            console.error('Error creating reclamation:', error);
            const message = error.response?.data?.message || 'Erreur lors de la création de la réclamation';
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    const filteredClients = clients.filter((client) => {
        const query = String(searchClient || '').toLowerCase().trim();
        if (!query) return true;
        return [client.LibTiers, client.CodTiers, client.Raisoc]
            .some((value) => String(value || '').toLowerCase().includes(query));
    });

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pb-20">
            <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 shadow-sm backdrop-blur-xl">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:border-blue-200 hover:bg-white hover:text-blue-600"
                    >
                        <ArrowLeftIcon className="h-4 w-4" /> Retour
                    </button>
                    <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-700">
                        <SparklesIcon className="h-4 w-4" /> Nouveau ticket
                    </div>
                    <div className="w-20" />
                </div>
            </div>

            <motion.div variants={pageVariants} initial="hidden" animate="visible" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <motion.div variants={cardVariants} className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
                    <div className="pointer-events-none absolute inset-0">
                        <div className="absolute -top-16 right-0 h-64 w-64 rounded-full bg-indigo-100/60 blur-3xl" />
                        <div className="absolute bottom-0 left-16 h-56 w-56 rounded-full bg-sky-100/60 blur-3xl" />
                    </div>

                    <div className="relative grid grid-cols-1 gap-0 lg:grid-cols-[1.25fr_0.75fr]">
                        <div className="p-6 sm:p-8 lg:p-10">
                            <div className="mb-8 flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                                    <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-500" /> Formulaire guidé
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">
                                    <ClockIcon className="h-3.5 w-3.5" /> Étape {step} / 3
                                </span>
                            </div>

                            <div className="space-y-4">
                                <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Créer une réclamation</h1>
                                <p className="max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                                    Un parcours simple en trois étapes pour saisir le client, qualifier la demande et détailler le problème.
                                </p>
                            </div>

                            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <CompactStep label="Client" active={step >= 1} done={step > 1} icon={UserCircleIcon} />
                                <CompactStep label="Détails" active={step >= 2} done={step > 2} icon={TagIcon} />
                                <CompactStep label="Description" active={step >= 3} done={step > 3} icon={ChatBubbleLeftEllipsisIcon} />
                            </div>

                            <form onSubmit={handleSubmit} className="mt-8 space-y-8">
                                <section className={step === 1 ? 'block' : 'hidden'}>
                                    <StepCard
                                        title="Sélection du client"
                                        subtitle="Choisissez l'entreprise ou le contact concerné."
                                        icon={UserCircleIcon}
                                        accent="from-blue-600 to-indigo-600"
                                    >
                                        <div className="space-y-3">
                                            {!isClientUser && (
                                                <>
                                                    <label className="block text-sm font-bold text-slate-700">Rechercher un client</label>
                                                    <div className="relative">
                                                        <FunnelIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                        <input
                                                            type="text"
                                                            value={searchClient}
                                                            onChange={(e) => setSearchClient(e.target.value)}
                                                            placeholder="Nom, code ou raison sociale"
                                                            className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                                        />
                                                    </div>
                                                </>
                                            )}

                                            <label className="block text-sm font-bold text-slate-700">Client *</label>
                                            <select
                                                name="CodTiers"
                                                value={formData.CodTiers}
                                                onChange={handleChange}
                                                disabled={isClientUser}
                                                className={`w-full appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold outline-none transition-all focus:ring-4 focus:ring-blue-600/10 ${
                                                    isClientUser
                                                        ? 'cursor-not-allowed bg-slate-50 text-slate-600'
                                                        : 'cursor-pointer hover:border-slate-300 focus:border-blue-600'
                                                }`}
                                                required
                                            >
                                                <option value="">Choisir un client...</option>
                                                {filteredClients.map((c) => (
                                                    <option key={c.CodTiers} value={c.CodTiers}>
                                                        {c.LibTiers} • {c.CodTiers}
                                                    </option>
                                                ))}
                                            </select>
                                            {isClientUser && formData.CodTiers && (
                                                <p className="text-xs text-blue-600">Votre entreprise a été sélectionnée automatiquement.</p>
                                            )}
                                        </div>

                                        {formData.CodTiers && (
                                            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                                <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                                                <div>
                                                    <p className="text-sm font-bold text-emerald-900">Client sélectionné</p>
                                                    <p className="text-xs text-emerald-700">{formData.LibTiers}</p>
                                                </div>
                                            </div>
                                        )}
                                    </StepCard>
                                </section>

                                <section className={step === 2 ? 'block' : 'hidden'}>
                                    <StepCard
                                        title="Détails du ticket"
                                        subtitle="Donnez un objet clair et choisissez la bonne classification."
                                        icon={InformationCircleIcon}
                                        accent="from-amber-500 to-orange-600"
                                    >
                                        <div className="space-y-5">
                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold text-slate-700">Objet / Titre *</label>
                                                <input
                                                    type="text"
                                                    name="Objet"
                                                    value={formData.Objet}
                                                    onChange={handleChange}
                                                    className="w-full rounded-2xl border-2 border-slate-200 bg-slate-50 px-5 py-4 font-bold outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                                    placeholder="Ex: Produit défectueux reçu"
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                        <TagIcon className="h-4 w-4 text-blue-600" /> Type *
                                                    </label>
                                                    <select
                                                        name="TypeReclamation"
                                                        value={formData.TypeReclamation}
                                                        onChange={handleChange}
                                                        className="w-full cursor-pointer appearance-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-bold outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                                    >
                                                        <option>Technique</option>
                                                        <option>Commercial</option>
                                                        <option>Livraison / Stock</option>
                                                        <option>Facturation</option>
                                                        <option>Qualité Produit</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                        <ExclamationTriangleIcon className="h-4 w-4 text-amber-500" /> Priorité *
                                                    </label>
                                                    <select
                                                        name="Priorite"
                                                        value={formData.Priorite}
                                                        onChange={handleChange}
                                                        className={`w-full cursor-pointer appearance-none rounded-2xl border-2 bg-white px-5 py-4 font-bold outline-none transition-all focus:ring-4 focus:ring-blue-600/10 ${
                                                            formData.Priorite === 'Urgente'
                                                                ? 'border-red-500 focus:border-red-500'
                                                                : formData.Priorite === 'Haute'
                                                                  ? 'border-orange-500 focus:border-orange-500'
                                                                  : 'border-slate-200 focus:border-blue-600'
                                                        }`}
                                                    >
                                                        <option>Basse</option>
                                                        <option>Moyenne</option>
                                                        <option>Haute</option>
                                                        <option>Urgente</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </StepCard>
                                </section>

                                <section className={step === 3 ? 'block' : 'hidden'}>
                                    <StepCard
                                        title="Description détaillée"
                                        subtitle="Décrivez le problème et ajoutez les éléments utiles au traitement."
                                        icon={ChatBubbleLeftEllipsisIcon}
                                        accent="from-indigo-600 to-indigo-700"
                                    >
                                        <div className="space-y-3">
                                            <label className="block text-sm font-bold text-slate-700">Description *</label>
                                            <textarea
                                                name="Description"
                                                value={formData.Description}
                                                onChange={handleChange}
                                                rows="7"
                                                className="w-full resize-none rounded-2xl border-2 border-slate-200 bg-white px-5 py-4 font-medium outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
                                                placeholder="Décrivez le problème en détail, les étapes à reproduire, les dates, etc."
                                                required
                                            />
                                            <p className="text-xs text-slate-500">{formData.Description.length} caractères</p>
                                        </div>
                                    </StepCard>

                                    <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 md:grid-cols-2">
                                        <SummaryItem label="Client" value={formData.LibTiers} />
                                        <SummaryItem label="Priorité" value={formData.Priorite} />
                                        <SummaryItem label="Type" value={formData.TypeReclamation} />
                                        <SummaryItem label="Objet" value={formData.Objet} />
                                    </div>
                                </section>

                                <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <button
                                        type="button"
                                        onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))}
                                        className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-100"
                                    >
                                        {step > 1 ? '← Précédent' : 'Annuler'}
                                    </button>

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                        {step < 3 ? (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if ((step === 1 && isStep1Complete) || (step === 2 && isStep2Complete)) {
                                                        setStep(step + 1);
                                                    }
                                                }}
                                                disabled={(step === 1 && !isStep1Complete) || (step === 2 && !isStep2Complete)}
                                                className={`rounded-2xl px-8 py-3 text-sm font-black transition-all ${
                                                    ((step === 1 && isStep1Complete) || (step === 2 && isStep2Complete))
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700'
                                                        : 'cursor-not-allowed bg-slate-200 text-slate-500'
                                                }`}
                                            >
                                                Suivant →
                                            </button>
                                        ) : (
                                            <button
                                                type="submit"
                                                disabled={saving || !isStep3Complete}
                                                className={`flex items-center justify-center gap-2 rounded-2xl px-8 py-3 text-sm font-black transition-all ${
                                                    saving || !isStep3Complete
                                                        ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700'
                                                }`}
                                            >
                                                {saving ? (
                                                    <>
                                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                        Création...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckIcon className="h-5 w-5" />
                                                        Ouvrir le ticket
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="hidden border-l border-slate-200 bg-gradient-to-b from-slate-50 to-white p-10 lg:block">
                            <div className="space-y-5">
                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                                            <BoltIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Aide rapide</p>
                                            <h2 className="text-lg font-black text-slate-900">Conseils de saisie</h2>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-4">
                                        <GuidanceItem title="Objet clair" text="Un intitulé court aide à trier et prioriser le ticket." />
                                        <GuidanceItem title="Priorité réaliste" text="Choisis une urgence seulement si le problème bloque réellement l'activité." />
                                        <GuidanceItem title="Description précise" text="Ajoute les symptômes, le contexte et les éléments déjà testés." />
                                    </div>
                                </div>

                                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                                            <ShieldCheckIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Statut</p>
                                            <h2 className="text-lg font-black text-slate-900">Process guidé</h2>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-3">
                                        <BadgeRow label="1. Client" value={isStep1Complete ? 'Prêt' : 'À compléter'} />
                                        <BadgeRow label="2. Détails" value={isStep2Complete ? 'Prêt' : 'À compléter'} />
                                        <BadgeRow label="3. Description" value={isStep3Complete ? 'Prêt' : 'À compléter'} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

const CompactStep = ({ label, active, done, icon: Icon }) => (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${active ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-white'}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${done ? 'bg-emerald-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {done ? <CheckIcon className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Étape</p>
            <p className="text-sm font-black text-slate-800">{label}</p>
        </div>
    </div>
);

const StepCard = ({ title, subtitle, icon: Icon, accent, children }) => (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className={`bg-gradient-to-r ${accent} px-6 py-5 text-white sm:px-8`}>
            <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-white/15 p-3">
                    <Icon className="h-6 w-6" />
                </div>
                <div>
                    <h2 className="text-lg font-black">{title}</h2>
                    <p className="text-sm text-white/80">{subtitle}</p>
                </div>
            </div>
        </div>
        <div className="p-6 sm:p-8">{children}</div>
    </div>
);

const SummaryItem = ({ label, value }) => (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 truncate text-sm font-black text-slate-800">{value || '-'}</p>
    </div>
);

const GuidanceItem = ({ title, text }) => (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p>
    </div>
);

const BadgeRow = ({ label, value }) => (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-700">{value}</span>
    </div>
);

export default ClaimForm;
