import { useRef, useState } from 'react';
import {
  XMarkIcon, SparklesIcon, CheckIcon, ArrowPathIcon,
  PaperClipIcon, PaperAirplaneIcon, EnvelopeIcon,
  TagIcon, TrashIcon,
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
  const [formData, setFormData]   = useState({ to: initialTo, subject: '', message: '' });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const attachmentInputRef        = useRef(null);

  const [showAI, setShowAI]           = useState(false);
  const [aiPrompt, setAiPrompt]       = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError]         = useState(null);
  const [aiResponse, setAiResponse]   = useState(null);
  const [reformulating, setReformulating] = useState(false);

  const MAX_SIZE = 25 * 1024 * 1024;

  const resetForm = () => {
    setFormData({ to: '', subject: '', message: '' });
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    setShowAI(false);
    setAiPrompt('');
    setAiResponse(null);
    setAiError(null);
    setError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    try {
      const res = await axios.post('/ia/reformulate-email', { text: formData.message });
      const payload = res?.data || res;
      if (payload?.corrected) setFormData((prev) => ({ ...prev, message: payload.corrected }));
    } catch {
      alert('Erreur lors de la correction du texte.');
    } finally {
      setReformulating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('recipientEmail', formData.to);
      payload.append('subject', formData.subject);
      payload.append('messageText', formData.message);
      if (attachment) payload.append('attachment', attachment);
      await axios.post('/messages/send', payload, { timeout: 120000 });
      resetForm();
      if (onSuccess) onSuccess();
      alert('Email envoyé avec succès ✅');
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
            <button
              type="button"
              onClick={() => setShowAI(!showAI)}
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

        {/* thin accent line */}
        <div className="h-px bg-slate-100 flex-none" />

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">

          {/* Form side */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 bg-slate-50/40">

            {/* Error banner */}
            {error && (
              <div className="mx-5 mt-4 flex items-center gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5">
                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-500 text-xs font-black">!</span>
                </div>
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            <div className="px-7 py-5 space-y-4">

              {/* À */}
              <Field label="À" required icon={EnvelopeIcon}>
                <input
                  type="email"
                  name="to"
                  value={formData.to}
                  onChange={handleChange}
                  placeholder="destinataire@example.com"
                  required
                  className={inputClass}
                />
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

            {/* ── Footer ─────────────────────────────────────── */}
            <div className="flex items-center justify-end gap-3 px-7 py-4 border-t border-slate-200 bg-white">
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
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0062AF] hover:bg-[#004a85] text-sm font-bold text-white shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Envoi en cours…</>
                  : <><PaperAirplaneIcon className="h-4 w-4" /> Envoyer</>
                }
              </button>
            </div>
          </form>

          {/* ── AI side panel ──────────────────────────────────── */}
          {showAI && (
            <div className="w-72 flex-none border-l border-slate-100 bg-white flex flex-col overflow-hidden">

              {/* AI header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
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

                    {/* Subject suggestion */}
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

                    {/* Body suggestion */}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
