import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    ArrowLeftIcon,
    CheckIcon,
    PlusIcon,
    TrashIcon,
    CalculatorIcon,
    DocumentTextIcon,
    UserIcon,
    CurrencyDollarIcon,
    SparklesIcon,
    UserGroupIcon,
    MapPinIcon,
    IdentificationIcon,
    BuildingOfficeIcon,
    ArrowPathIcon,
    TagIcon
} from '@heroicons/react/24/outline';
import { createDevis, fetchDevisById, updateDevis } from './devisSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const DevisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const isEdit = Boolean(id);
    const { currentDevis, loading: loadingDevis } = useSelector((state) => state.devis);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);

    // Form State matching TabDevm structure
    const [formData, setFormData] = useState({
        Prfx: 'DV',
        CodTiers: '',
        LibTiers: '',
        Adresse: '',
        Ville: '',
        Cin: '',
        Remarq: '',
        TotHT: 0,
        TotTva: 0,
        TotRem: 0,
        Timbre: 1.000,
        TotTTC: 0,
        Devise: 'TND',
        Cours: 1,
        DesRepres: '',
        IDContact: '',
    });

    // Mock items for the quote (TabDevd structure)
    const [items, setItems] = useState([
        { id: Date.now(), CodArt: '', LibArt: '', Qt: 1, PuHT: 0, Tva: 19 }
    ]);

    useEffect(() => {
        if (isEdit && id) {
            dispatch(fetchDevisById(id));
        }
    }, [id, isEdit, dispatch]);

    useEffect(() => {
        if (isEdit && currentDevis) {
            setFormData({
                ...currentDevis,
            });
            setLoading(false);
        }
    }, [currentDevis, isEdit]);

    // Recalculate totals whenever items or discounts change
    useEffect(() => {
        const subTotal = items.reduce((sum, item) => sum + (item.Qt * item.PuHT), 0);
        const totalTva = items.reduce((sum, item) => sum + (item.Qt * item.PuHT * (item.Tva / 100)), 0);
        const totalTTC = subTotal + totalTva - formData.TotRem + formData.Timbre;

        setFormData(prev => ({
            ...prev,
            TotHT: subTotal,
            TotTva: totalTva,
            NetHT: subTotal - formData.TotRem,
            TotTTC: totalTTC
        }));
    }, [items, formData.TotRem, formData.Timbre]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addItem = () => {
        setItems([...items, { id: Date.now(), CodArt: '', LibArt: '', Qt: 1, PuHT: 0, Tva: 19 }]);
    };

    const removeItem = (id) => {
        if (items.length > 1) {
            setItems(items.filter(item => item.id !== id));
        }
    };

    const handleItemChange = (id, field, value) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isEdit) {
                await dispatch(updateDevis({ id, data: formData })).unwrap();
                toast.success('Devis mis à jour');
            } else {
                await dispatch(createDevis(formData)).unwrap();
                toast.success('Devis créé avec succès');
            }
            navigate('/devis');
        } catch (err) {
            toast.error('Une erreur est survenue');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="animate-fade-in space-y-8 pb-20">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate('/devis')}
                        className="h-11 w-11 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-300 rounded-xl transition-all shadow-soft flex items-center justify-center"
                        title="Retour"
                    >
                        <ArrowLeftIcon className="h-5 w-5 stroke-[2.5]" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="badge badge-primary">
                                <DocumentTextIcon className="h-3 w-3 mr-1" />
                                Ventes & Offres
                            </span>
                        </div>
                        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                            {isEdit ? `Modification Devis N°${formData.Nf}` : 'Nouvelle Proposition Commerciale'}
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 transition-all shadow-soft"
                    >
                        <ArrowPathIcon className="h-5 w-5" />
                    </button>
                    <button
                        form="devis-form"
                        type="submit"
                        disabled={saving}
                        className="btn-soft-primary flex items-center gap-2 px-8"
                    >
                        {saving ? (
                            <div className="h-4 w-4 border-2 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
                        ) : (
                            <CheckIcon className="h-4 w-4 stroke-[3]" />
                        )}
                        {isEdit ? 'Mettre à jour' : 'Finaliser le Devis'}
                    </button>
                </div>
            </div>

            <form id="devis-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
                {/* Left: General & Items */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Client Info Card */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue scale-90">
                                    <UserGroupIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Informations Client</h2>
                            </div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">Étape 1 sur 2</span>
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Code Client (ID)</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <IdentificationIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="CodTiers"
                                        value={formData.CodTiers}
                                        onChange={handleChange}
                                        placeholder="CLI-0000"
                                        className="input-modern pl-11 font-mono uppercase"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Raison Sociale</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <BuildingOfficeIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="LibTiers"
                                        value={formData.LibTiers}
                                        onChange={handleChange}
                                        placeholder="Nom de l'entreprise..."
                                        className="input-modern pl-11"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2 group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Adresse Complète</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <MapPinIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Adresse"
                                        value={formData.Adresse}
                                        onChange={handleChange}
                                        placeholder="Siège social, Rue, Code Postal..."
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Commercial Assisgné</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <UserIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="DesRepres"
                                        value={formData.DesRepres}
                                        onChange={handleChange}
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                            <div className="group">
                                <label className="label-modern italic tracking-[0.2em] mb-2 px-1">Gouvernorat / Ville</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <TagIcon className="h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        name="Ville"
                                        value={formData.Ville}
                                        onChange={handleChange}
                                        className="input-modern pl-11"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Card */}
                    <div className="card-luxury p-0 overflow-hidden">
                        <div className="px-8 py-5 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-success shadow-glow-emerald scale-90">
                                    <PlusIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Articles & Détails</h2>
                            </div>
                            <button
                                type="button"
                                onClick={addItem}
                                className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all border border-blue-100 shadow-soft"
                            >
                                + Ajouter Ligne
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-4 pl-8">Désignation</th>
                                        <th className="px-4 py-4 w-20 text-center">Qté</th>
                                        <th className="px-4 py-4 w-32 text-right">P.U HT</th>
                                        <th className="px-4 py-4 w-24 text-center">TVA</th>
                                        <th className="px-4 py-4 w-32 text-right">Total HT</th>
                                        <th className="px-8 py-4 w-10 pr-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/50">
                                    {items.map((item) => (
                                        <tr key={item.id} className="group hover:bg-blue-50/20 transition-all">
                                            <td className="px-8 py-5">
                                                <input
                                                    type="text"
                                                    value={item.LibArt}
                                                    onChange={(e) => handleItemChange(item.id, 'LibArt', e.target.value)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:italic"
                                                    placeholder="Désignation produit ou service..."
                                                />
                                            </td>
                                            <td className="px-4 py-5">
                                                <input
                                                    type="number"
                                                    value={item.Qt}
                                                    onChange={(e) => handleItemChange(item.id, 'Qt', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-black text-blue-600 text-center"
                                                />
                                            </td>
                                            <td className="px-4 py-5">
                                                <input
                                                    type="number"
                                                    value={item.PuHT}
                                                    onChange={(e) => handleItemChange(item.id, 'PuHT', parseFloat(e.target.value) || 0)}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-sm font-bold text-slate-700 text-right"
                                                />
                                            </td>
                                            <td className="px-4 py-5">
                                                <select
                                                    value={item.Tva}
                                                    onChange={(e) => handleItemChange(item.id, 'Tva', parseInt(e.target.value))}
                                                    className="w-full bg-transparent border-none focus:ring-0 p-0 text-xs font-bold text-slate-400 text-center cursor-pointer hover:text-blue-500 transition-colors"
                                                >
                                                    <option value="19">19%</option>
                                                    <option value="13">13%</option>
                                                    <option value="7">7%</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-5 text-sm font-black text-slate-800 text-right">
                                                {(item.Qt * item.PuHT).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-slate-300 hover:text-rose-500 transition-colors transform group-hover:scale-110"
                                                >
                                                    <TrashIcon className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-8 border-t border-slate-100/50 bg-slate-50/30">
                            <div className="flex items-center gap-3 text-slate-400">
                                <SparklesIcon className="h-4 w-4 text-blue-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Le moteur Nexus AI propose des articles associés lors de la saisie</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Totals & Submit */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="card-luxury p-0 overflow-hidden sticky top-8">
                        <div className="px-8 py-6 border-b border-slate-100/50 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue scale-90">
                                    <CalculatorIcon className="h-5 w-5 text-white" />
                                </div>
                                <h2 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Résumé Financier</h2>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100 border-dashed">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Base HT</span>
                                    <span className="text-sm font-bold text-slate-700">{formData.TotHT.toLocaleString(undefined, { minimumFractionDigits: 3 })} <span className="text-[10px]">TND</span></span>
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 inline-block px-1">Remise Exceptionnelle</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <CurrencyDollarIcon className="h-4 w-4 text-rose-400" />
                                        </div>
                                        <input
                                            type="number"
                                            name="TotRem"
                                            value={formData.TotRem}
                                            onChange={handleChange}
                                            className="input-modern pl-11 text-right font-black text-rose-600 border-rose-100 bg-rose-50/20 focus:ring-rose-200"
                                            placeholder="0.000"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TVA Consolidée</span>
                                    <span className="text-sm font-bold text-slate-600">{formData.TotTva.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                                </div>
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Droit de Timbre</span>
                                    <span className="text-sm font-bold text-slate-600">{formData.Timbre.toLocaleString(undefined, { minimumFractionDigits: 3 })} TND</span>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Net à Payer (TTC)</span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-black text-slate-800 tracking-tighter">
                                        {formData.TotTTC.toLocaleString(undefined, { minimumFractionDigits: 3 })}
                                    </span>
                                    <span className="text-sm font-black text-slate-400 uppercase">TND</span>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-5 bg-gradient-blue text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {saving ? (
                                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CheckIcon className="h-5 w-5 stroke-[3]" />
                                        Confirmer & Enregistrer
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="p-6 bg-slate-800 text-white overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <SparklesIcon className="h-16 w-16" />
                            </div>
                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Analyse IA Temps Réel</span>
                                </div>
                                <p className="text-[11px] font-medium text-slate-400 leading-relaxed">
                                    Estimation de succès : <span className="text-white font-bold">78% de conversion</span>. Le montant est cohérent avec l'historique de ce client.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default DevisForm;
