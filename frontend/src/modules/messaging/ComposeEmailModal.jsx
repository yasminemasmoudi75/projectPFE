import { useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatFileSize } from '../../utils/format';
import { SparklesIcon, CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const ComposeEmailModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    message: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const attachmentInputRef = useRef(null);

  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
  const [reformulating, setReformulating] = useState(false);

  const MAX_ATTACHMENT_SIZE = 25 * 1024 * 1024;

  const resetForm = () => {
    setFormData({
      to: '',
      subject: '',
      message: '',
    });
    setAttachment(null);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = '';
    }
    setShowAIAssistant(false);
    setAiPrompt('');
    setAiResponse(null);
    setAiError(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files?.[0] || null;

    if (!file) {
      setAttachment(null);
      return;
    }

    if (file.size > MAX_ATTACHMENT_SIZE) {
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
      const response = await axios.post('/ia/generate-email', { prompt: aiPrompt });
      // The axios interceptor returns the data directly. The payload is { status: 'success', data: { objet, corps } }
      // Therefore, response.data contains the { objet, corps } object.
      setAiResponse(response?.data || response);
    } catch (err) {
      console.error('Erreur génération IA:', err);
      setAiError(err.response?.data?.message || 'Erreur lors de la génération. Veuillez réessayer.');
    } finally {
      setAiGenerating(false);
    }
  };

  const applyAISubject = () => {
    if (aiResponse?.objet) {
      setFormData(prev => ({ ...prev, subject: aiResponse.objet }));
    }
  };

  const applyAIBody = () => {
    if (aiResponse?.corps) {
      setFormData(prev => ({ ...prev, message: aiResponse.corps }));
    }
  };

  const handleReformulate = async () => {
    if (!formData.message.trim()) return;
    setReformulating(true);
    try {
      const response = await axios.post('/ia/reformulate-email', { text: formData.message });
      const payload = response?.data || response;
      if (payload?.corrected) {
        setFormData(prev => ({ ...prev, message: payload.corrected }));
      }
    } catch (err) {
      console.error('Erreur reformulation:', err);
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

      if (attachment) {
        payload.append('attachment', attachment);
      }

      await axios.post('/messages/send', payload, { timeout: 120000 });

      // Réinitialiser le formulaire
      resetForm();

      // Notifier et fermer le modal
      if (onSuccess) {
        onSuccess();
      }

      // Afficher message de succès
      alert('Email envoyé avec succès ✅');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Erreur lors de l\'envoi du message'
      );
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center sm:p-0">
        <div className="relative w-full transform overflow-hidden rounded-lg bg-white text-left shadow-lg transition-all sm:my-8 sm:max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b bg-gradient-to-r from-primary-50 to-primary-100 px-6 py-4">
            <h2 className="text-lg font-bold text-slate-800">Nouveau message</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAIAssistant(!showAIAssistant)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${showAIAssistant ? 'bg-primary-600 text-white' : 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50'}`}
              >
                <SparklesIcon className="h-4 w-4" />
                Assistant IA ✨
              </button>
              <button
                onClick={handleClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-col md:flex-row overflow-hidden flex-1">
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 border-r border-slate-100">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

            {/* To Field */}
            <div>
              <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-2">
                À <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="to"
                name="to"
                value={formData.to}
                onChange={handleChange}
                placeholder="destinataire@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Subject Field */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                Sujet <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Objet de votre message"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Message Field */}
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Écrivez votre message..."
                rows={14}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                style={{ minHeight: '300px' }}
              ></textarea>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-gray-500">
                  {formData.message.length} caractères
                </p>
                <button
                  type="button"
                  onClick={handleReformulate}
                  disabled={reformulating || !formData.message.trim()}
                  className="flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md transition-colors font-medium disabled:opacity-50"
                  title="Corriger les fautes et reformuler ce texte avec l'IA"
                >
                  {reformulating ? (
                    <><ArrowPathIcon className="h-3 w-3 animate-spin" /> Correction...</>
                  ) : (
                    <><SparklesIcon className="h-3 w-3" /> Corriger & Reformuler</>
                  )}
                </button>
              </div>
            </div>

            {/* Attachment Field */}
            <div>
              <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">
                Pièce jointe
              </label>
              <input
                type="file"
                id="attachment"
                name="attachment"
                ref={attachmentInputRef}
                onChange={handleAttachmentChange}
                className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Taille maximale: 25 Mo
              </p>
              {attachment && (
                <p className="mt-2 text-xs text-gray-700">
                  Fichier sélectionné: {attachment.name} ({formatFileSize(attachment.size)})
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </form>

          {/* AI Assistant Panel */}
          {showAIAssistant && (
            <div className="w-full md:w-80 bg-slate-50 border-l border-slate-200 flex flex-col p-5 overflow-y-auto max-h-[60vh] md:max-h-full">
              <div className="flex items-center gap-2 mb-4">
                <SparklesIcon className="h-5 w-5 text-primary-600" />
                <h3 className="font-bold text-slate-800">Assistant Rédaction IA</h3>
              </div>
              
              <div className="space-y-3 mb-6">
                <label className="block text-sm text-slate-600">
                  Décrivez l'email que vous voulez rédiger...
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="ex: relancer monsieur Ali concernant la facture impayée de 5000 DT..."
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                ></textarea>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors disabled:opacity-50"
                >
                  {aiGenerating ? (
                    <span className="flex items-center gap-2"><ArrowPathIcon className="h-4 w-4 animate-spin" /> Génération...</span>
                  ) : (
                    <span className="flex items-center gap-2"><SparklesIcon className="h-4 w-4" /> Générer</span>
                  )}
                </button>
                {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
              </div>

              {aiResponse && !aiGenerating && (
                <div className="space-y-4 animate-fade-in border-t border-slate-200 pt-4">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Objet suggéré</p>
                    <p className="text-sm text-slate-800 font-medium mb-2">{aiResponse.objet}</p>
                    <button
                      type="button"
                      onClick={applyAISubject}
                      className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <CheckIcon className="h-3 w-3" /> Utiliser cet objet
                    </button>
                  </div>

                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Corps suggéré</p>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap max-h-48 overflow-y-auto mb-2 text-xs">
                      {aiResponse.corps}
                    </div>
                    <button
                      type="button"
                      onClick={applyAIBody}
                      className="text-xs flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      <CheckIcon className="h-3 w-3" /> Utiliser ce contenu
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    className="w-full mt-2 text-xs py-1.5 flex justify-center items-center gap-1 border border-slate-300 rounded text-slate-600 hover:bg-slate-100"
                  >
                    <ArrowPathIcon className="h-3 w-3" /> Regénérer
                  </button>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
