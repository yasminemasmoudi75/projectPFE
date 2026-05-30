import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeftIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { USER_ROLES } from '../../utils/constants';

const ClaimInterventionForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, isTechnicien } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [claim, setClaim] = useState(null);
    const [techniciens, setTechniciens] = useState([]);

    const [form, setForm] = useState({
        technicienID: '',
        description: '',
        reportMode: 'with-report',
        resultat: '',
        actionType: 'Diagnostic',
        durationMin: '',
        nextStep: ''
    });

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const [claimRes, usersRes] = await Promise.all([
                    axios.get(`/reclamations/${id}`),
                    isAdmin ? axios.get('/users') : Promise.resolve({ status: 'skipped', data: [] })
                ]);

                if (claimRes?.status === 'success') {
                    setClaim(claimRes.data || null);
                }

                if (usersRes?.status === 'success' && Array.isArray(usersRes.data)) {
                    const techs = usersRes.data
                        .filter((u) => String(u.UserRole || '').toLowerCase() === USER_ROLES.TECHNICIEN.toLowerCase())
                        .map((u) => ({ id: u.UserID, name: u.FullName || u.LoginName || `Tech ${u.UserID}` }));
                    setTechniciens(techs);
                }
            } catch {
                toast.error('Impossible de charger la page');
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isAdmin]);

    useEffect(() => {
        if (!claim) return;
        setForm((prev) => ({
            ...prev,
            technicienID: prev.technicienID || claim.TechnicienID || user?.UserID || ''
        }));
    }, [claim, user?.UserID]);

    const onChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (form.reportMode === 'with-report' && !String(form.resultat || '').trim()) {
            toast.error('Le rapport est obligatoire dans ce mode.');
            return;
        }

        try {
            setSaving(true);

            const details = [
                `Type: ${form.actionType}`,
                form.durationMin ? `Durée: ${form.durationMin} min` : null,
                form.nextStep ? `Prochaine étape: ${form.nextStep}` : null,
            ].filter(Boolean).join(' | ');

            const payload = {
                technicienID: isAdmin ? form.technicienID : (user?.UserID || claim?.TechnicienID),
                description: `${form.description || claim?.Objet || 'Action'}${details ? `\n${details}` : ''}`,
                resultat: form.reportMode === 'with-report' ? form.resultat : 'Sans rapport détaillé',
            };

            const res = await axios.post(`/reclamations/${id}/interventions`, payload);
            if (res?.status === 'success') {
                toast.success('Action enregistrée avec succès');
                navigate(`/claims/${id}`);
            } else {
                toast.error('Enregistrement échoué');
            }
        } catch (e) {
            toast.error(e.response?.data?.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8" style={{ background: 'linear-gradient(160deg, #f1f5ff 0%, #f8fafc 52%, #ecfdf5 100%)' }}>
            <div className="max-w-3xl mx-auto space-y-6">
                <button
                    type="button"
                    onClick={() => navigate(`/claims/${id}`)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" /> Retour au détail
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-slate-200 bg-white p-7 shadow-lg"
                >
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Formulaire professionnel</p>
                            <h1 className="mt-1 text-2xl font-black text-slate-900">Nouvelle action</h1>
                            <p className="mt-1 text-sm text-slate-500">Réclamation #{claim?.NumTicket || claim?.ID}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                            <CheckCircleIcon className="h-3.5 w-3.5" /> Qualité SAV
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                        <MiniStat label="Statut" value={claim?.Statut || 'Ouvert'} />
                        <MiniStat label="Priorité" value={claim?.Priorite || 'Normale'} />
                        <MiniStat label="Client" value={claim?.LibTiers || claim?.CodTiers || '-'} />
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Affectation et contexte</p>
                            {isAdmin && (
                                <Field label="Agent support">
                                    <select
                                        value={form.technicienID}
                                        onChange={(e) => onChange('technicienID', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    >
                                        <option value="">Sélectionner un agent</option>
                                        {techniciens.map((tech) => (
                                            <option key={tech.id} value={tech.id}>{tech.name}</option>
                                        ))}
                                    </select>
                                </Field>
                            )}

                            <Field label="Description de l'action">
                                <textarea
                                    value={form.description}
                                    onChange={(e) => onChange('description', e.target.value)}
                                    rows="3"
                                    placeholder="Résumé court de l'action..."
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                                />
                            </Field>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Détails opérationnels</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Type d'action">
                                    <select
                                        value={form.actionType}
                                        onChange={(e) => onChange('actionType', e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    >
                                        <option value="Diagnostic">Diagnostic</option>
                                        <option value="Réparation">Réparation</option>
                                        <option value="Contrôle">Contrôle</option>
                                        <option value="Maintenance">Maintenance</option>
                                    </select>
                                </Field>

                                <Field label="Durée (minutes)">
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.durationMin}
                                        onChange={(e) => onChange('durationMin', e.target.value)}
                                        placeholder="Ex: 45"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                    />
                                </Field>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Compte-rendu</p>
                            <Field label="Mode de compte-rendu">
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onChange('reportMode', 'with-report')}
                                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${form.reportMode === 'with-report' ? 'bg-[#0062AF] text-white border-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        Avec rapport
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onChange('reportMode', 'without-report')}
                                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors ${form.reportMode === 'without-report' ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        Sans rapport
                                    </button>
                                </div>
                            </Field>

                            {form.reportMode === 'with-report' ? (
                                <Field label="Rapport d'action">
                                    <textarea
                                        value={form.resultat}
                                        onChange={(e) => onChange('resultat', e.target.value)}
                                        rows="4"
                                        placeholder="Détail du rapport (obligatoire)..."
                                        required
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                                    />
                                </Field>
                            ) : (
                                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                                    Cette action sera enregistrée sans rapport détaillé.
                                </div>
                            )}
                        </div>

                        <Field label="Prochaine étape (optionnel)">
                            <input
                                type="text"
                                value={form.nextStep}
                                onChange={(e) => onChange('nextStep', e.target.value)}
                                placeholder="Ex: Attendre la validation client"
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                            />
                        </Field>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => navigate(`/claims/${id}`)}
                                className="sm:w-40 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                                Annuler
                            </button>
                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.97 }}
                                disabled={saving}
                                className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                            >
                                <SparklesIcon className="h-4 w-4" /> {saving ? 'Enregistrement...' : "Enregistrer l'action"}
                            </motion.button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

const MiniStat = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-sm font-black text-slate-800 truncate">{value}</p>
    </div>
);

const Field = ({ label, children }) => (
    <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</label>
        {children}
    </div>
);

export default ClaimInterventionForm;
