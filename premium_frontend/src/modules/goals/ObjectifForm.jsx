import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    ArrowLeftIcon,
    CheckIcon,
    UserIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    FlagIcon,
    QueueListIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { createObjectif, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';
import { useParams } from 'react-router-dom';

const ObjectifForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Pour détecter le mode édition
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const isEditMode = !!id; // Mode édition si un ID est présent

    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        ID_Utilisateur: location.state?.objectif?.ID_Utilisateur || location.state?.selectedUserId || user?.UserID || '',
        Mois: location.state?.objectif?.Mois || location.state?.selectedMonth || new Date().getMonth() + 1,
        Annee: location.state?.objectif?.Annee || location.state?.selectedYear || new Date().getFullYear(),
        Semaine: location.state?.objectif?.Semaine || '',
        DateDebut: location.state?.objectif?.DateDebut || '',
        DateFin: location.state?.objectif?.DateFin || '',
        TypeObjectif: location.state?.objectif?.TypeObjectif || "Chiffre d'affaires",
        MontantCible: location.state?.objectif?.MontantCible || '',
        Montant_Realise_Actuel: location.state?.objectif?.Montant_Realise_Actuel || '',
        Libelle_Indicateur: location.state?.objectif?.Libelle_Indicateur || '',
        Statut: location.state?.objectif?.Statut || 'En cours'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes] = await Promise.all([
                    axios.get('/users')
                ]);
                setUsers(usersRes?.data ?? usersRes ?? []);

                // If we didn't have an ID_Utilisateur yet, try to set it from the fetched users
                if (!formData.ID_Utilisateur && usersRes.data?.length > 0) {
                    setFormData(prev => ({ ...prev, ID_Utilisateur: usersRes.data[0].UserID }));
                }
            } catch (error) {
                console.error('Error fetching form data:', error);
                toast.error('Erreur lors du chargement des données');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const objectifData = {
                ...formData,
                Mois: parseInt(formData.Mois),
                Annee: parseInt(formData.Annee),
                MontantCible: parseFloat(formData.MontantCible),
                Montant_Realise_Actuel: parseFloat(formData.Montant_Realise_Actuel || 0)
            };

            if (isEditMode) {
                // Mode édition
                await dispatch(updateObjectif({
                    id,
                    data: objectifData
                })).unwrap();
                toast.success('Objectif modifié avec succès');
            } else {
                // Mode création
                await dispatch(createObjectif(objectifData)).unwrap();
                toast.success('Objectif créé avec succès');
            }

            // Naviguer avec un timestamp pour forcer le rechargement
            navigate('/objectifs', {
                state: {
                    selectedUserId: formData.ID_Utilisateur,
                    selectedMonth: parseInt(formData.Mois),
                    selectedYear: parseInt(formData.Annee),
                    refresh: Date.now()
                }
            });
        } catch (error) {
            console.error('Error saving objective:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
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
                    {isEditMode ? 'Modifier l\'Objectif' : 'Définir un Nouvel Objectif'}
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
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none appearance-none cursor-pointer font-bold"
                                required
                            >
                                <option value="">--- Choisir un commercial ---</option>
                                {users.map(u => (
                                    <option key={u.UserID} value={u.UserID}>{u.FullName || u.LoginName}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
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
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><FlagIcon className="h-4 w-4" /> Semaine</label>
                                <input
                                    type="text"
                                    name="Semaine"
                                    value={formData.Semaine}
                                    onChange={handleChange}
                                    placeholder="Ex: S1"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dates de l’Objectif */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Dates de l’Objectif</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Date Début</label>
                            <input
                                type="date"
                                name="DateDebut"
                                value={formData.DateDebut}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Date Fin</label>
                            <input
                                type="date"
                                name="DateFin"
                                value={formData.DateFin}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                            />
                        </div>
                    </div>
                </div>

                {/* Détails Supplémentaires */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <TagIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Informations Complémentaires</h2>
                    </div>
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><QueueListIcon className="h-4 w-4" /> Libellé Indicateur</label>
                            <input
                                type="text"
                                name="Libelle_Indicateur"
                                value={formData.Libelle_Indicateur}
                                onChange={handleChange}
                                placeholder="Ex: CA Mensuel Hors Taxes"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><FlagIcon className="h-4 w-4" /> Statut</label>
                            <select
                                name="Statut"
                                value={formData.Statut}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                            >
                                <option value="En cours">En cours</option>
                                <option value="Atteint">Atteint</option>
                                <option value="Non atteint">Non atteint</option>
                                <option value="Annulé">Annulé</option>
                            </select>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    <option>Volume de Ventes</option>
                                    <option>Marge Brute</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                                    <CurrencyDollarIcon className="h-4 w-4" /> Valeur Cible
                                </label>
                                <input
                                    type="number"
                                    name="MontantCible"
                                    value={formData.MontantCible}
                                    onChange={handleChange}
                                    placeholder="Ex: 50000"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-black text-xl text-primary-600"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600 flex items-center gap-1.5">
                                    <CurrencyDollarIcon className="h-4 w-4" /> Réalisé Actuel (Initial)
                                </label>
                                <input
                                    type="number"
                                    name="Montant_Realise_Actuel"
                                    value={formData.Montant_Realise_Actuel}
                                    onChange={handleChange}
                                    placeholder="Ex: 0"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold"
                                />
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
                        {isEditMode ? 'Modifier l\'Objectif' : 'Enregistrer l\'Objectif'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ObjectifForm;
