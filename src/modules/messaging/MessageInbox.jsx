import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PlusIcon,
  TrashIcon,
  EnvelopeOpenIcon,
  EnvelopeIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  InboxIcon,
  PaperClipIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { fetchMessages, markAsRead, markAsUnread, deleteMessage } from './messageSlice';
import ComposeEmailModal from './ComposeEmailModal';
import GmailConnectButton from './GmailConnectButton';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatRelativeDate, formatFileSize } from '../../utils/format';
import axios from '../../app/axios';

const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};

const avatarColors = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-emerald-500 to-teal-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-indigo-500 to-blue-500',
];

const getAvatarColor = (id) => avatarColors[(id || 0) % avatarColors.length];

const MessageInbox = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { messages, loading, unreadCount, pagination } = useSelector((s) => s.messages);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [gmailConnected, setGmailConnected] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    dispatch(fetchMessages({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (location.state?.composeTo) {
      setComposeTo(location.state.composeTo);
      setShowComposeModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get('/auth/gmail/status');
        setGmailConnected(res.data.authorized);
      } catch {
        setGmailConnected(false);
      }
    };
    check();
  }, []);

  const handleMarkAsRead = (messageId, isRead) => {
    if (isRead) dispatch(markAsUnread(messageId));
    else dispatch(markAsRead(messageId));
  };

  const handleDeleteMessage = (messageId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message?')) {
      dispatch(deleteMessage(messageId));
      if (selectedMessage?.ID === messageId) setSelectedMessage(null);
    }
  };

  const handleDownloadAttachment = async (message) => {
    try {
      const response = await axios.get(`/messages/${message.ID}/attachment`, { responseType: 'blob' });
      const rawBlob = response instanceof Blob ? response : response?.data;
      const contentType =
        response?.headers?.['content-type'] ||
        message.FileMimeType ||
        rawBlob?.type ||
        'application/octet-stream';
      const blob = new Blob([rawBlob], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = message.FileName || `pièce-jointe-${message.ID}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Impossible de télécharger la pièce jointe');
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    if (!message.IsRead) dispatch(markAsRead(message.ID));
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const sender = (m.sender?.USER_NAME || m.SenderName || '').toLowerCase();
    const subject = (m.Subject || '').toLowerCase();
    const body = (m.MessageUnicodeText || m.MessageText || '').toLowerCase();
    return sender.includes(q) || subject.includes(q) || body.includes(q);
  });

  if (loading && messages.length === 0) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in flex flex-col gap-0">
      {/* Top header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <InboxIcon className="h-7 w-7 text-cyan-600" />
            Messages
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 min-w-[1.5rem] px-1.5 rounded-full bg-cyan-600 text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            {unreadCount > 0 ? `${unreadCount} non lu(s)` : 'Boîte de réception'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GmailConnectButton isConnected={gmailConnected} onStatusChange={setGmailConnected} />
          <button
            onClick={() => dispatch(fetchMessages({ page: currentPage, limit: 10 }))}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-cyan-600 transition-colors shadow-sm"
            title="Actualiser"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowComposeModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            <PlusIcon className="h-4 w-4" />
            Nouveau
          </button>
        </div>
      </div>

      {/* Gmail alert */}
      {!gmailConnected && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="text-lg">📧</span>
          <p className="text-sm text-amber-800 flex-1">
            Connectez votre Gmail pour synchroniser automatiquement vos emails.
          </p>
        </div>
      )}

      {/* Main 2-panel layout */}
      <div className="flex gap-4" style={{ height: 'calc(100vh - 240px)', minHeight: '480px' }}>
        {/* Message list panel */}
        <div className={`flex flex-col bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 ${selectedMessage ? 'w-2/5 flex-none' : 'flex-1'}`}>
          {/* Search bar */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un message..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <EnvelopeIcon className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">Aucun message trouvé</p>
                <p className="text-xs text-slate-400 mt-1">
                  {searchQuery ? 'Essayez un autre terme de recherche' : 'Votre boîte de réception est vide'}
                </p>
              </div>
            ) : (
              filteredMessages.map((message) => {
                const senderName = message.sender?.USER_NAME || message.SenderName || `Utilisateur #${message.SenderID}`;
                const isSelected = selectedMessage?.ID === message.ID;
                return (
                  <button
                    key={message.ID}
                    onClick={() => handleMessageClick(message)}
                    className={`w-full text-left px-4 py-3.5 transition-all group ${
                      isSelected
                        ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-cyan-500'
                        : !message.IsRead
                        ? 'bg-blue-50/40 border-l-4 border-blue-400 hover:bg-blue-50'
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`flex-none h-9 w-9 rounded-xl bg-gradient-to-br ${getAvatarColor(message.SenderID)} flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                      >
                        {getInitials(senderName)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className={`text-sm truncate ${!message.IsRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                            {senderName}
                          </span>
                          <span className="text-xs text-slate-400 flex-none whitespace-nowrap">
                            {formatRelativeDate(message.SendingDate)}
                          </span>
                        </div>
                        <p className={`text-xs truncate mb-0.5 ${!message.IsRead ? 'font-semibold text-slate-700' : 'text-slate-500'}`}>
                          {message.Subject || '(Pas de sujet)'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          {message.MessageUnicodeText || message.MessageText || 'Pas de contenu'}
                        </p>
                      </div>

                      {/* Indicators */}
                      <div className="flex-none flex flex-col items-end gap-1.5">
                        {!message.IsRead && (
                          <span className="h-2 w-2 rounded-full bg-cyan-500" />
                        )}
                        {message.MessageDataSize > 0 && (
                          <PaperClipIcon className="h-3.5 w-3.5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                Préc.
              </button>
              <span className="text-xs text-slate-500">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suiv.
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Preview panel */}
        {selectedMessage ? (
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            {/* Preview header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-cyan-50/60">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-base font-bold text-slate-800 leading-snug flex-1">
                  {selectedMessage.Subject || '(Pas de sujet)'}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex-none text-slate-400 hover:text-slate-600 transition-colors"
                  title="Fermer"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-3">
                {(() => {
                  const name =
                    selectedMessage.sender?.USER_NAME ||
                    selectedMessage.SenderName ||
                    `Utilisateur #${selectedMessage.SenderID}`;
                  return (
                    <>
                      <div
                        className={`h-9 w-9 rounded-xl bg-gradient-to-br ${getAvatarColor(selectedMessage.SenderID)} flex items-center justify-center text-white text-xs font-bold shadow-sm flex-none`}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{name}</p>
                        {selectedMessage.recipient && (
                          <p className="text-xs text-slate-500 truncate">
                            À:{' '}
                            {selectedMessage.recipient.USER_NAME ||
                              `Utilisateur #${selectedMessage.RecipientID}`}
                          </p>
                        )}
                      </div>
                      <span className="flex-none text-xs text-slate-400 whitespace-nowrap">
                        {new Date(selectedMessage.SendingDate).toLocaleString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="bg-slate-50 rounded-xl p-5 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[120px]">
                {selectedMessage.MessageUnicodeText || selectedMessage.MessageText || (
                  <span className="text-slate-400 italic">Pas de contenu</span>
                )}
              </div>

              {/* Attachment */}
              {selectedMessage.MessageDataSize > 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-cyan-300 bg-cyan-50 p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-cyan-100 flex items-center justify-center flex-none">
                    <PaperClipIcon className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {selectedMessage.FileName || 'Pièce jointe'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(selectedMessage.MessageDataSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(selectedMessage)}
                    className="flex-none inline-flex items-center gap-1.5 rounded-lg bg-white border border-cyan-200 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-50 transition-colors shadow-sm"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Télécharger
                  </button>
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
              <button
                onClick={() => handleMarkAsRead(selectedMessage.ID, selectedMessage.IsRead)}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                {selectedMessage.IsRead ? (
                  <>
                    <EnvelopeIcon className="h-4 w-4" />
                    Marquer non lu
                  </>
                ) : (
                  <>
                    <EnvelopeOpenIcon className="h-4 w-4" />
                    Marquer lu
                  </>
                )}
              </button>
              <button
                onClick={() => handleDeleteMessage(selectedMessage.ID)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
              >
                <TrashIcon className="h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        ) : (
          /* Empty preview state */
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 hidden lg:flex flex-col items-center justify-center text-center p-10">
            <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-5 shadow-sm">
              <EnvelopeOpenIcon className="h-10 w-10 text-cyan-500" />
            </div>
            <p className="text-base font-semibold text-slate-600">Sélectionnez un message</p>
            <p className="text-sm text-slate-400 mt-1 max-w-xs">
              Cliquez sur un message pour afficher son contenu ici.
            </p>
          </div>
        )}
      </div>

      <ComposeEmailModal
        isOpen={showComposeModal}
        initialTo={composeTo}
        onClose={() => { setShowComposeModal(false); setComposeTo(''); }}
        onSuccess={() => {
          setShowComposeModal(false);
          setComposeTo('');
          dispatch(fetchMessages({ page: 1, limit: 10 }));
        }}
      />
    </div>
  );
};

export default MessageInbox;
