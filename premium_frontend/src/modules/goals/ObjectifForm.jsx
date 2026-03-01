import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeftIcon, CheckIcon, UserIcon, CalendarIcon, FlagIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { createObjectif, updateObjectif } from './objectifSlice';
import axios from '../../app/axios';
import { useParams } from 'react-router-dom';

const ObjectifForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams();
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);
    const isEditMode = !!id;
    const [users, setUsers] = useState([]);

    const [formData, setFormData] = useState({
        ID_Utilisateur: location.state?.objectif?.ID_Utilisateur || location.state?.selectedUserId || user?.UserID || '',
        Mois: location.state?.objectif?.Mois || location.state?.selectedMonth || new Date().getMonth() + 1,
        Annee: location.state?.objectif?.Annee || location.state?.selectedYear || new Date().getFullYear(),
        Semaine: location.state?.objectif?.Semaine || '',
        DateDebut: location.state?.objectif?.DateDebut || '',
        DateFin: location.state?.objectif?.DateFin || '',
        TypeObjectif: location.state?.objectif?.TypeObjectif || "Chiffre d'affaires",
        TypePeriode: location.state?.objectif?.TypePeriode || location.state?.typePeriode || 'Mensuel',
        MontantCible: location.state?.objectif?.MontantCible || '',
        Montant_Realise_Actuel: location.state?.objectif?.Montant_Realise_Actuel || '',
        Libelle_Indicateur: location.state?.objectif?.Libelle_Indicateur || '',
        Statut: location.state?.objectif?.Statut || 'En cours'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const usersRes = await axios.get('/users');
                setUsers(usersRes?.data ?? usersRes ?? []);
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
            // Safe year calculation
            let calculatedYear = null;
            if (formData.TypePeriode === 'Mensuel') {
                calculatedYear = parseInt(formData.Annee) || null;
            } else if (formData.DateDebut) {
                const d = new Date(formData.DateDebut);
                if (!isNaN(d.getTime())) {
                    calculatedYear = d.getFullYear();
                }
            }

            const objectifData = {
                ...formData,
                Mois: formData.TypePeriode === 'Mensuel' ? (parseInt(formData.Mois) || null) : null,
                Annee: calculatedYear,
                MontantCible: parseFloat(formData.MontantCible) || 0,
                Montant_Realise_Actuel: parseFloat(formData.Montant_Realise_Actuel || 0)
            };

            if (isEditMode) {
                await dispatch(updateObjectif({ id, data: objectifData })).unwrap();
                toast.success('Objectif modifié avec succès');
            } else {
                await dispatch(createObjectif(objectifData)).unwrap();
                toast.success('Objectif créé avec succès');
            }

            navigate('/objectifs');
        } catch (error) {
            console.error('Error saving objectif:', error);
            toast.error(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100 font-bold text-sm">
                    <ArrowLeftIcon className="h-5 w-5 mr-1" />
                    Annuler
                </button>
                <h1 className="text-2xl font-black text-slate-800 border-l-4 border-primary-600 pl-4">
                    {isEditMode ? 'Modifier l\'Objectif' : 'Définir un Nouvel Objectif'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type de Période */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Type d'Objectif</h2>
                    </div>
                    <div className="p-8">
                        <div className="flex gap-4">
                            <label className="flex-1 cursor-pointer">
                                <input type="radio" name="TypePeriode" value="Mensuel" checked={formData.TypePeriode === 'Mensuel'} onChange={handleChange} className="sr-only peer" />
                                <div className="p-6 rounded-2xl border-2 border-gray-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
                                    <h3 className="font-bold text-lg text-gray-800 mb-1">Objectif Mensuelle</h3>
                                    <p className="text-sm text-gray-500">Cible stratégique globale pour le mois</p>
                                </div>
                            </label>
                            <label className="flex-1 cursor-pointer">
                                <input type="radio" name="TypePeriode" value="Hebdomadaire" checked={formData.TypePeriode === 'Hebdomadaire'} onChange={handleChange} className="sr-only peer" />
                                <div className="p-6 rounded-2xl border-2 border-gray-200 peer-checked:border-green-500 peer-checked:bg-green-50 transition-all">
                                    <h3 className="font-bold text-lg text-gray-800 mb-1">Objectif hebdomadaire</h3>
                                    <p className="text-sm text-gray-500">Déclinaison opérationnelle par semaine</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Commercial */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Commercial</h2>
                    </div>
                    <div className="p-8">
                        <label className="text-sm font-bold text-gray-600">Assigner à quel commercial ?</label>
                        <select name="ID_Utilisateur" value={formData.ID_Utilisateur} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 mt-2 font-bold" required>
                            <option value="">--- Choisir un commercial ---</option>
                            {users.map(u => <option key={u.UserID} value={u.UserID}>{u.FullName || u.LoginName}</option>)}
                        </select>
                    </div>
                </div>

                {/* Période - Conditionnel selon le type */}
                {formData.TypePeriode === 'Mensuel' ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary-600" />
                            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Mois & Année</h2>
                        </div>
                        <div className="p-8 grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Mois</label>
                                <select name="Mois" value={formData.Mois} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" required>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('fr', { month: 'long' })}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Année</label>
                                <input type="number" name="Annee" value={formData.Annee} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" required />
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary-600" />
                            <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Objectif Hebdomadaire</h2>
                        </div>
                        <div className="p-8 grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Semaine / Période</label>
                                <input type="text" name="Semaine" value={formData.Semaine} onChange={handleChange} placeholder="Semaine 1" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Date Début</label>
                                <input type="date" name="DateDebut" value={formData.DateDebut ? new Date(formData.DateDebut).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-600">Date Fin</label>
                                <input type="date" name="DateFin" value={formData.DateFin ? new Date(formData.DateFin).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" required />
                            </div>
                        </div>
                    </div>
                )}

                {/* Objectifs */}
                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-8 py-4 border-b border-gray-100 flex items-center gap-2">
                        <FlagIcon className="h-5 w-5 text-primary-600" />
                        <h2 className="font-bold text-gray-700 uppercase tracking-wider text-xs">
                            {formData.TypePeriode === 'Mensuel' ? 'Objectifs Mensuels' : 'Objectifs Hebdomadaires'}
                        </h2>
                    </div>
                    <div className="p-8 grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Libellé de l'objectif</label>
                            <input type="text" name="Libelle_Indicateur" value={formData.Libelle_Indicateur} onChange={handleChange} placeholder="Description de l'objectif" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Montant Cible (DT)</label>
                            <input type="number" step="0.01" name="MontantCible" value={formData.MontantCible} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Montant Réalisé (DT)</label>
                            <input type="number" step="0.01" name="Montant_Realise_Actuel" value={formData.Montant_Realise_Actuel} onChange={handleChange} placeholder="0.00" className="w-full px-4 py-3 rounded-xl border border-gray-200 font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-600">Avancement Estimé (%)</label>
                            <div className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 font-bold text-gray-500 flex items-center justify-between">
                                <span>
                                    {formData.MontantCible && Number(formData.MontantCible) > 0 
                                        ? Math.round((Number(formData.Montant_Realise_Actuel || 0) / Number(formData.MontantCible)) * 100)
                                        : 0} %
                                </span>
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                     <div 
                                        className="h-full bg-blue-500" 
                                        style={{ width: `${Math.min((Number(formData.Montant_Realise_Actuel || 0) / Number(formData.MontantCible || 1)) * 100, 100)}%` }}
                                     />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Boutons */}
                <div className="flex items-center justify-end gap-4 pt-6">
                    <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-all">
                        Annuler
                    </button>
                    <button type="submit" disabled={saving} className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold hover:shadow-lg transition-all flex items-center gap-2">
                        {saving ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Créer')}
                        <CheckIcon className="h-5 w-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ObjectifForm;

