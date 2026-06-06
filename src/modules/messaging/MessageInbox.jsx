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
  PaperAirplaneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useLocation } from 'react-router-dom';
import { fetchMessages, markAsRead, markAsUnread, deleteMessage } from './messageSlice';
import ComposeEmailModal from './ComposeEmailModal';
import GmailConnectButton from './GmailConnectButton';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatRelativeDate, formatFileSize } from '../../utils/format';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import usePermission from '../../hooks/usePermission';

/* ── helpers ─────────────────────────────────────────────────────── */
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
};

const AVATAR_COLORS = ['#0062AF', '#7c3aed', '#059669', '#db2777', '#d97706', '#0284c7'];
const getAvatarStyle = (id) => ({ background: AVATAR_COLORS[(id || 0) % AVATAR_COLORS.length] });

/* ════════════════════════════════════════════════════════════════ */
const MessageInbox = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { messages, loading, unreadCount, pagination } = useSelector((s) => s.messages);
  const { isAdmin, isTechnicien } = useAuth();
  const canSend = !isTechnicien;
  const { canDelete: canDeleteMessage } = usePermission(2);

  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeTo, setComposeTo]               = useState('');
  const [gmailConnected, setGmailConnected]     = useState(false);
  const [gmailBannerDismissed, setGmailBannerDismissed] = useState(false);
  const [selectedMessage, setSelectedMessage]   = useState(null);
  const [currentPage, setCurrentPage]           = useState(1);
  const [searchQuery, setSearchQuery]           = useState('');
  const [activeFilter, setActiveFilter]         = useState('all'); // 'all' | 'unread'

  useEffect(() => {
    dispatch(fetchMessages({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (canSend && location.state?.composeTo) {
      setComposeTo(location.state.composeTo);
      setShowComposeModal(true);
    }
  }, [location.state, canSend]);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get('/auth/gmail/status');
        setGmailConnected(res.data.authorized);
      } catch {
        setGmailConnected(false);
      }
    })();
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
      const rawBlob  = response instanceof Blob ? response : response?.data;
      const ct       = response?.headers?.['content-type'] || message.FileMimeType || rawBlob?.type || 'application/octet-stream';
      const blob     = new Blob([rawBlob], { type: ct });
      const url      = window.URL.createObjectURL(blob);
      const link     = document.createElement('a');
      link.href      = url;
      link.download  = message.FileName || `pièce-jointe-${message.ID}`;
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

  const handleReply = () => {
    const senderName = selectedMessage?.sender?.USER_NAME || selectedMessage?.SenderName || '';
    setComposeTo(senderName);
    setShowComposeModal(true);
  };

  const baseFiltered = messages.filter((m) => {
    if (activeFilter === 'unread' && m.IsRead) return false;
    if (!searchQuery.trim()) return true;
    const q      = searchQuery.toLowerCase();
    const sender = (m.sender?.USER_NAME || m.SenderName || '').toLowerCase();
    const subj   = (m.Subject || '').toLowerCase();
    const body   = (m.MessageUnicodeText || m.MessageText || '').toLowerCase();
    return sender.includes(q) || subj.includes(q) || body.includes(q);
  });

  if (loading && messages.length === 0) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in flex flex-col h-full">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl flex items-center justify-center shadow-sm bg-[#0062AF]">
            <InboxIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
              Messages
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center h-5 min-w-[1.25rem] px-1.5 rounded-full bg-[#0062AF] text-white text-[10px] font-black">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              {unreadCount > 0 ? `${unreadCount} message${unreadCount > 1 ? 's' : ''} non lu${unreadCount > 1 ? 's' : ''}` : 'Boîte de réception'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GmailConnectButton isConnected={gmailConnected} onStatusChange={setGmailConnected} />
          <button
            onClick={() => dispatch(fetchMessages({ page: currentPage, limit: 10 }))}
            className="h-9 w-9 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-[#0062AF] hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm"
            title="Actualiser"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
          {canSend && (
            <button
              onClick={() => setShowComposeModal(true)}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white bg-[#0062AF] hover:bg-[#004a85] shadow-sm transition-all"
            >
              <PlusIcon className="h-4 w-4" />
              Nouveau message
            </button>
          )}
        </div>
      </div>

      {/* ── Gmail banner ─────────────────────────────────────── */}
      {!gmailConnected && !gmailBannerDismissed && (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
          <div className="h-8 w-8 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-base leading-none">📧</span>
          </div>
          <p className="text-sm text-[#0062AF] font-medium flex-1">
            Connectez votre compte Gmail pour synchroniser automatiquement vos emails.
          </p>
          <button
            onClick={() => setGmailBannerDismissed(true)}
            className="flex-shrink-0 h-6 w-6 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
          >
            <XMarkIcon className="h-3.5 w-3.5 text-blue-500" />
          </button>
        </div>
      )}

      {/* ── Main 2-panel ─────────────────────────────────────── */}
      <div className="flex gap-3 flex-1 min-h-0" style={{ height: 'calc(100vh - 220px)', minHeight: '480px' }}>

        {/* ── LEFT: message list ──────────────────────────────── */}
        <div className={`flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${selectedMessage ? 'w-[340px] flex-none' : 'flex-1'}`}>

          {/* Filter tabs + search */}
          <div className="px-3 pt-3 pb-0 border-b border-slate-100 space-y-2.5">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              {[
                { id: 'all',    label: 'Tous',      count: messages.length  },
                { id: 'unread', label: 'Non lus',   count: unreadCount       },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeFilter === tab.id
                      ? 'bg-white text-[#0062AF] shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                      activeFilter === tab.id ? 'bg-[#0062AF] text-white' : 'bg-slate-200 text-slate-500'
                    }`}>{tab.count}</span>
                  )}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative mb-3">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0062AF]/30 focus:border-[#0062AF] placeholder:text-slate-400 transition-all"
              />
            </div>
          </div>

          {/* Message items */}
          <div className="flex-1 overflow-y-auto">
            {baseFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-6">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-3">
                  <EnvelopeIcon className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-semibold text-slate-500">Aucun message</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {searchQuery ? 'Essayez un autre terme' : activeFilter === 'unread' ? 'Tout est lu !' : 'Boîte vide'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {baseFiltered.map((message) => {
                  const senderName = message.sender?.USER_NAME || message.SenderName || `Utilisateur #${message.SenderID}`;
                  const isSelected = selectedMessage?.ID === message.ID;
                  return (
                    <div
                      key={message.ID}
                      onClick={() => handleMessageClick(message)}
                      className={`w-full text-left px-4 py-3.5 transition-all group relative cursor-pointer ${
                        isSelected
                          ? 'bg-[#0062AF]/5 border-l-[3px] border-[#0062AF]'
                          : !message.IsRead
                          ? 'bg-blue-50/60 border-l-[3px] border-blue-300 hover:bg-blue-50'
                          : 'border-l-[3px] border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div
                          className="flex-none h-8 w-8 rounded-xl flex items-center justify-center text-white text-[10px] font-black shadow-sm flex-shrink-0"
                          style={getAvatarStyle(message.SenderID)}
                        >
                          {getInitials(senderName)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span className={`text-xs truncate ${!message.IsRead ? 'font-black text-slate-900' : 'font-semibold text-slate-700'}`}>
                              {senderName}
                            </span>
                            <span className="text-[10px] text-slate-400 flex-none whitespace-nowrap font-medium">
                              {formatRelativeDate(message.SendingDate)}
                            </span>
                          </div>
                          <p className={`text-xs truncate mb-0.5 ${!message.IsRead ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                            {message.Subject || '(Sans sujet)'}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate leading-tight">
                            {message.MessageUnicodeText || message.MessageText || 'Pas de contenu'}
                          </p>
                        </div>

                        {/* Right side: indicators + delete */}
                        <div className="flex-none flex flex-col items-end gap-1.5 mt-0.5">
                          {!message.IsRead && (
                            <span className="h-2 w-2 rounded-full bg-[#0062AF] shadow-sm shadow-blue-400/50" />
                          )}
                          {message.MessageDataSize > 0 && (
                            <PaperClipIcon className="h-3 w-3 text-slate-300" />
                          )}
                          {(isAdmin || canDeleteMessage) && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(message.ID); }}
                              className="h-6 w-6 rounded-lg flex items-center justify-center text-rose-400 bg-rose-50 border border-rose-200 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all shadow-sm"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeftIcon className="h-3.5 w-3.5" />
                Préc.
              </button>
              <span className="text-xs text-slate-500 font-medium">
                {currentPage} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={currentPage === pagination.totalPages}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suiv.
                <ChevronRightIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── RIGHT: preview panel ─────────────────────────────── */}
        {selectedMessage ? (
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-w-0">

            {/* Preview header */}
            <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-b from-slate-50/80 to-white relative overflow-hidden">
              {/* decorative accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#0062AF]" />

              <div className="flex items-start justify-between gap-4 mb-4">
                <h2 className="text-base font-black text-slate-900 leading-snug flex-1 pr-4">
                  {selectedMessage.Subject || '(Sans sujet)'}
                </h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="flex-none h-7 w-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  title="Fermer"
                >
                  <XMarkIcon className="h-4 w-4 text-slate-500" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {(() => {
                  const name =
                    selectedMessage.sender?.USER_NAME ||
                    selectedMessage.SenderName ||
                    `Utilisateur #${selectedMessage.SenderID}`;
                  return (
                    <>
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-sm flex-none"
                        style={getAvatarStyle(selectedMessage.SenderID)}
                      >
                        {getInitials(name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{name}</p>
                        {selectedMessage.recipient && (
                          <p className="text-xs text-slate-400 truncate">
                            À&nbsp;: {selectedMessage.recipient.USER_NAME || `Utilisateur #${selectedMessage.RecipientID}`}
                          </p>
                        )}
                      </div>
                      <div className="flex-none text-right">
                        <p className="text-xs font-semibold text-slate-500">
                          {new Date(selectedMessage.SendingDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(selectedMessage.SendingDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Status badge */}
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                  selectedMessage.IsRead
                    ? 'bg-slate-100 text-slate-400 border-slate-200'
                    : 'bg-[#0062AF]/10 text-[#0062AF] border-blue-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedMessage.IsRead ? 'bg-slate-300' : 'bg-[#0062AF]'}`} />
                  {selectedMessage.IsRead ? 'Lu' : 'Non lu'}
                </span>
                {selectedMessage.MessageDataSize > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-amber-50 text-amber-600 border-amber-200">
                    <PaperClipIcon className="h-2.5 w-2.5" />
                    Pièce jointe
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="bg-slate-50 rounded-2xl border border-slate-100 px-5 py-4 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[120px] font-medium">
                {selectedMessage.MessageUnicodeText || selectedMessage.MessageText || (
                  <span className="text-slate-400 italic text-xs">Aucun contenu</span>
                )}
              </div>

              {/* Attachment */}
              {selectedMessage.MessageDataSize > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm p-4 flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-center flex-none">
                    <PaperClipIcon className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {selectedMessage.FileName || 'Pièce jointe'}
                    </p>
                    <p className="text-xs text-slate-400 font-medium">
                      {formatFileSize(selectedMessage.MessageDataSize)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDownloadAttachment(selectedMessage)}
                    className="flex-none inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#0062AF] hover:text-[#0062AF] hover:bg-blue-50 transition-all shadow-sm"
                  >
                    <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                    Télécharger
                  </button>
                </div>
              )}
            </div>

            {/* Actions footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center gap-2">
              {canSend && (
                <button
                  onClick={handleReply}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#0062AF] hover:bg-[#004a85] shadow-sm transition-all"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Répondre
                </button>
              )}
              <button
                onClick={() => handleMarkAsRead(selectedMessage.ID, selectedMessage.IsRead)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                {selectedMessage.IsRead ? (
                  <><EnvelopeIcon className="h-4 w-4" /> Marquer non lu</>
                ) : (
                  <><EnvelopeOpenIcon className="h-4 w-4" /> Marquer lu</>
                )}
              </button>
              {(isAdmin || canDeleteMessage) && (
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.ID)}
                  className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                  Supprimer
                </button>
              )}
            </div>
          </div>

        ) : (
          /* Empty preview */
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm hidden lg:flex flex-col items-center justify-center text-center relative overflow-hidden">

            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(circle, #0062AF 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

            {/* Envelope illustration */}
            <div className="relative mb-5 flex flex-col items-center">
              {/* outer glow ring */}
              <div className="absolute h-28 w-28 rounded-full bg-[#0062AF]/8 blur-xl" />
              {/* main circle */}
              <div className="relative h-20 w-20 rounded-2xl bg-[#0062AF]/10 border border-[#0062AF]/20 flex items-center justify-center shadow-inner">
                <EnvelopeOpenIcon className="h-9 w-9 text-[#0062AF]" strokeWidth={1.5} />
                {/* unread dot */}
                <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[#0062AF] border-2 border-white flex items-center justify-center shadow-sm">
                  <span className="text-white text-[8px] font-black leading-none">0</span>
                </span>
              </div>
            </div>

            <p className="text-[15px] font-black text-slate-800 tracking-tight">Aucun message sélectionné</p>
            <p className="text-xs text-slate-400 mt-1 max-w-[180px] leading-relaxed font-medium">
              Cliquez sur un message pour afficher son contenu ici.
            </p>

          </div>
        )}
      </div>

      {canSend && (
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
      )}
    </div>
  );
};

export default MessageInbox;
