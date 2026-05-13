import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon, UserIcon, CalendarIcon, CreditCardIcon,
  BanknotesIcon, DocumentTextIcon, MagnifyingGlassIcon,
  CheckCircleIcon, AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatCurrency, formatDate } from '../../utils/format';

const getLocalDateInputValue = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const defaultFormState = () => ({
  codTiers: '', libTiers: '', datReg: getLocalDateInputValue(),
  modReg: 'ESPECE', numPiece: '', banque: '', detail: '', montantGlobal: '',
});

const toNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round(parsed * 1000) / 1000 : 0;
};

const toDateOnlyLocal = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDocKey = (doc) => `${doc.type}:${doc.id}`;

/* ── small section heading ── */
const SectionTitle = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center flex-none">
      <Icon className="h-3.5 w-3.5 text-slate-500" />
    </div>
    <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
  </div>
);

/* ── shared input class ── */
const inputCls = 'w-full h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:bg-white text-slate-700 placeholder:text-slate-400 transition-all disabled:opacity-50';

const ReglemForm = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData]           = useState(defaultFormState);
  const [clients, setClients]             = useState([]);
  const [clientSearch, setClientSearch]   = useState('');
  const [paymentModes, setPaymentModes]   = useState([]);
  const [documents, setDocuments]         = useState([]);
  const [selectedAllocations, setSelectedAllocations] = useState({});
  const [docFilters, setDocFilters]       = useState({ search: '', type: '', dateFrom: '', dateTo: '' });
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingModes, setLoadingModes]   = useState(false);
  const [loadingDocs, setLoadingDocs]     = useState(false);
  const [banques, setBanques]             = useState([]);
  const [loadingBanques, setLoadingBanques] = useState(false);
  const [addingBanque, setAddingBanque]   = useState(false);
  const [otherBanque, setOtherBanque]     = useState('');
  const [otherBanqueAdresse, setOtherBanqueAdresse] = useState('');
  const [otherBanquePhoto, setOtherBanquePhoto]     = useState(null);
  const otherBanquePhotoInputRef = useRef(null);

  const normalizedModReg  = String(formData.modReg || '').toUpperCase();
  const requiresReference = ['CHEQUE', 'VIREMENT', 'TRAITE', 'EFFET'].includes(normalizedModReg);
  const requiresBank      = ['CHEQUE', 'VIREMENT', 'TRAITE', 'EFFET'].includes(normalizedModReg);

  const getClientLabel = (c) =>
    c.LibelleComplet || c.Nom || c.LibTiers || c.Raisoc || c.CodTiers || c.id;

  const filteredClients = useMemo(() => {
    const term = String(clientSearch || '').trim().toLowerCase();
    if (!term) return clients;
    return clients.filter(c => {
      const code  = String(c.CodTiers || c.id || '').toLowerCase();
      const label = String(getClientLabel(c) || '').toLowerCase();
      return code.includes(term) || label.includes(term) ||
        String(c.Email || '').toLowerCase().includes(term) ||
        String(c.Tel   || '').toLowerCase().includes(term);
    });
  }, [clients, clientSearch]);

  const filteredDocuments = useMemo(() => {
    const search = String(docFilters.search || '').trim().toLowerCase();
    const from   = String(docFilters.dateFrom || '').trim();
    const to     = String(docFilters.dateTo   || '').trim();
    return documents.filter(doc => {
      if (docFilters.type && doc.type !== docFilters.type) return false;
      if (search && !`${doc.num || ''} ${doc.type || ''}`.toLowerCase().includes(search)) return false;
      const d = String(doc.date || '').slice(0, 10);
      if (from && d && d < from) return false;
      if (to   && d && d > to)   return false;
      return true;
    });
  }, [documents, docFilters]);

  const selectedPieces = useMemo(() =>
    documents
      .filter(doc => Object.prototype.hasOwnProperty.call(selectedAllocations, getDocKey(doc)))
      .map(doc => ({ ...doc, allocatedAmount: toNumber(selectedAllocations[getDocKey(doc)]) }))
      .filter(doc => doc.allocatedAmount > 0),
    [documents, selectedAllocations]);

  const totalAllocated = useMemo(() =>
    selectedPieces.reduce((s, p) => s + toNumber(p.allocatedAmount), 0),
    [selectedPieces]);

  const partialCount = useMemo(() =>
    selectedPieces.filter(p => p.allocatedAmount < (p.remaining - 0.01)).length,
    [selectedPieces]);

  useEffect(() => {
    if (!isOpen) return;
    fetchClients(); fetchPaymentModes(); fetchBanques();
    setClientSearch(''); setSuccess(''); setError('');
    setSelectedAllocations({}); setDocuments([]);
    setOtherBanque(''); setOtherBanqueAdresse(''); setOtherBanquePhoto(null);
    if (otherBanquePhotoInputRef.current) otherBanquePhotoInputRef.current.value = '';
    setDocFilters({ search: '', type: '', dateFrom: '', dateTo: '' });
    setFormData(defaultFormState());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !formData.codTiers) return;
    fetchUnpaidDocuments(formData.codTiers, docFilters.dateFrom, docFilters.dateTo);
  }, [isOpen, formData.codTiers, docFilters.dateFrom, docFilters.dateTo]);

  const fetchPaymentModes = async () => {
    try {
      setLoadingModes(true);
      const res = await axios.get('/reglements/paymodes');
      const modes = Array.isArray(res?.data?.data || res?.data) ? (res?.data?.data || res?.data) : [];
      setPaymentModes(modes);
      if (modes.length > 0 && !modes.some(m => String(m.label || '').toUpperCase() === 'ESPECE'))
        setFormData(prev => ({ ...prev, modReg: modes[0]?.label || prev.modReg }));
    } catch { setPaymentModes([]); }
    finally { setLoadingModes(false); }
  };

  const fetchBanques = async () => {
    try {
      setLoadingBanques(true);
      const res = await axios.get('/banques');
      const payload = res?.data?.data || res?.data || [];
      setBanques(Array.isArray(payload) ? payload : []);
    } catch { setBanques([]); }
    finally { setLoadingBanques(false); }
  };

  const handleAddOtherBanque = async () => {
    const name = String(otherBanque || '').trim();
    if (!name) return;
    try {
      setAddingBanque(true);
      const fd = new FormData();
      fd.append('banque', name);
      const addr = String(otherBanqueAdresse || '').trim();
      if (addr) fd.append('adresse', addr);
      if (otherBanquePhoto) fd.append('photo', otherBanquePhoto);
      const res = await axios.post('/banques', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const added = res?.data?.data || null;
      if (added?.id) {
        setBanques(prev => prev.some(b => String(b.id) === String(added.id)) ? prev :
          [...prev, added].sort((a, b) => String(a.banque || '').localeCompare(String(b.banque || ''), 'fr', { sensitivity: 'base' })));
        setFormData(prev => ({ ...prev, banque: added.banque || name }));
      } else {
        setFormData(prev => ({ ...prev, banque: name }));
      }
      setOtherBanque(''); setOtherBanqueAdresse(''); setOtherBanquePhoto(null);
      if (otherBanquePhotoInputRef.current) otherBanquePhotoInputRef.current.value = '';
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || "Impossible d'ajouter la banque");
    } finally { setAddingBanque(false); }
  };

  const fetchClients = async () => {
    try {
      setLoadingClients(true); setError('');
      let res;
      try { res = await axios.get('/tiers?limit=10000&sort=recent'); }
      catch (err) {
        if (err.response?.status === 404) res = await axios.get('/clients?limit=10000&sort=recent');
        else throw err;
      }
      const list = res?.data?.data ?? res?.data ?? res;
      if (Array.isArray(list)) setClients(list);
      else setError('Format de données invalide du serveur');
    } catch {
      setError('Clients non disponibles. Entrez le code client manuellement.');
      setClients([]);
    } finally { setLoadingClients(false); }
  };

  const fetchUnpaidDocuments = async (codTiers, dateFrom, dateTo) => {
    if (!codTiers) return;
    try {
      setLoadingDocs(true); setError('');
      const p = new URLSearchParams();
      if (dateFrom) p.set('dateFrom', dateFrom);
      if (dateTo)   p.set('dateTo', dateTo);
      const res = await axios.get(`/reglements/unpaid/${encodeURIComponent(codTiers)}${p.toString() ? `?${p}` : ''}`);
      const payload = res?.data?.data || res?.data || [];
      const docs = Array.isArray(payload)
        ? payload.map(doc => {
            const debit    = toNumber(doc.debit);
            const credit   = toNumber(doc.credit);
            const remaining = Math.max(0, toNumber(doc.remaining > 0 ? doc.remaining : (debit - credit)));
            return { ...doc, debit, credit, remaining,
              openReglementId: doc.openReglementId || null,
              openReglementDate: doc.openReglementDate || null,
              openReglementRemaining: toNumber(doc.openReglementRemaining || 0),
            };
          }).filter(d => d.remaining > 0)
        : [];
      setDocuments(docs);
      setSelectedAllocations(prev => {
        const next = {};
        docs.forEach(doc => {
          const key = getDocKey(doc);
          if (Object.prototype.hasOwnProperty.call(prev, key))
            next[key] = Math.min(toNumber(prev[key]), doc.remaining);
        });
        return next;
      });
    } catch (err) {
      setDocuments([]); setSelectedAllocations({});
      setError(err.response?.data?.message || 'Impossible de charger les pièces impayées');
    } finally { setLoadingDocs(false); }
  };

  const handleInputChange  = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); setError(''); };
  const handleClientChange = (e) => {
    const codTiers = e.target.value;
    const client   = clients.find(c => String(c.CodTiers || c.id || '').trim() === String(codTiers || '').trim());
    setFormData(p => ({ ...p, codTiers, libTiers: client?.LibelleComplet || client?.Nom || client?.LibTiers || client?.Raisoc || codTiers }));
    setSelectedAllocations({}); setDocuments([]);
    setDocFilters(p => ({ ...p, search: '', type: '' }));
    if (client) setClientSearch(getClientLabel(client));
    setError('');
  };

  const togglePieceSelection = (doc, checked) => {
    const key = getDocKey(doc);
    setSelectedAllocations(prev => {
      const next = { ...prev };
      if (checked) next[key] = doc.remaining; else delete next[key];
      return next;
    });
  };

  const handleAllocationChange = (doc, value) => {
    const key = getDocKey(doc);
    setSelectedAllocations(prev => ({ ...prev, [key]: Math.max(0, Math.min(toNumber(value), doc.remaining)) }));
  };

  const applyFIFO = () => {
    const total = toNumber(formData.montantGlobal);
    if (total <= 0) { setError('Veuillez saisir un montant global supérieur à zéro'); return; }
    const selectedDocKeys = Object.keys(selectedAllocations);
    const pieces = (selectedDocKeys.length > 0
      ? documents.filter(d => selectedDocKeys.includes(getDocKey(d)))
      : filteredDocuments
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
    let remaining = total;
    const next = {};
    pieces.forEach(doc => {
      if (remaining <= 0) return;
      const key = getDocKey(doc);
      const amt = Math.min(remaining, doc.remaining);
      next[key] = amt;
      remaining = Math.round((remaining - amt) * 1000) / 1000;
    });
    setSelectedAllocations(next);
    if (remaining > 0.01)
      setError(`Attention : ${formatCurrency(remaining)} n'ont pas pu être alloués`);
    else setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.codTiers.trim())        { setError('Sélectionnez un client'); return; }
    const paymentTotal = toNumber(formData.montantGlobal) || totalAllocated;
    if (paymentTotal <= 0)                { setError('Le montant total doit être supérieur à zéro'); return; }
    if (selectedPieces.length === 0 && !formData.montantGlobal) { setError('Sélectionnez au moins une pièce ou saisissez un montant (Avance)'); return; }
    if (requiresReference && !formData.numPiece.trim()) { setError('Le numéro de pièce est obligatoire pour cette modalité'); return; }
    if (requiresBank      && !formData.banque.trim())   { setError('La banque est obligatoire pour cette modalité'); return; }
    try {
      setLoading(true); setError(''); setSuccess('');
      const payload = {
        codTiers: formData.codTiers, libTiers: formData.libTiers,
        mntReg: paymentTotal, datReg: formData.datReg,
        selectedPieces: selectedPieces.map(p => ({ id: p.id, type: p.type, allocatedAmount: p.allocatedAmount })),
        payments: [{ modReg: formData.modReg, montant: paymentTotal, echeance: formData.datReg,
          numPiece: formData.numPiece || null, banque: formData.banque || null, detail: formData.detail || null }],
      };
      payload.mntRegTarget = toNumber(selectedPieces.reduce((s, p) => s + toNumber(p.remaining), 0));
      const res = await axios.post('/reglements', payload);
      const created = res?.data?.data || res?.data;
      if (created?.id) {
        setSuccess('Règlement créé avec succès');
        try { if (onSuccess) onSuccess(created); } catch {}
        onClose();
      } else { setError('Réponse serveur invalide après création'); }
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally { setLoading(false); }
  };

  const totalPayment = toNumber(formData.montantGlobal) || totalAllocated;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-6xl max-h-[92vh] overflow-hidden flex flex-col"
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-none">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Créer un Règlement</h2>
                    <p className="text-[11px] text-slate-400">Saisir les informations du paiement</p>
                  </div>
                </div>
                <button onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* ── Body ── */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">

                {/* Section 1 — Client & Infos de base */}
                <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-4">
                  <SectionTitle icon={UserIcon} label="Informations générales" />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Client */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Client</label>
                      {clients.length > 0 ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <input type="text" value={clientSearch}
                              onChange={e => setClientSearch(e.target.value)} disabled={loading}
                              placeholder="Rechercher client…"
                              className="w-full h-9 pl-9 pr-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 placeholder:text-slate-400 transition-all disabled:opacity-50" />
                          </div>
                          <select name="codTiers" value={formData.codTiers} onChange={handleClientChange} disabled={loading} className={inputCls}>
                            <option value="">Sélectionnez un client…</option>
                            {filteredClients.map(c => (
                              <option key={c.CodTiers || c.id} value={c.CodTiers || c.id}>
                                {c.CodTiers || c.id} — {getClientLabel(c)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : loadingClients ? (
                        <div className="h-9 flex items-center px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-400">Chargement…</div>
                      ) : (
                        <input type="text" name="codTiers" value={formData.codTiers}
                          onChange={e => setFormData(p => ({ ...p, codTiers: e.target.value, libTiers: e.target.value }))}
                          disabled={loading} placeholder="Code client" className={inputCls} />
                      )}
                    </div>

                    {/* Date + Modalité + Montant */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          <span className="flex items-center gap-1"><CalendarIcon className="h-3 w-3" /> Date</span>
                        </label>
                        <input type="date" name="datReg" value={formData.datReg} onChange={handleInputChange}
                          disabled={loading} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          <span className="flex items-center gap-1"><CreditCardIcon className="h-3 w-3" /> Modalité</span>
                        </label>
                        <select name="modReg" value={formData.modReg} onChange={handleInputChange}
                          disabled={loading || loadingModes} className={inputCls}>
                          {paymentModes.length > 0 ? paymentModes.map(m => (
                            <option key={m.IDReg} value={m.label}>{m.label}</option>
                          )) : (
                            <>
                              <option value="ESPECE">ESPECE</option>
                              <option value="CHEQUE">CHEQUE</option>
                              <option value="VIREMENT">VIREMENT</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          <span className="flex items-center gap-1"><BanknotesIcon className="h-3 w-3" /> Montant global (TND)</span>
                        </label>
                        <div className="flex gap-2">
                          <input type="number" name="montantGlobal" value={formData.montantGlobal}
                            onChange={handleInputChange} placeholder="0.000" step="0.001" disabled={loading}
                            className="flex-1 h-9 px-3 text-sm bg-white border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 font-semibold text-slate-700 placeholder:text-slate-400 transition-all disabled:opacity-50" />
                          <button type="button" onClick={applyFIFO} disabled={loading || !formData.montantGlobal}
                            className="h-9 px-3 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-40 whitespace-nowrap">
                            <span className="flex items-center gap-1"><AdjustmentsHorizontalIcon className="h-3.5 w-3.5" /> FIFO</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Détail */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Détail (optionnel)</label>
                    <input type="text" name="detail" value={formData.detail} onChange={handleInputChange}
                      disabled={loading} placeholder="Note ou référence interne…" className={inputCls} />
                  </div>
                </div>

                {/* Section 2 — Banque / Référence (conditionnelle) */}
                {(requiresReference || requiresBank) && (
                  <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4 space-y-4">
                    <SectionTitle icon={BanknotesIcon} label="Informations bancaires" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          Numéro pièce{requiresReference ? ' *' : ''}
                        </label>
                        <input type="text" name="numPiece" value={formData.numPiece} onChange={handleInputChange}
                          disabled={loading} placeholder="N° chèque / virement…" className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">
                          Banque{requiresBank ? ' *' : ''}
                        </label>
                        <select name="banque" value={formData.banque} onChange={handleInputChange}
                          disabled={loading || loadingBanques} className={inputCls}>
                          <option value="">Sélectionner une banque…</option>
                          {formData.banque && !banques.some(b => String(b.banque || '').trim() === String(formData.banque || '').trim()) && (
                            <option value={formData.banque}>{formData.banque}</option>
                          )}
                          {banques.map(b => <option key={b.id || b.banque} value={b.banque}>{b.banque}</option>)}
                        </select>

                        <div className="mt-2.5 grid grid-cols-3 gap-2">
                          <input type="text" value={otherBanque} onChange={e => setOtherBanque(e.target.value)}
                            placeholder="Autre banque…" disabled={loading || addingBanque}
                            className="col-span-1 h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-slate-700 placeholder:text-slate-400 transition-all" />
                          <input type="text" value={otherBanqueAdresse} onChange={e => setOtherBanqueAdresse(e.target.value)}
                            placeholder="Adresse…" disabled={loading || addingBanque}
                            className="col-span-1 h-9 px-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-700 placeholder:text-slate-400 transition-all" />
                          <input type="file" accept="image/*" ref={otherBanquePhotoInputRef}
                            onChange={e => setOtherBanquePhoto(e.target.files?.[0] || null)}
                            disabled={loading || addingBanque}
                            className="col-span-1 h-9 px-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-500 file:mr-2 file:text-xs file:bg-transparent file:border-0" />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <button type="button" onClick={handleAddOtherBanque}
                            disabled={loading || addingBanque || !String(otherBanque || '').trim()}
                            className="h-8 px-3 text-xs font-semibold bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all disabled:opacity-40">
                            {addingBanque ? 'Ajout…' : '+ Ajouter'}
                          </button>
                          {otherBanquePhoto && (
                            <span className="text-[10px] text-slate-400 truncate">Photo : {otherBanquePhoto.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 3 — Pièces impayées */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  {/* sub-header */}
                  <div className="bg-slate-50/60 px-4 py-3 border-b border-slate-100 flex flex-col md:flex-row md:items-end gap-3">
                    <div className="flex items-center gap-2 flex-none">
                      <div className="h-6 w-6 rounded-md bg-slate-100 flex items-center justify-center">
                        <DocumentTextIcon className="h-3.5 w-3.5 text-slate-500" />
                      </div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Pièces impayées</span>
                    </div>
                    {formData.codTiers && (
                      <div className="flex flex-wrap gap-2 md:ml-auto">
                        <div className="relative">
                          <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                          <input type="text" value={docFilters.search}
                            onChange={e => setDocFilters(p => ({ ...p, search: e.target.value }))}
                            placeholder="Numéro ou type…"
                            className="h-8 pl-8 pr-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-600 placeholder:text-slate-400 transition-all w-44" />
                        </div>
                        <select value={docFilters.type} onChange={e => setDocFilters(p => ({ ...p, type: e.target.value }))}
                          className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-600 transition-all">
                          <option value="">Tous types</option>
                          <option value="FA">Factures</option>
                          <option value="BL">Bons de livraison</option>
                        </select>
                        <input type="date" value={docFilters.dateFrom}
                          onChange={e => setDocFilters(p => ({ ...p, dateFrom: e.target.value }))}
                          className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-600 transition-all" />
                        <input type="date" value={docFilters.dateTo}
                          onChange={e => setDocFilters(p => ({ ...p, dateTo: e.target.value }))}
                          className="h-8 px-3 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 text-slate-600 transition-all" />
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100">
                          {['', 'Pièce', 'Date', 'Montant', 'Déjà payé', 'Reste', 'Alloué'].map((h, i) => (
                            <th key={i} className={`px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${i >= 3 ? 'text-right' : i === 0 ? '' : 'text-left'}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {loadingDocs ? (
                          <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">Chargement des pièces…</td></tr>
                        ) : !formData.codTiers ? (
                          <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">Sélectionnez un client pour voir ses pièces impayées</td></tr>
                        ) : filteredDocuments.length === 0 ? (
                          <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-400">Aucune pièce impayée trouvée</td></tr>
                        ) : filteredDocuments.map(doc => {
                          const key      = getDocKey(doc);
                          const selected = Object.prototype.hasOwnProperty.call(selectedAllocations, key);
                          return (
                            <tr key={key} className={`transition-colors ${selected ? 'bg-emerald-50/60' : 'hover:bg-slate-50'}`}>
                              <td className="px-3 py-2.5">
                                <input type="checkbox" checked={selected}
                                  onChange={e => togglePieceSelection(doc, e.target.checked)}
                                  disabled={loading}
                                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-300" />
                              </td>
                              <td className="px-3 py-2.5">
                                <span className="inline-flex items-center gap-1">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">{doc.type}</span>
                                  <span className="text-xs font-semibold text-slate-700">{doc.num}</span>
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-xs text-slate-500">{formatDate(toDateOnlyLocal(doc.date))}</td>
                              <td className="px-3 py-2.5 text-right text-xs text-slate-600 tabular-nums">{formatCurrency(doc.debit)}</td>
                              <td className="px-3 py-2.5 text-right text-xs text-emerald-600 font-semibold tabular-nums">{formatCurrency(doc.credit)}</td>
                              <td className="px-3 py-2.5 text-right text-xs font-semibold text-amber-600 tabular-nums">{formatCurrency(doc.remaining)}</td>
                              <td className="px-3 py-2.5 text-right">
                                <input type="number" min="0" step="0.001" max={doc.remaining}
                                  value={selected ? selectedAllocations[key] : ''}
                                  onChange={e => handleAllocationChange(doc, e.target.value)}
                                  onFocus={() => !selected && togglePieceSelection(doc, true)}
                                  disabled={loading || !selected}
                                  className="w-28 h-7 px-2 text-right text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 disabled:opacity-40 tabular-nums" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 4 — Récapitulatif */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Pièces sélectionnées', value: selectedPieces.length, sub: 'documents' },
                    { label: 'Pièces partielles',    value: partialCount,          sub: 'partiellement allouées' },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.label}</p>
                      <p className="text-xl font-bold text-slate-700 mt-0.5">{s.value}</p>
                      <p className="text-[10px] text-slate-400">{s.sub}</p>
                    </div>
                  ))}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-widest">Total à payer</p>
                    <p className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(totalPayment)}</p>
                    {formData.montantGlobal && Math.abs(toNumber(formData.montantGlobal) - totalAllocated) > 0.01 && (
                      <p className="text-[10px] text-amber-600 font-semibold mt-0.5">Alloué : {formatCurrency(totalAllocated)}</p>
                    )}
                  </div>
                </div>

                {/* Alerts */}
                <AnimatePresence>
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-2.5 rounded-xl text-sm">
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
                      <CheckCircleIcon className="h-4 w-4 flex-none" />{success}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={onClose} disabled={loading}
                    className="flex-1 h-10 px-4 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50">
                    Annuler
                  </button>
                  <motion.button type="submit"
                    disabled={loading || (selectedPieces.length === 0 && !(toNumber(formData.montantGlobal) > 0))}
                    whileHover={{ scale: loading ? 1 : 1.01 }}
                    whileTap={{ scale: loading ? 1 : 0.99 }}
                    className="flex-1 h-10 px-4 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-500 transition-all disabled:opacity-50 shadow-sm">
                    {loading ? 'Création…' : 'Créer le règlement'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReglemForm;
