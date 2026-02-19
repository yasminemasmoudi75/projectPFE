import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    ChatBubbleLeftEllipsisIcon,
    UserCircleIcon,
    ExclamationTriangleIcon,
    TagIcon,
    InformationCircleIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const ClaimForm = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Simulation de données clients (Tiers)
    const CLIENTS = [
        { CodTiers: 'CLI001', LibTiers: 'Société ABC' },
        { CodTiers: 'CLI002', LibTiers: 'Tech Solutions' },
        { CodTiers: 'CLI003', LibTiers: 'Global Import' },
        { CodTiers: 'CLI004', LibTiers: 'Pharma Plus' }
    ];

    const [formData, setFormData] = useState({
        CodTiers: '',
        LibTiers: '',
        Objet: '',
        Description: '',
        Priorite: 'Moyenne',
        TypeReclamation: 'Technique'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'CodTiers') {
            const client = CLIENTS.find(c => c.CodTiers === value);
            setFormData(prev => ({
                ...prev,
                CodTiers: value,
                LibTiers: client ? client.LibTiers : ''
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSaving(true);
        // Simulation API POST /api/reclamations
        setTimeout(() => {
            toast.success('Réclamation enregistrée avec succès');
            setSaving(false);
            navigate('/claims');
        }, 1000);
    };

    if (loading) return <LoadingSpinner />;

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
                    Nouveau Ticket de Réclamation
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Client Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <UserCircleIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Identification Client</h2>
                    </div>
                    <div className="p-8 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 italic">Sélectionner le Client concerné</label>
                            <select
                                name="CodTiers"
                                value={formData.CodTiers}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all appearance-none cursor-pointer font-bold"
                                required
                            >
                                <option value="">--- Choisir un client ---</option>
                                {CLIENTS.map(c => (
                                    <option key={c.CodTiers} value={c.CodTiers}>{c.LibTiers} ({c.CodTiers})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Détails de la Réclamation</h2>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Objet / Titre du ticket</label>
                            <input
                                type="text"
                                name="Objet"
                                value={formData.Objet}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold"
                                placeholder="Résumez le problème brièvement"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1">
                                    <TagIcon className="h-4 w-4" /> Type de Réclamation
                                </label>
                                <select
                                    name="TypeReclamation"
                                    value={formData.TypeReclamation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all"
                                >
                                    <option>Technique</option>
                                    <option>Commercial</option>
                                    <option>Livraison / Stock</option>
                                    <option>Facturation</option>
                                    <option>Qualité Produit</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1">
                                    <ExclamationTriangleIcon className="h-4 w-4" /> Priorité
                                </label>
                                <select
                                    name="Priorite"
                                    value={formData.Priorite}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all font-bold text-primary-600"
                                >
                                    <option>Basse</option>
                                    <option>Moyenne</option>
                                    <option>Haute</option>
                                    <option>Urgente</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Description complète du problème</label>
                            <textarea
                                name="Description"
                                value={formData.Description}
                                onChange={handleChange}
                                rows="5"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none transition-all resize-none"
                                placeholder="Détaillez le problème rencontré par le client, les étapes à reproduire, etc."
                                required
                            ></textarea>
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
                        Ouvrir le Ticket
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ClaimForm;
