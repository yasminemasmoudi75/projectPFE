import { useCallback, useEffect, useRef, useState } from 'react';
import {
  XMarkIcon, SparklesIcon, CheckIcon, ArrowPathIcon,
  PaperClipIcon, PaperAirplaneIcon, EnvelopeIcon,
  TagIcon, TrashIcon, UsersIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatFileSize } from '../../utils/format';

/* ── Field wrapper ───────────────────────────────────────────── */
const Field = ({ label, required, icon: Icon, children, hint }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
      {Icon && <Icon className="h-3 w-3 text-slate-400" />}
      {label}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
    {hint && <p className="text-[10px] text-slate-400">{hint}</p>}
  </div>
);

/* ════════════════════════════════════════════════════════════════ */
const ComposeEmailModal = ({ isOpen, onClose, onSuccess, initialTo = '' }) => {
  const [formData, setFormData]     = useState({ subject: '', message: '' });
  const [recipients, setRecipients] = useState(
    initialTo ? [{ name: initialTo, email: initialTo }] : []
  );
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const attachmentInputRef          = useRef(null);

  // AI state
  const [showAI, setShowAI]                   = useState(false);
  const [aiPrompt, setAiPrompt]               = useState('');
  const [aiGenerating, setAiGenerating]       = useState(false);
  const [aiError, setAiError]                 = useState(null);
  const [aiResponse, setAiResponse]           = useState(null);
  const [reformulating, setReformulating]     = useState(false);
  const [reformulateNote, setReformulateNote] = useState(null); // { type: 'success'|'warn', text }

  // Recipient search state
  const [showSearch, setShowSearch]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [searchResults, setSearchResults]     = useState([]);
  const [searchLoading, setSearchLoading]     = useState(false);
  const debounceRef                           = useRef(null);

  const MAX_SIZE = 25 * 1024 * 1024;

  const resetForm = () => {
    setFormData({ subject: '', message: '' });
    setRecipients([]);
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    setShowAI(false);
    setShowSearch(false);
    setAiPrompt('');
    setAiResponse(null);
    setAiError(null);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
    setReformulateNote(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'message') setReformulateNote(null);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) { setAttachment(null); return; }
    if (file.size > MAX_SIZE) {
      setError('La pièce jointe ne doit pas dépasser 25 Mo');
      e.target.value = '';
      setAttachment(null);
      return;
    }
    setError(null);
    setAttachment(file);
  };

  /* ── Recipient search ──────────────────────────────────────── */
  const searchContacts = useCallback(async (query) => {
    if (!query.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const [usersRes, tiersRes] = await Promise.allSettled([
        axios.get(`/users?search=${encodeURIComponent(query)}&limit=100`),
        axios.get(`/tiers?search=${encodeURIComponent(query)}&limit=100`),
      ]);

      // L'API users retourne { data: [...], pagination: {...} }
      const usersRaw = usersRes.status === 'fulfilled'
        ? (usersRes.value?.data?.data || usersRes.value?.data || usersRes.value || [])
        : [];
      const users = (Array.isArray(usersRaw) ? usersRaw : [])
        .filter(u => u.EmailPro)
        .map(u => ({
          name: u.FullName || u.EmailPro,
          email: u.EmailPro,
          type: u.UserRole || 'Utilisateur',
        }));

      const rawTiers = tiersRes.status === 'fulfilled'
        ? (tiersRes.value?.data?.data || tiersRes.value?.data || tiersRes.value || [])
        : [];
      const tiers = (Array.isArray(rawTiers) ? rawTiers : [])
        .filter(t => t.Email1 || t.Email2).map(t => ({
          name: t.RaisonSociale || t.NomTiers || t.Email1,
          email: t.Email1 || t.Email2,
          type: 'Client',
        }));

      const seen = new Set();
      const combined = [...users, ...tiers].filter(c => {
        if (seen.has(c.email.toLowerCase())) return false;
        seen.add(c.email.toLowerCase());
        return true;
      });
      setSearchResults(combined.slice(0, 15));
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchContacts(searchQuery), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, searchContacts]);

  const addRecipient = (contact) => {
    if (recipients.some(r => r.email.toLowerCase() === contact.email.toLowerCase())) return;
    setRecipients(prev => [...prev, contact]);
  };

  const removeRecipient = (email) => setRecipients(prev => prev.filter(r => r.email !== email));

  const isSelected = (email) => recipients.some(r => r.email.toLowerCase() === email.toLowerCase());

  const handleTogglePanel = (panel) => {
    if (panel === 'ai') {
      setShowAI(v => !v);
      setShowSearch(false);
    } else {
      setShowSearch(v => !v);
      setShowAI(false);
    }
  };

  /* ── AI ───────────────────────────────────────────────────── */
  const handleGenerateAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiError(null);
    try {
      const res = await axios.post('/ia/generate-email', { prompt: aiPrompt });
      setAiResponse(res?.data || res);
    } catch (err) {
      setAiError(err.response?.data?.message || 'Erreur lors de la génération.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleReformulate = async () => {
    if (!formData.message.trim()) return;
    setReformulating(true);
    setReformulateNote(null);
    try {
      const res = await axios.post('/ia/reformulate-email', { text: formData.message });
      // L'intercepteur axios retourne response.data directement
      // Backend renvoie { status, data: { corrected, source } }
      const data = res?.data ?? res;
      const corrected = data?.corrected ?? null;
      if (corrected) {
        setFormData((prev) => ({ ...prev, message: corrected }));
        setReformulateNote(
          data?.source === 'local'
            ? { type: 'warn', text: 'IA indisponible — reformulation de base appliquée.' }
            : { type: 'success', text: 'Texte reformulé par l\'IA.' }
        );
      } else {
        setReformulateNote({ type: 'error', text: 'Réponse vide du serveur, veuillez réessayer.' });
      }
    } catch (err) {
      setReformulateNote({ type: 'error', text: `Erreur : ${err?.message || 'connexion impossible'}` });
    } finally {
      setReformulating(false);
    }
  };

  /* ── Submit ───────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (recipients.length === 0) {
      setError('Veuillez ajouter au moins un destinataire');
      return;
    }
    setLoading(true);
    try {
      await Promise.all(recipients.map(async (recipient) => {
        const payload = new FormData();
        payload.append('recipientEmail', recipient.email);
        payload.append('subject', formData.subject);
        payload.append('messageText', formData.message);
        if (attachment) payload.append('attachment', attachment);
        await axios.post('/messages/send', payload, { timeout: 120000 });
      }));
      resetForm();
      if (onSuccess) onSuccess();
      alert(`Email envoyé à ${recipients.length} destinataire${recipients.length > 1 ? 's' : ''} ✅`);
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi du message");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => { resetForm(); onClose(); };

  if (!isOpen) return null;

  const inputClass =
    'w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] placeholder:text-slate-300 transition-all text-slate-800';

  const showPanel = showAI || showSearch;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pt-16 pb-4 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl flex flex-col rounded-2xl overflow-hidden shadow-2xl bg-white border border-slate-200">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0062AF] flex-none">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <PaperAirplaneIcon className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white leading-tight">Nouveau message</h2>
              <p className="text-[10px] text-blue-200 font-medium">Composez et envoyez un email</p>
            </div>
          </div>
          <div className="flex items-center gap-2">

            {/* Destinataires button */}
            <button
              type="button"
              onClick={() => handleTogglePanel('recipients')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                showSearch
                  ? 'bg-white text-[#0062AF] border-white shadow-sm'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <UsersIcon className="h-3.5 w-3.5" />
              Destinataires
              {recipients.length > 0 && (
                <span className={`ml-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  showSearch ? 'bg-[#0062AF] text-white' : 'bg-white text-[#0062AF]'
                }`}>
                  {recipients.length}
                </span>
              )}
            </button>

            {/* Assistant IA button */}
            <button
              type="button"
              onClick={() => handleTogglePanel('ai')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                showAI
                  ? 'bg-white text-[#0062AF] border-white shadow-sm'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              Assistant IA
            </button>

            <button
              onClick={handleClose}
              className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="h-px bg-slate-100 flex-none" />

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden" style={{ maxHeight: '75vh' }}>

          {/* Form side */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 bg-slate-50/40 overflow-y-auto">

            {error && (
              <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-xs font-black">!</span>
                </div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="px-7 py-5 space-y-4">

              {/* À — chips zone */}
              <Field label="À" required icon={EnvelopeIcon}>
                <div
                  onClick={() => { setShowSearch(true); setShowAI(false); }}
                  className="min-h-[44px] w-full px-3 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:border-[#0062AF] focus-within:ring-2 focus-within:ring-[#0062AF]/20 focus-within:border-[#0062AF] transition-all flex flex-wrap gap-1.5 items-center"
                >
                  {recipients.length === 0 ? (
                    <span className="text-slate-300 text-sm font-medium select-none">
                      Cliquez pour rechercher des destinataires…
                    </span>
                  ) : (
                    recipients.map((r) => (
                      <span
                        key={r.email}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0062AF]/10 text-[#0062AF] text-xs font-semibold rounded-lg border border-[#0062AF]/20"
                      >
                        <span className="font-bold">{r.name}</span>
                        <span className="text-[#0062AF]/60 font-normal text-[10px]">{r.email}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeRecipient(r.email); }}
                          className="hover:text-red-500 transition-colors ml-0.5"
                        >
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </Field>

              {/* Sujet */}
              <Field label="Sujet" required icon={TagIcon}>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Objet de votre message"
                  required
                  className={inputClass}
                />
              </Field>

              {/* Message */}
              <Field label="Message" required>
                <div className="relative">
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Écrivez votre message…"
                    rows={8}
                    required
                    className={`${inputClass} resize-none`}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-slate-400 font-medium tabular-nums">
                    {formData.message.length} caractère{formData.message.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    type="button"
                    onClick={handleReformulate}
                    disabled={reformulating || !formData.message.trim()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-[#0062AF] hover:text-[#0062AF] rounded-lg transition-all font-semibold disabled:opacity-40 shadow-sm"
                  >
                    {reformulating
                      ? <><ArrowPathIcon className="h-3 w-3 animate-spin" /> Correction…</>
                      : <><SparklesIcon className="h-3 w-3" /> Corriger & Reformuler</>
                    }
                  </button>
                </div>
                {reformulateNote && (
                  <p className={`text-[10px] mt-1 font-medium ${
                    reformulateNote.type === 'success' ? 'text-emerald-600'
                    : reformulateNote.type === 'warn'  ? 'text-amber-500'
                    : 'text-red-500'
                  }`}>
                    {reformulateNote.text}
                  </p>
                )}
              </Field>

              {/* Pièce jointe */}
              <Field label="Pièce jointe" icon={PaperClipIcon}>
                <label className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-[#0062AF] hover:bg-blue-50/30 transition-all group">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors flex-none">
                    <PaperClipIcon className="h-4 w-4 text-slate-400 group-hover:text-[#0062AF]" />
                  </div>
                  {attachment ? (
                    <div className="flex-1 flex items-center justify-between min-w-0">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{attachment.name}</p>
                        <p className="text-[10px] text-slate-400">{formatFileSize(attachment.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setAttachment(null); if (attachmentInputRef.current) attachmentInputRef.current.value = ''; }}
                        className="ml-3 h-6 w-6 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100 transition-colors flex-none"
                      >
                        <TrashIcon className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-400 group-hover:text-[#0062AF] transition-colors font-medium">
                        Cliquer pour joindre un fichier
                      </p>
                      <p className="text-[10px] text-slate-300">max 25 Mo</p>
                    </div>
                  )}
                  <input type="file" ref={attachmentInputRef} onChange={handleAttachmentChange} className="hidden" />
                </label>
              </Field>

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-200 bg-white mt-auto">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50 shadow-sm"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading || recipients.length === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Envoi en cours…</>
                  : <><PaperAirplaneIcon className="h-4 w-4" /> {recipients.length > 1 ? `Envoyer (${recipients.length})` : 'Envoyer'}</>
                }
              </button>
            </div>
          </form>

          {/* ── Side panel ─────────────────────────────────────── */}
          {showPanel && (
            <div className="w-72 flex-none border-l border-slate-100 bg-white flex flex-col overflow-hidden">

              {/* ── Recipient search panel ── */}
              {showSearch && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex-none">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-[#0062AF] flex items-center justify-center">
                        <UsersIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">Recherche Destinataires</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Clients & utilisateurs</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto flex flex-col p-4 gap-3">

                    {/* Search input */}
                    <div className="relative">
                      <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher par nom…"
                        autoFocus
                        className="w-full pl-8 pr-8 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] placeholder:text-slate-300 bg-slate-50 text-slate-700"
                      />
                      {searchLoading && (
                        <ArrowPathIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />
                      )}
                    </div>

                    {/* Selected recap */}
                    {recipients.length > 0 && (
                      <div className="px-3 py-2 bg-[#0062AF]/5 rounded-xl border border-[#0062AF]/10">
                        <p className="text-[10px] font-bold text-[#0062AF] uppercase tracking-widest mb-1.5">
                          {recipients.length} sélectionné{recipients.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {recipients.map(r => (
                            <span key={r.email} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#0062AF]/10 text-[#0062AF] text-[10px] font-semibold rounded-lg">
                              <span className="font-bold">{r.name}</span>
                              <span className="text-[#0062AF]/60 font-normal">{r.email}</span>
                              <button type="button" onClick={() => removeRecipient(r.email)}>
                                <XMarkIcon className="h-2.5 w-2.5 hover:text-red-500" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    <div className="space-y-1.5">
                      {!searchQuery && !searchLoading && (
                        <p className="text-xs text-slate-300 text-center py-8 font-medium">
                          Tapez un nom pour rechercher…
                        </p>
                      )}
                      {searchQuery && !searchLoading && searchResults.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-8">
                          Aucun résultat pour « {searchQuery} »
                        </p>
                      )}
                      {searchResults.map((contact) => {
                        const selected = isSelected(contact.email);
                        return (
                          <button
                            key={contact.email}
                            type="button"
                            onClick={() => selected ? removeRecipient(contact.email) : addRecipient(contact)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all border ${
                              selected
                                ? 'bg-[#0062AF]/8 border-[#0062AF]/30 bg-blue-50'
                                : 'bg-white border-slate-200 hover:border-[#0062AF]/40 hover:bg-blue-50/30'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black transition-colors ${
                              selected ? 'bg-[#0062AF] text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {selected
                                ? <CheckIcon className="h-3.5 w-3.5" />
                                : contact.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{contact.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{contact.email}</p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold flex-none ${
                              contact.type === 'Client'     ? 'bg-amber-100 text-amber-600'
                              : contact.type === 'Admin'   ? 'bg-red-100 text-red-600'
                              : contact.type === 'Agent'   ? 'bg-blue-100 text-blue-600'
                              : contact.type === 'Technicien' ? 'bg-green-100 text-green-600'
                              : 'bg-slate-100 text-slate-500'
                            }`}>
                              {contact.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* ── AI panel ── */}
              {showAI && (
                <>
                  <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex-none">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-[#0062AF] flex items-center justify-center">
                        <SparklesIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-slate-800">Assistant IA</h3>
                        <p className="text-[10px] text-slate-400 font-medium">Génération automatique</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Décrivez l'email
                      </label>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="ex : relancer M. Ali pour la facture impayée de 5 000 DT…"
                        rows={5}
                        className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/20 focus:border-[#0062AF] resize-none placeholder:text-slate-300 bg-slate-50 text-slate-700"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      disabled={aiGenerating || !aiPrompt.trim()}
                      className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-[#0062AF] hover:bg-[#004a85] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {aiGenerating
                        ? <><ArrowPathIcon className="h-3.5 w-3.5 animate-spin" /> Génération…</>
                        : <><SparklesIcon className="h-3.5 w-3.5" /> Générer</>
                      }
                    </button>

                    {aiError && (
                      <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{aiError}</p>
                    )}

                    {aiResponse && !aiGenerating && (
                      <div className="space-y-3 pt-3 border-t border-slate-100">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Objet suggéré</p>
                          <p className="text-xs text-slate-700 font-semibold leading-snug mb-2.5">{aiResponse.objet}</p>
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, subject: aiResponse.objet }))}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-[#0062AF] text-white rounded-lg hover:bg-[#004a85] transition-colors"
                          >
                            <CheckIcon className="h-3 w-3" /> Utiliser
                          </button>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Corps du message</p>
                          <div className="text-[11px] text-slate-600 whitespace-pre-wrap max-h-36 overflow-y-auto mb-2.5 leading-relaxed">
                            {aiResponse.corps}
                          </div>
                          <button
                            type="button"
                            onClick={() => setFormData((p) => ({ ...p, message: aiResponse.corps }))}
                            className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-[#0062AF] text-white rounded-lg hover:bg-[#004a85] transition-colors"
                          >
                            <CheckIcon className="h-3 w-3" /> Utiliser
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleGenerateAI}
                          className="w-full text-xs py-2 flex justify-center items-center gap-1.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 hover:border-slate-300 transition-colors font-semibold"
                        >
                          <ArrowPathIcon className="h-3 w-3" /> Regénérer
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
