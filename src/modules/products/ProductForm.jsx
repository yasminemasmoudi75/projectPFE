import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeftIcon, CheckIcon, ArchiveBoxIcon,
    TagIcon, CurrencyDollarIcon, PhotoIcon,
    ChevronDownIcon, SparklesIcon, PlusIcon, TrashIcon,
    CubeIcon, ExclamationTriangleIcon, BuildingStorefrontIcon,
    ScaleIcon, HashtagIcon, SwatchIcon, PencilSquareIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import { getImageUrl } from '../../utils/imageUrl';

/* ── helpers ── */
const toNum = (v, fb = 0) => { const n = parseFloat(v); return isFinite(n) ? Math.max(0, n) : fb; };

/* ── shared styles (module-level so they never change reference) ── */
const INP = 'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#0062AF]/60 focus:ring-2 focus:ring-[#0062AF]/8 transition-all placeholder:text-slate-300 font-medium';
const LBL = 'block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5';

/* ── Field wrapper (outside ProductForm to avoid remount on every keystroke) ── */
const Field = ({ label, required, hint, children }) => (
    <div>
        <label className={LBL}>
            {label}{required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
        {children}
        {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
);

/* ── PriceField card (outside ProductForm — receives handlers as props) ── */
const PriceField = ({ label, name, value, color, textColor, suffix = 'TND', readOnly, computed, onChange, onKeyDown, onPaste }) => (
    <div className={`bg-white rounded-2xl border ${readOnly ? 'border-slate-100' : 'border-slate-200'} shadow-sm overflow-hidden`}>
        <div className={`h-1 ${color}`} />
        <div className="px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{label}</p>
            {readOnly ? (
                <p className={`text-xl font-black tabular-nums leading-none ${textColor}`}>{computed}</p>
            ) : (
                <input
                    type="number" name={name} value={value}
                    min="0" step="0.001"
                    onChange={onChange}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                    className={`w-full text-xl font-black bg-transparent border-none outline-none p-0 tabular-nums leading-none ${textColor} placeholder:text-slate-200`}
                    placeholder="0.000"
                />
            )}
            <p className="text-xs text-slate-400 mt-1.5 font-medium">{suffix}</p>
        </div>
    </div>
);

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [saving, setSaving] = useState(false);
    const [collections, setCollections] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [showVariants, setShowVariants] = useState(false);
    const [variants, setVariants] = useState([]);
    const [imgZoom, setImgZoom] = useState(false);

    const [formData, setFormData] = useState({
        CodArt: '', LibArt: '', Collection: '', Marque: '',
        PrixVente: '0', PrixAchat: '0', Qte: '0', MinStk: '0',
        Tva: '19', Description: '', Unite: 'UNI',
        LibFam: '', LibFour: '', urlimg: '', imgArt: ''
    });

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const res = await axios.get('/categories/collections/all');
                const data = res?.data || res || [];
                setCollections(Array.isArray(data) ? data : []);
                if (!isEdit && Array.isArray(data) && data.length > 0)
                    setFormData(p => ({ ...p, Collection: data[0].Collection }));
            } catch { /* silently ignore */ }
        };
        fetchCollections();

        if (isEdit) {
            (async () => {
                try {
                    const [pRes, vRes] = await Promise.all([
                        axios.get(`/products/${id}`),
                        axios.get(`/products/${id}/variants`).catch(() => null),
                    ]);
                    const p = pRes?.data?.data || pRes?.data || {};
                    setFormData({
                        CodArt: p.CodArt || '', LibArt: p.LibArt || '',
                        Collection: p.Collection || '', Marque: p.Marque || '',
                        PrixVente: p.PrixVente ?? '0', PrixAchat: p.PrixAchat ?? '0',
                        Qte: p.Qte ?? '0', MinStk: p.MinStk ?? '0',
                        Tva: p.Tva ?? '19', Description: p.Description || '',
                        Unite: p.Unite || 'UNI', LibFam: p.LibFam || '',
                        LibFour: p.LibFour || '', urlimg: p.urlimg || '', imgArt: p.imgArt || ''
                    });
                    const rows = vRes?.data || vRes || [];
                    const varList = Array.isArray(rows) ? rows : [];
                    if (varList.length > 0) {
                        setVariants(varList.map(v => ({
                            CodArtD: v.CodArtD || '', CodColor: v.CodColor || '',
                            DesColor: v.DesColor || '', CodTaille: v.CodTaille || '',
                            Taille: v.Taille || '', Qte: String(v.Qte ?? '0'),
                        })));
                        setShowVariants(true);
                    }
                } catch {
                    toast.error('Erreur chargement produit');
                    navigate('/products');
                } finally { setLoading(false); }
            })();
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        if (type === 'file') {
            const file = files?.[0];
            if (file) {
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setPreviewUrl(reader.result);
                reader.readAsDataURL(file);
            }
            return;
        }
        setFormData(p => ({ ...p, [name]: value }));
    };

    const preventNeg = (e) => { if (e.key === '-') e.preventDefault(); };
    const preventNegPaste = (e) => {
        if ((e.clipboardData || window.clipboardData)?.getData('text')?.includes('-')) e.preventDefault();
    };
    const isVarCode = (f) => ['CodArtD', 'CodTaille'].includes(f);
    const sanitizeVar = (f, v) => isVarCode(f) ? String(v || '').replace(/-/g, '') : v;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.CodArt || !formData.LibArt) {
            toast.error('Code article et désignation sont obligatoires');
            return;
        }
        setSaving(true);
        const fData = new FormData();
        Object.entries({
            CodArt: formData.CodArt, LibArt: formData.LibArt,
            PrixVente: toNum(formData.PrixVente), PrixAchat: toNum(formData.PrixAchat),
            Qte: toNum(formData.Qte), MinStk: toNum(formData.MinStk),
            Tva: parseFloat(formData.Tva) || 0,
            Collection: formData.Collection, Marque: formData.Marque,
            Unite: formData.Unite, LibFam: formData.LibFam,
            LibFour: formData.LibFour, Description: formData.Description,
        }).forEach(([k, v]) => fData.append(k, v));

        if (selectedFile) fData.append('image', selectedFile);
        else fData.append('urlimg', formData.urlimg || '');

        try {
            let savedId = id;
            if (isEdit) {
                await axios.put(`/products/${id}`, fData);
                toast.success('Produit mis à jour');
            } else {
                const res = await axios.post('/products', fData);
                savedId = res?.data?.data?.IDArt || id;
                toast.success('Produit créé');
            }
            if (variants.length > 0 && savedId) {
                try {
                    await axios.post(`/products/${savedId}/variants`, {
                        variants: variants.map(v => ({ ...v, Qte: Math.max(0, Number(v.Qte) || 0) }))
                    });
                } catch { /* variants optional */ }
            }
            navigate('/products');
        } catch (err) {
            toast.error(err.response?.data?.message || (isEdit ? 'Erreur mise à jour' : 'Erreur création'));
        } finally { setSaving(false); }
    };

    if (loading) return <LoadingSpinner />;

    const imgSrc   = previewUrl || (formData.urlimg ? getImageUrl(formData.urlimg) : null);
    const prixTTC  = Number(formData.PrixVente) > 0
        ? (Number(formData.PrixVente) * (1 + Number(formData.Tva) / 100)).toFixed(3) : null;
    const isLowStock = Number(formData.Qte) > 0 && Number(formData.MinStk) > 0
        && Number(formData.Qte) <= Number(formData.MinStk);
    const stockPct = Number(formData.MinStk) > 0
        ? Math.min(100, Math.round((Number(formData.Qte) / Number(formData.MinStk)) * 100)) : null;
    const isReady  = !!(formData.CodArt && formData.LibArt);

    return (
        <form onSubmit={handleSubmit} className="animate-fade-in pb-20">

            {/* ── Sticky top bar ── */}
            <div className="sticky top-0 z-20 bg-white/96 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_0_0_rgba(226,232,240,0.8)] -mx-4 lg:-mx-8 px-4 lg:px-8 mb-6">
                <div className="max-w-5xl mx-auto py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <button type="button" onClick={() => navigate(-1)}
                            className="h-8 w-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-all group flex-shrink-0">
                            <ArrowLeftIcon className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div className="min-w-0">
                            <nav className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] font-bold text-[#0062AF]/60 uppercase tracking-widest">Produits</span>
                                <span className="text-slate-300">›</span>
                                <span className="text-[10px] text-slate-400">{isEdit ? 'Modifier' : 'Nouveau'}</span>
                            </nav>
                            <div className="flex items-center gap-2">
                                <h1 className="text-[15px] font-bold text-slate-900 truncate">
                                    {isEdit ? (formData.LibArt || 'Modifier le produit') : 'Nouveau produit'}
                                </h1>
                                {isEdit && formData.CodArt && (
                                    <code className="text-[10px] font-bold text-[#0062AF] bg-blue-50 border border-[#0062AF]/15 px-2 py-0.5 rounded-md hidden sm:block">
                                        {formData.CodArt}
                                    </code>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="hidden sm:flex">
                            {isReady
                                ? <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold rounded-lg">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Prêt
                                  </span>
                                : <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 text-amber-600 text-[11px] font-semibold rounded-lg">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />Incomplet
                                  </span>
                            }
                        </div>
                        <button type="button" onClick={() => navigate(-1)}
                            className="h-8 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                            Annuler
                        </button>
                        <button type="submit" disabled={saving || !isReady}
                            className="flex items-center gap-2 px-5 h-8 text-sm font-semibold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-lg shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                            {saving
                                ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                : <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" />
                            }
                            {isEdit ? 'Sauvegarder' : 'Créer le produit'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto space-y-5">

                {/* ══ HERO CARD ══ */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="h-0.5 bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />
                    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr]">

                        {/* ─ Image upload ─ */}
                        <div className="relative flex flex-col items-center justify-center min-h-[300px] border-b lg:border-b-0 lg:border-r border-slate-100 bg-gradient-to-br from-blue-50/40 via-slate-50 to-teal-50/20 overflow-hidden">
                            <div className="absolute inset-0 opacity-[0.03]"
                                style={{ backgroundImage: 'radial-gradient(circle,#94a3b8 1px,transparent 1px)', backgroundSize: '20px 20px' }} />

                            {imgSrc ? (
                                <>
                                    <motion.img
                                        key={imgSrc}
                                        initial={{ scale: 0.95, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        src={imgSrc} alt={formData.LibArt}
                                        onClick={() => setImgZoom(true)}
                                        className="relative z-10 w-60 h-60 object-contain hover:scale-105 transition-transform duration-500 drop-shadow-md cursor-zoom-in"
                                    />
                                    <label className="relative z-10 mt-4 cursor-pointer">
                                        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/90 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 hover:border-[#0062AF]/30 hover:text-[#0062AF] transition-all shadow-sm">
                                            <PencilSquareIcon className="h-3.5 w-3.5" />
                                            Changer l'image
                                        </span>
                                        <input type="file" accept="image/*" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                    </label>
                                </>
                            ) : (
                                <label className="relative z-10 flex flex-col items-center gap-4 cursor-pointer group p-8 text-center">
                                    <div className="h-20 w-20 rounded-2xl bg-white border-2 border-dashed border-slate-200 group-hover:border-[#0062AF]/40 group-hover:bg-blue-50/50 flex items-center justify-center transition-all shadow-sm">
                                        <PhotoIcon className="h-10 w-10 text-slate-300 group-hover:text-[#0062AF]/50 transition-colors" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500 group-hover:text-[#0062AF] transition-colors">Ajouter une image</p>
                                        <p className="text-xs text-slate-400 mt-0.5">JPG, PNG · max 5 Mo</p>
                                    </div>
                                    <input type="file" accept="image/*" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                </label>
                            )}
                        </div>

                        {/* ─ Form fields (right) ─ */}
                        <div className="p-7 flex flex-col gap-5">

                            {/* Code + Designation */}
                            <div className="grid grid-cols-[180px_1fr] gap-4 items-end">
                                <Field label="Code article" required>
                                    <div className="relative">
                                        <HashtagIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#0062AF]/50 pointer-events-none" />
                                        <input type="text" name="CodArt" value={formData.CodArt}
                                            onChange={handleChange} required
                                            className={`${INP} pl-8 font-mono text-[#0062AF] font-bold`}
                                            placeholder="MED-001" />
                                    </div>
                                </Field>
                                <Field label="Désignation" required>
                                    <input type="text" name="LibArt" value={formData.LibArt}
                                        onChange={handleChange} required
                                        className={`${INP} text-base font-bold text-slate-900`}
                                        placeholder="Nom complet du produit" />
                                </Field>
                            </div>

                            {/* Metadata row */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Field label="Collection">
                                    <select name="Collection" value={formData.Collection} onChange={handleChange} className={INP}>
                                        <option value="">— Sélectionner —</option>
                                        {collections.map((c, i) => (
                                            <option key={c.Collection ?? i} value={c.Collection || ''}>{c.Collection}</option>
                                        ))}
                                        {!collections.length && <option value="Divers">Divers</option>}
                                    </select>
                                </Field>
                                <Field label="Famille">
                                    <input type="text" name="LibFam" value={formData.LibFam}
                                        onChange={handleChange} className={INP} placeholder="Ex : Médicaments" />
                                </Field>
                                <Field label="Marque">
                                    <input type="text" name="Marque" value={formData.Marque}
                                        onChange={handleChange} className={INP} placeholder="Ex : BioPharm" />
                                </Field>
                            </div>

                            {/* Supplier + Unit */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Field label="Fournisseur">
                                    <div className="relative">
                                        <BuildingStorefrontIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                        <input type="text" name="LibFour" value={formData.LibFour}
                                            onChange={handleChange} className={`${INP} pl-8`} placeholder="Ex : Pharma Distribution" />
                                    </div>
                                </Field>
                                <Field label="Unité de mesure">
                                    <div className="relative">
                                        <ScaleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                                        <select name="Unite" value={formData.Unite} onChange={handleChange} className={`${INP} pl-8`}>
                                            <option value="UNI">Unité</option>
                                            <option value="KG">Kilogramme</option>
                                            <option value="L">Litre</option>
                                            <option value="M">Mètre</option>
                                            <option value="BOX">Boîte</option>
                                        </select>
                                    </div>
                                </Field>
                            </div>

                            {/* Description */}
                            <Field label="Description">
                                <textarea name="Description" value={formData.Description}
                                    onChange={handleChange} rows={3}
                                    className={`${INP} resize-none leading-relaxed`}
                                    placeholder="Caractéristiques, utilisation, composition…" />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* ══ PRICING ══  (same visual as detail PriceCards but editable) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <PriceField
                        label="Prix vente HT" name="PrixVente" value={formData.PrixVente}
                        color="bg-blue-300" textColor="text-blue-700"
                        onChange={handleChange} onKeyDown={preventNeg} onPaste={preventNegPaste} />
                    <PriceField
                        label="Prix achat HT" name="PrixAchat" value={formData.PrixAchat}
                        color="bg-slate-200" textColor="text-slate-600"
                        onChange={handleChange} onKeyDown={preventNeg} onPaste={preventNegPaste} />
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="h-1 bg-teal-300" />
                        <div className="px-4 py-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Taux TVA</p>
                            <select name="Tva" value={formData.Tva} onChange={handleChange}
                                className="w-full text-xl font-black bg-transparent border-none outline-none p-0 text-teal-700 cursor-pointer">
                                <option value="19">19 %</option>
                                <option value="7">7 %</option>
                                <option value="0">0 %</option>
                            </select>
                            <p className="text-xs text-slate-400 mt-1.5 font-medium">Taux appliqué</p>
                        </div>
                    </div>
                    <PriceField
                        label="Prix TTC (calculé)" name="_ttc" value=""
                        color={prixTTC ? 'bg-emerald-300' : 'bg-slate-100'}
                        textColor={prixTTC ? 'text-emerald-700' : 'text-slate-300'}
                        computed={prixTTC || '—'}
                        suffix="TND"
                        readOnly />
                </div>

                {/* ══ STOCK ══ (same visual as detail stock section but editable) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex">
                    <div className={`w-1 shrink-0 bg-gradient-to-b ${
                        isLowStock ? 'from-rose-300 to-rose-400'
                        : stockPct !== null && stockPct <= 60 ? 'from-amber-300 to-orange-300'
                        : 'from-teal-300 to-cyan-300'
                    }`} />
                    <div className="flex-1 px-6 py-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                                    isLowStock ? 'bg-rose-50 border-rose-200'
                                    : 'bg-amber-50 border-amber-200'
                                }`}>
                                    <ArchiveBoxIcon className={`h-5 w-5 ${isLowStock ? 'text-rose-400' : 'text-amber-500'}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">Gestion du stock</p>
                                    {isLowStock && (
                                        <p className="text-xs text-rose-500 font-semibold flex items-center gap-1 mt-0.5">
                                            <ExclamationTriangleIcon className="h-3 w-3" />
                                            Stock critique — en dessous du seuil minimum
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1 max-w-md">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Quantité
                                    </label>
                                    <div className="relative">
                                        <input type="number" min="0" name="Qte" value={formData.Qte}
                                            onChange={handleChange} onKeyDown={preventNeg} onPaste={preventNegPaste}
                                            className={`w-full px-3 py-2 bg-white border rounded-xl text-sm font-bold tabular-nums focus:outline-none focus:ring-2 transition-all ${
                                                isLowStock
                                                    ? 'text-rose-500 border-rose-200 focus:border-rose-400 focus:ring-rose-500/10'
                                                    : 'text-slate-800 border-slate-200 focus:border-[#0062AF]/60 focus:ring-[#0062AF]/8'
                                            }`}
                                            placeholder="0" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Seuil min.
                                    </label>
                                    <input type="number" min="0" name="MinStk" value={formData.MinStk}
                                        onChange={handleChange} onKeyDown={preventNeg} onPaste={preventNegPaste}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#0062AF]/60 focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
                                        placeholder="0" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                        Unité
                                    </label>
                                    <select name="Unite" value={formData.Unite} onChange={handleChange}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:border-[#0062AF]/60 focus:ring-2 focus:ring-[#0062AF]/8 transition-all">
                                        <option value="UNI">Unité</option>
                                        <option value="KG">KG</option>
                                        <option value="L">Litre</option>
                                        <option value="M">Mètre</option>
                                        <option value="BOX">Boîte</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {stockPct !== null && (
                            <div className="mt-4">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${stockPct}%` }}
                                        transition={{ duration: 0.8, ease: 'easeOut' }}
                                        className={`h-full rounded-full ${
                                            stockPct <= 30 ? 'bg-rose-400'
                                            : stockPct <= 60 ? 'bg-amber-400'
                                            : 'bg-teal-400'
                                        }`}
                                    />
                                </div>
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-slate-400">0</span>
                                    <span className={`text-[10px] font-bold ${isLowStock ? 'text-rose-500' : 'text-slate-400'}`}>
                                        {stockPct}% · seuil : {formData.MinStk} {formData.Unite}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ══ VARIANTS ══ */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {!showVariants && <div className="h-0.5 bg-gradient-to-r from-emerald-500 to-teal-400" />}
                    <button type="button" onClick={() => setShowVariants(v => !v)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-all text-left">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
                                <SwatchIcon className="h-[18px] w-[18px] text-white" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-slate-800">Variantes</span>
                                    {variants.length > 0 && (
                                        <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full">
                                            {variants.length}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400">Tailles, couleurs — optionnel</p>
                            </div>
                        </div>
                        <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${showVariants ? 'bg-slate-200' : 'bg-slate-100'}`}>
                            <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showVariants ? 'rotate-180' : ''}`} />
                        </div>
                    </button>

                    <AnimatePresence>
                        {showVariants && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                            >
                                <div className="border-t border-slate-100 p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                            {variants.length} variante{variants.length !== 1 ? 's' : ''}
                                        </p>
                                        <button type="button"
                                            onClick={() => setVariants(p => [...p, { CodArtD: '', CodColor: '', DesColor: '', CodTaille: '', Taille: '', Qte: '0' }])}
                                            className="inline-flex items-center gap-1.5 h-7 px-3 bg-[#0062AF] hover:bg-[#004a85] text-white text-xs font-semibold rounded-lg transition-all">
                                            <PlusIcon className="h-3.5 w-3.5" /> Ajouter
                                        </button>
                                    </div>

                                    {variants.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10 gap-3 border-2 border-dashed border-slate-100 rounded-2xl text-center">
                                            <SwatchIcon className="h-8 w-8 text-slate-200" />
                                            <p className="text-sm text-slate-400">Aucune variante configurée</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-xl border border-slate-200 overflow-hidden overflow-x-auto">
                                            <table className="w-full text-xs min-w-[600px]">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200">
                                                        {['Code variante', 'Code couleur', 'Désignation', 'Taille', 'Code taille', 'Qté', ''].map((h, i) => (
                                                            <th key={i} className="px-3 py-2.5 text-left text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {variants.map((v, i) => (
                                                        <tr key={i} className="hover:bg-blue-50/20 transition-colors">
                                                            {['CodArtD', 'CodColor', 'DesColor', 'Taille', 'CodTaille'].map(field => (
                                                                <td key={field} className="px-3 py-2">
                                                                    <input type="text" value={v[field]}
                                                                        onChange={e => {
                                                                            const u = [...variants];
                                                                            u[i] = { ...u[i], [field]: sanitizeVar(field, e.target.value) };
                                                                            setVariants(u);
                                                                        }}
                                                                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:border-[#0062AF]/50 focus:ring-1 focus:ring-[#0062AF]/10 focus:outline-none transition-all"
                                                                        placeholder="—"
                                                                    />
                                                                </td>
                                                            ))}
                                                            <td className="px-3 py-2">
                                                                <input type="number" value={v.Qte} min="0"
                                                                    onKeyDown={preventNeg} onPaste={preventNegPaste}
                                                                    onChange={e => {
                                                                        const u = [...variants];
                                                                        u[i] = { ...u[i], Qte: e.target.value === '' ? '' : String(Math.max(0, Number(e.target.value) || 0)) };
                                                                        setVariants(u);
                                                                    }}
                                                                    className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#0062AF] text-center focus:border-[#0062AF]/50 focus:outline-none"
                                                                />
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <button type="button"
                                                                    onClick={() => setVariants(p => p.filter((_, idx) => idx !== i))}
                                                                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                                                                    <TrashIcon className="h-3.5 w-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Bottom CTA */}
                <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => navigate(-1)}
                        className="h-10 px-6 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        Annuler
                    </button>
                    <button type="submit" disabled={saving || !isReady}
                        className="flex items-center gap-2 h-10 px-8 text-sm font-bold text-white bg-[#0062AF] hover:bg-[#004a85] rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95">
                        {saving
                            ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            : <CheckIcon className="h-4 w-4 stroke-[2.5]" />
                        }
                        {isEdit ? 'Sauvegarder les modifications' : 'Créer le produit'}
                    </button>
                </div>
            </div>

            {/* ── Lightbox image ── */}
            <AnimatePresence>
                {imgZoom && imgSrc && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setImgZoom(false)}
                        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-8 cursor-zoom-out"
                    >
                        <motion.div
                            initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }}
                            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                            className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <img src={imgSrc} alt={formData.LibArt} className="max-w-full max-h-[65vh] object-contain" />
                            <p className="text-center text-sm text-slate-400 mt-4 font-medium">{formData.LibArt}</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </form>
    );
};

export default ProductForm;
