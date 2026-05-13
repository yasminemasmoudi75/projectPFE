import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon, CheckIcon, ChatBubbleLeftEllipsisIcon,
  UserCircleIcon, ExclamationTriangleIcon, TagIcon,
  CheckCircleIcon, BoltIcon, ShieldCheckIcon,
  MagnifyingGlassIcon, LifebuoyIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';

/* ── shared input class ── */
const inputCls = 'w-full h-11 px-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 focus:bg-white text-slate-700 placeholder:text-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed';
const selectCls = 'w-full h-11 px-4 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 text-slate-700 transition-all cursor-pointer';

/* ── Step indicator ── */
const StepDot = ({ num, label, active, done }) => (
  <div className="flex items-center gap-2.5">
    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-none transition-all ${
      done  ? 'bg-emerald-500 text-white' :
      active ? 'bg-sky-600 text-white' :
               'bg-slate-100 text-slate-400 border border-slate-200'
    }`}>
      {done ? <CheckIcon className="h-4 w-4" /> : num}
    </div>
    <span className={`text-xs font-semibold transition-colors ${active || done ? 'text-slate-700' : 'text-slate-400'}`}>
      {label}
    </span>
  </div>
);

/* ── Section wrapper ── */
const Section = ({ icon: Icon, title, subtitle, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/50">
      <div className="h-8 w-8 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center flex-none">
        <Icon className="h-4 w-4 text-sky-500" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-[11px] text-slate-400">{subtitle}</p>
      </div>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ── Summary row ── */
const SummaryRow = ({ label, value }) => (
  <div className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{label}</span>
    <span className="text-xs font-semibold text-slate-700 truncate max-w-[55%] text-right">{value || '—'}</span>
  </div>
);

/* ── Side guidance card ── */
const GuidanceCard = ({ icon: Icon, iconCls, iconBg, title, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <div className={`h-8 w-8 rounded-xl border flex items-center justify-center flex-none ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconCls}`} />
      </div>
      <p className="text-sm font-semibold text-slate-700">{title}</p>
    </div>
    {children}
  </div>
);

/* ── Main component ── */
const ClaimForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [clients, setClients] = useState([]);
  const [step, setStep]       = useState(1);
  const [searchClient, setSearchClient] = useState('');
  const isClientUser = user?.UserRole?.toLowerCase() === 'client';

  const [formData, setFormData] = useState({
    CodTiers: '', LibTiers: '', Objet: '',
    Description: '', Priorite: 'Normale', TypeReclamation: 'Technique',
  });

  const isStep1Complete = !!(formData.CodTiers && formData.LibTiers);
  const isStep2Complete = !!(formData.Objet && formData.TypeReclamation && formData.Priorite);
  const isStep3Complete = !!(formData.Description.trim());

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/tiers?limit=10000');
        const list = response?.data?.data ?? response?.data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map(c => ({
          ...c, LibTiers: c.LibTiers || c.Raisoc || c.CodTiers,
        }));
        setClients(normalized);

        if (isClientUser) {
          const userCode  = String(user?.CodTiers || user?.codTiers || '').trim().toLowerCase();
          const userEmail = String(user?.EmailPro || user?.LoginName || '').trim().toLowerCase();
          const match = normalized.find(c => {
            const cc = String(c.CodTiers || '').trim().toLowerCase();
            const ce = String(c.Email || c.email || '').trim().toLowerCase();
            return (userCode && cc === userCode) || (userEmail && ce === userEmail);
          }) || normalized[0] || null;
          if (match) setFormData(p => ({ ...p, CodTiers: match.CodTiers, LibTiers: match.LibTiers || match.Raisoc || match.CodTiers }));
        }
      } catch {
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
      const c = clients.find(c => c.CodTiers === value);
      setFormData(p => ({ ...p, CodTiers: value, LibTiers: c ? (c.LibTiers || c.Raisoc || '') : '' }));
    } else {
      setFormData(p => ({ ...p, [name]: value }));
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
      toast.error(error.response?.data?.message || 'Erreur lors de la création de la réclamation');
    } finally {
      setSaving(false);
    }
  };

  const filteredClients = clients.filter(c => {
    const q = String(searchClient || '').toLowerCase().trim();
    if (!q) return true;
    return [c.LibTiers, c.CodTiers, c.Raisoc].some(v => String(v || '').toLowerCase().includes(q));
  });

  const priorityCfg = {
    Basse:   'bg-slate-50 text-slate-500 border-slate-200',
    Normale: 'bg-slate-100 text-slate-600 border-slate-200',
    Haute:   'bg-amber-50 text-amber-600 border-amber-200',
    Urgente: 'bg-rose-50 text-rose-600 border-rose-200',
  };

  if (loading) return <LoadingSpinner />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      className="space-y-5 pb-12">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm">
          <ArrowLeftIcon className="h-4 w-4" /> Retour
        </button>
        <div className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-sky-50 border border-sky-200 text-sm font-semibold text-sky-600">
          <LifebuoyIcon className="h-4 w-4" /> Nouveau ticket
        </div>
        <div className="w-24" />
      </div>

      {/* ── Page title ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Créer une réclamation</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Trois étapes simples : client, qualification, description.
            </p>
          </div>
          {/* Step dots */}
          <div className="flex items-center gap-4">
            <StepDot num={1} label="Client"      active={step >= 1} done={step > 1} />
            <div className="h-px w-6 bg-slate-200 flex-none" />
            <StepDot num={2} label="Détails"     active={step >= 2} done={step > 2} />
            <div className="h-px w-6 bg-slate-200 flex-none" />
            <StepDot num={3} label="Description" active={step >= 3} done={step > 3} />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 items-start">

        {/* Left: form steps */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Step 1 — Client */}
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <Section icon={UserCircleIcon} title="Sélection du client" subtitle="Choisissez l'entreprise ou le contact concerné.">
                  <div className="space-y-4">
                    {!isClientUser && (
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Rechercher</label>
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                          <input type="text" value={searchClient} onChange={e => setSearchClient(e.target.value)}
                            placeholder="Nom, code ou raison sociale…"
                            className="w-full h-10 pl-10 pr-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 focus:bg-white placeholder:text-slate-400 transition-all" />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Client *</label>
                      <select name="CodTiers" value={formData.CodTiers} onChange={handleChange}
                        disabled={isClientUser} required className={selectCls}>
                        <option value="">Choisir un client…</option>
                        {filteredClients.map(c => (
                          <option key={c.CodTiers} value={c.CodTiers}>
                            {c.LibTiers} — {c.CodTiers}
                          </option>
                        ))}
                      </select>
                      {isClientUser && formData.CodTiers && (
                        <p className="text-[11px] text-sky-500 mt-1.5">Votre entreprise a été sélectionnée automatiquement.</p>
                      )}
                    </div>

                    {formData.CodTiers && (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <CheckCircleIcon className="h-4 w-4 text-emerald-500 flex-none" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">Client sélectionné</p>
                          <p className="text-[11px] text-emerald-600">{formData.LibTiers}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Step 2 — Détails */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <Section icon={TagIcon} title="Détails du ticket" subtitle="Donnez un objet clair et choisissez la bonne classification.">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Objet / Titre *</label>
                      <input type="text" name="Objet" value={formData.Objet} onChange={handleChange}
                        placeholder="Ex : Produit défectueux reçu" required className={inputCls} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          <span className="flex items-center gap-1"><TagIcon className="h-3 w-3" /> Type *</span>
                        </label>
                        <select name="TypeReclamation" value={formData.TypeReclamation} onChange={handleChange} className={selectCls}>
                          <option>Technique</option>
                          <option>Commercial</option>
                          <option>Livraison / Stock</option>
                          <option>Facturation</option>
                          <option>Qualité Produit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          <span className="flex items-center gap-1"><ExclamationTriangleIcon className="h-3 w-3" /> Priorité *</span>
                        </label>
                        <select name="Priorite" value={formData.Priorite} onChange={handleChange}
                          className={`${selectCls} font-semibold border ${priorityCfg[formData.Priorite] || 'border-slate-200'}`}>
                          <option>Basse</option>
                          <option>Normale</option>
                          <option>Haute</option>
                          <option>Urgente</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </Section>
              </motion.div>
            )}

            {/* Step 3 — Description */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
                <Section icon={ChatBubbleLeftEllipsisIcon} title="Description détaillée" subtitle="Décrivez le problème et les éléments utiles au traitement.">
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Description *</label>
                    <textarea name="Description" value={formData.Description} onChange={handleChange}
                      rows={7} required placeholder="Décrivez le problème en détail, les étapes à reproduire, les dates…"
                      className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300 focus:bg-white text-slate-700 placeholder:text-slate-400 resize-none transition-all" />
                    <p className="text-[11px] text-slate-400 text-right">{formData.Description.length} caractères</p>
                  </div>
                </Section>

                {/* Summary */}
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Récapitulatif</p>
                  <SummaryRow label="Client"   value={formData.LibTiers} />
                  <SummaryRow label="Type"     value={formData.TypeReclamation} />
                  <SummaryRow label="Priorité" value={formData.Priorite} />
                  <SummaryRow label="Objet"    value={formData.Objet} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-1">
            <button type="button"
              onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
              className="h-10 px-5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
              {step > 1 ? '← Précédent' : 'Annuler'}
            </button>

            {step < 3 ? (
              <button type="button"
                onClick={() => {
                  if ((step === 1 && isStep1Complete) || (step === 2 && isStep2Complete)) setStep(step + 1);
                }}
                disabled={(step === 1 && !isStep1Complete) || (step === 2 && !isStep2Complete)}
                className="h-10 px-6 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
                Suivant →
              </button>
            ) : (
              <button type="submit" disabled={saving || !isStep3Complete}
                className="h-10 px-6 rounded-xl bg-sky-600 text-white text-sm font-semibold hover:bg-sky-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-2">
                {saving
                  ? <><div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Création…</>
                  : <><CheckIcon className="h-4 w-4" /> Ouvrir le ticket</>
                }
              </button>
            )}
          </div>
        </form>

        {/* Right: side panel */}
        <div className="space-y-4 lg:sticky lg:top-6">

          {/* Progression */}
          <GuidanceCard icon={ShieldCheckIcon} iconCls="text-sky-500" iconBg="bg-sky-50 border-sky-200" title="Progression">
            <div className="space-y-2.5">
              {[
                { num: 1, label: 'Client',      done: isStep1Complete },
                { num: 2, label: 'Détails',     done: isStep2Complete },
                { num: 3, label: 'Description', done: isStep3Complete },
              ].map(s => (
                <div key={s.num} className={`flex items-center justify-between px-3 py-2 rounded-xl border ${s.done ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-xs font-medium text-slate-600">{s.num}. {s.label}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.done ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {s.done ? 'Prêt' : 'À compléter'}
                  </span>
                </div>
              ))}
            </div>
          </GuidanceCard>

          {/* Conseils */}
          <GuidanceCard icon={BoltIcon} iconCls="text-amber-500" iconBg="bg-amber-50 border-amber-200" title="Conseils de saisie">
            <div className="space-y-3">
              {[
                { title: 'Objet clair',        text: 'Un intitulé court aide à trier et prioriser le ticket.' },
                { title: 'Priorité réaliste',  text: "Urgente uniquement si le problème bloque l'activité." },
                { title: 'Description précise', text: 'Ajoute les symptômes, le contexte et les éléments déjà testés.' },
              ].map((tip, i) => (
                <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <p className="text-xs font-semibold text-slate-700">{tip.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{tip.text}</p>
                </div>
              ))}
            </div>
          </GuidanceCard>

        </div>
      </div>
    </motion.div>
  );
};

export default ClaimForm;
