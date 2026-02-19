import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeftIcon,
    CheckIcon,
    BriefcaseIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ChartBarIcon,
    FlagIcon,
    SparklesIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { fetchProjetById, createProjet, updateProjet } from './projetSlice';

const ProjetForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentProjet, loading: reduxLoading } = useSelector((state) => state.projets);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [tiers, setTiers] = useState([]);

    const [formData, setFormData] = useState({
        Nom_Projet: '',
        IDTiers: '',
        Budget_Alloue: 0,
        Avancement: 0,
        Date_Echeance: '',
        Priorite: 'Normale',
        Phase: 'Nouveau',
        Note_Privee: '',
        Alerte_IA_Risque: false
    });

    useEffect(() => {
        const fetchTiers = async () => {
            try {
                const response = await axios.get('/tiers');
                setTiers(response.data || []);
            } catch (error) {
                console.error('Error fetching tiers:', error);
            }
        };
        fetchTiers();

        if (isEdit) {
            dispatch(fetchProjetById(id));
        }
    }, [id, isEdit, dispatch]);

    useEffect(() => {
        if (isEdit && currentProjet) {
            setFormData({
                Nom_Projet: currentProjet.Nom_Projet || '',
                IDTiers: currentProjet.IDTiers || '',
                Budget_Alloue: currentProjet.Budget_Alloue || 0,
                Avancement: currentProjet.Avancement || 0,
                Date_Echeance: currentProjet.Date_Echeance ? new Date(currentProjet.Date_Echeance).toISOString().split('T')[0] : '',
                Priorite: currentProjet.Priorite || 'Normale',
                Phase: currentProjet.Phase || 'Nouveau',
                Note_Privee: currentProjet.Note_Privee || '',
                Alerte_IA_Risque: currentProjet.Alerte_IA_Risque || false
            });
            setLoading(false);
        }
    }, [currentProjet, isEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;

        if (type === 'checkbox') {
            finalValue = checked;
        } else if (type === 'number') {
            finalValue = value === '' ? 0 : parseFloat(value);
        }

        setFormData(prev => ({
            ...prev,
            [name]: finalValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                await dispatch(updateProjet({ id, data: formData })).unwrap();
                toast.success('Projet mis à jour');
            } else {
                await dispatch(createProjet(formData)).unwrap();
                toast.success('Projet créé avec succès');
            }
            navigate('/projets');
        } catch (error) {
            toast.error(error.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading || (isEdit && reduxLoading)) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in min-h-screen pb-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="group h-12 w-12 bg-white/80 backdrop-blur-sm border border-slate-200/50 text-slate-500 hover:text-blue-600 hover:border-blue-200 rounded-2xl transition-all shadow-soft flex items-center justify-center"
                    >
                        <ArrowLeftIcon className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="badge badge-primary">
                                <SparklesIcon className="h-3 w-3 mr-1" />
                                Gestion Projets
                            </span>
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                            {isEdit ? 'Modifier le Projet' : 'Nouvelle Initiative'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate('/projets')} className="btn-outline">Annuler</button>
                    <button
                        onClick={handleSubmit}
                        disabled={saving}
                        className="btn-soft-primary flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <CheckIcon className="h-4 w-4 stroke-[2.5]" />
                        )}
                        <span>{isEdit ? 'Enregistrer' : 'Lancer le Projet'}</span>
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-8">
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm shadow-glow-primary">
                                <BriefcaseIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Informations Clés</h2>
                                <p className="text-xs text-slate-500">Définition et client rattaché</p>
                            </div>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="label-modern">Nom du Projet *</label>
                                <input
                                    type="text"
                                    name="Nom_Projet"
                                    value={formData.Nom_Projet}
                                    onChange={handleChange}
                                    className="input-modern text-lg font-semibold"
                                    placeholder="Ex: Refonte Site E-commerce"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">Client (Tiers) *</label>
                                    <select
                                        name="IDTiers"
                                        value={formData.IDTiers}
                                        onChange={handleChange}
                                        className="input-modern"
                                        required
                                    >
                                        <option value="">Sélectionner un client...</option>
                                        {tiers.map(t => (
                                            <option key={t.IDTiers} value={t.IDTiers}>{t.Raisoc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-modern">Budget Alloué (TND)</label>
                                    <div className="relative">
                                        <CurrencyDollarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="number"
                                            name="Budget_Alloue"
                                            value={formData.Budget_Alloue}
                                            onChange={handleChange}
                                            className="input-modern pl-12"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-blue-50/80 to-transparent flex items-center gap-4">
                            <div className="icon-shape icon-shape-sm shadow-glow-blue" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)' }}>
                                <ChartBarIcon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Suivi et Avancement</h2>
                                <p className="text-xs text-slate-500">Statut et progression du projet</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="label-modern">Phase Actuelle</label>
                                    <select name="Phase" value={formData.Phase} onChange={handleChange} className="input-modern">
                                        <option>Nouveau</option>
                                        <option>Analyse</option>
                                        <option>Conception</option>
                                        <option>Exécution</option>
                                        <option>Tests</option>
                                        <option>Clôture</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label-modern">Avancement (%)</label>
                                    <input
                                        type="range"
                                        name="Avancement"
                                        value={formData.Avancement}
                                        onChange={handleChange}
                                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-4"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mt-2">
                                        <span>0%</span>
                                        <span className="text-blue-600">{formData.Avancement}%</span>
                                        <span>100%</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="label-modern">Priorité</label>
                                    <div className="flex gap-4 mt-2">
                                        {['Basse', 'Normale', 'Haute'].map(p => (
                                            <label key={p} className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${formData.Priorite === p ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                                <input type="radio" name="Priorite" value={p} checked={formData.Priorite === p} onChange={handleChange} className="hidden" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{p}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="label-modern">Date d'échéance</label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                        <input
                                            type="date"
                                            name="Date_Echeance"
                                            value={formData.Date_Echeance}
                                            onChange={handleChange}
                                            className="input-modern pl-12"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/80 to-transparent flex items-center gap-3">
                            <div className="icon-shape icon-shape-sm bg-slate-800">
                                <DocumentTextIcon className="h-4 w-4 text-white" />
                            </div>
                            <h2 className="text-sm font-bold text-slate-800">Note Privée</h2>
                        </div>
                        <div className="p-6">
                            <textarea
                                name="Note_Privee"
                                value={formData.Note_Privee}
                                onChange={handleChange}
                                rows="6"
                                className="input-modern resize-none text-sm"
                                placeholder="Instructions internes, détails techniques..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="card-glass p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <FlagIcon className="h-4 w-4 text-rose-500" />
                                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Risques</h4>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" name="Alerte_IA_Risque" checked={formData.Alerte_IA_Risque} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500"></div>
                            </label>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed italic">
                            Cochez cette case si vous estimez que le projet présente des risques majeurs. L'IA surveillera les indicateurs de performance.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProjetForm;
