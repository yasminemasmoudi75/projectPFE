import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    FlagIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ObjectifForm = () => {
    const navigate = useNavigate();
    const [saving, setSaving] = useState(false);

    // Mock des commerciaux pour le formulaire
    const COMMERCIALS = [
        { id: 1, name: 'Ahmed' },
        { id: 2, name: 'Sami' },
        { id: 3, name: 'Youssef' },
        { id: 4, name: 'Amine' }
    ];

    const [formData, setFormData] = useState({
        ID_Utilisateur: '',
        Mois: new Date().getMonth() + 1,
        Annee: new Date().getFullYear(),
        TypeObjectif: "Chiffre d'affaires",
        MontantCible: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        // Simulation API POST /api/objectifs
        setTimeout(() => {
            toast.success('Objectif défini avec succès');
            setSaving(false);
            navigate('/objectifs');
        }, 1000);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-500 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 font-bold text-sm"
                >
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Annuler
                </button>
                <h1 className="text-2xl font-black text-slate-800 border-l-4 border-primary-600 pl-4">
                    Définir un Nouvel Objectif
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Commercial & Période */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Commercial & Période</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Assigner à quel commercial ?</label>
                            <select
                                name="ID_Utilisateur"
                                value={formData.ID_Utilisateur}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer font-bold"
                                required
                            >
                                <option value="">--- Choisir un commercial ---</option>
                                {COMMERCIALS.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> Mois</label>
                                <select
                                    name="Mois"
                                    value={formData.Mois}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {new Date(0, i).toLocaleString('fr', { month: 'long' })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><CalendarIcon className="h-4 w-4" /> Année</label>
                                <input
                                    type="number"
                                    name="Annee"
                                    value={formData.Annee}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                                    required
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Target Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <FlagIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Détails de la Cible</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Type d'objectif</label>
                            <select
                                name="TypeObjectif"
                                value={formData.TypeObjectif}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                            >
                                <option>Chiffre d'affaires</option>
                                <option>Nouveaux Clients</option>
                                <option>Nombre de Rendez-vous</option>
                                <option>Validation Devis</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                                <CurrencyDollarIcon className="h-4 w-4" /> Valeur Cible (Montant ou Quantité)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="MontantCible"
                                    value={formData.MontantCible}
                                    onChange={handleChange}
                                    placeholder="Ex: 50000"
                                    className="w-full pl-4 pr-12 py-4 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-black text-xl text-primary-600"
                                    required
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-black text-gray-300">
                                    {formData.TypeObjectif.includes('affaires') ? 'TND' : 'UNIT'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="px-8 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all font-bold"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center gap-2 font-bold"
                    >
                        {saving ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckIcon className="h-5 w-5" />}
                        Enregistrer l'Objectif
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ObjectifForm;
