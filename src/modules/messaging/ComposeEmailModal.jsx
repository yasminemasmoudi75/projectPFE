import { useRef, useState } from 'react';
import { XMarkIcon, SparklesIcon, CheckIcon, ArrowPathIcon, PaperClipIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatFileSize } from '../../utils/format';

const InputField = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
  </div>
);

const ComposeEmailModal = ({ isOpen, onClose, onSuccess, initialTo = '' }) => {
  const [formData, setFormData] = useState({ to: initialTo, subject: '', message: '' });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const attachmentInputRef = useRef(null);

  const [showAI, setShowAI] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
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
    'w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder:text-slate-400 transition-shadow';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/20">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 flex-none">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
              <PaperAirplaneIcon className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-base font-bold text-white">Nouveau message</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAI(!showAI)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                showAI
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
              }`}
            >
              <SparklesIcon className="h-4 w-4" />
              Assistant IA ✨
            </button>
            <button
              onClick={handleClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden bg-slate-50">
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto p-6 gap-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <InputField label="À" required>
              <input
                type="email"
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="destinataire@example.com"
                required
                className={inputClass}
              />
            </InputField>

            <InputField label="Sujet" required>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Objet de votre message"
                required
                className={inputClass}
              />
            </InputField>

            <InputField label="Message" required>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Écrivez votre message..."
                rows={10}
                required
                className={`${inputClass} resize-none`}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-slate-400">{formData.message.length} caractères</span>
                <button
                  type="button"
                  onClick={handleReformulate}
                  disabled={reformulating || !formData.message.trim()}
                  className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors font-medium disabled:opacity-50"
                >
                  {reformulating ? (
                    <><ArrowPathIcon className="h-3 w-3 animate-spin" /> Correction...</>
                  ) : (
                    <><SparklesIcon className="h-3 w-3" /> Corriger & Reformuler</>
                  )}
                </button>
              </div>
            </InputField>

            {/* Attachment */}
            <InputField label="Pièce jointe">
              <label className="flex items-center gap-3 px-4 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/30 transition-all group">
                <div className="h-8 w-8 rounded-lg bg-slate-100 group-hover:bg-cyan-100 flex items-center justify-center transition-colors flex-none">
                  <PaperClipIcon className="h-4 w-4 text-slate-500 group-hover:text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  {attachment ? (
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {attachment.name}
                      <span className="ml-2 text-xs text-slate-400">({formatFileSize(attachment.size)})</span>
                    </p>
                  ) : (
                    <p className="text-sm text-slate-400">Cliquer pour joindre un fichier <span className="text-xs">(max 25 Mo)</span></p>
                  )}
                </div>
                <input
                  type="file"
                  ref={attachmentInputRef}
                  onChange={handleAttachmentChange}
                  className="hidden"
                />
              </label>
            </InputField>

            {/* Footer actions */}
            <div className="flex items-center justify-end gap-3 pt-2 mt-auto border-t border-slate-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Envoi en cours...</>
                ) : (
                  <><PaperAirplaneIcon className="h-4 w-4" /> Envoyer</>
                )}
              </button>
            </div>
          </form>

          {/* AI panel */}
          {showAI && (
            <div className="w-80 flex-none border-l border-slate-200 bg-white flex flex-col overflow-y-auto">
              {/* AI panel header */}
              <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-indigo-50">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Assistant Rédaction IA</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1">Décrivez l'email que vous souhaitez rédiger</p>
              </div>

              <div className="flex-1 p-5 space-y-4">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="ex: relancer M. Ali concernant la facture impayée de 5000 DT..."
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-slate-400 bg-slate-50"
                />
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-indigo-700 transition-all shadow-sm disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Génération...</>
                  ) : (
                    <><SparklesIcon className="h-4 w-4" /> Générer</>
                  )}
                </button>
                {aiError && <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{aiError}</p>}

                {aiResponse && !aiGenerating && (
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    {/* Suggested subject */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Objet suggéré</p>
                      <p className="text-sm text-slate-800 font-medium mb-3 leading-snug">{aiResponse.objet}</p>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, subject: aiResponse.objet }))}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 font-medium transition-colors"
                      >
                        <CheckIcon className="h-3 w-3" /> Utiliser
                      </button>
                    </div>

                    {/* Suggested body */}
                    <div className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Corps suggéré</p>
                      <div className="text-xs text-slate-700 whitespace-pre-wrap max-h-40 overflow-y-auto mb-3 leading-relaxed">
                        {aiResponse.corps}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, message: aiResponse.corps }))}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg hover:bg-violet-100 font-medium transition-colors"
                      >
                        <CheckIcon className="h-3 w-3" /> Utiliser
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateAI}
                      className="w-full text-xs py-2 flex justify-center items-center gap-1.5 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
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
