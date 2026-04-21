import { useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatFileSize } from '../../utils/format';

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
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
              <p className="text-xs text-gray-500 mt-1">
                {formData.message.length} caractères
              </p>
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
        </div>
      </div>
    </div>
  );
};

export default ComposeEmailModal;
