import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  PlusIcon,
  TrashIcon,
  EnvelopeOpenIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { fetchMessages, markAsRead, markAsUnread, deleteMessage } from './messageSlice';
import ComposeEmailModal from './ComposeEmailModal';
import GmailConnectButton from './GmailConnectButton';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatRelativeDate } from '../../utils/format';
import axios from '../../app/axios';

const MessageInbox = () => {
  const dispatch = useDispatch();
  const { messages, loading, unreadCount, pagination } = useSelector((state) => state.messages);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchMessages({ page: currentPage, limit: 10 }));
  }, [dispatch, currentPage]);

  // Vérifier le statut Gmail
  useEffect(() => {
    const checkGmailStatus = async () => {
      try {
        const response = await axios.get('/auth/gmail/status');
        setGmailConnected(response.data.authorized);
      } catch (error) {
        console.log('Gmail non connecté');
        setGmailConnected(false);
      }
    };
    checkGmailStatus();
  }, []);

  const handleMarkAsRead = (messageId, isRead) => {
    if (isRead) {
      dispatch(markAsUnread(messageId));
    } else {
      dispatch(markAsRead(messageId));
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce message?')) {
      dispatch(deleteMessage(messageId));
    }
  };

  const handleMessageClick = (message) => {
    setSelectedMessage(message);
    if (!message.IsRead) {
      dispatch(markAsRead(message.ID));
    }
  };

  if (loading && messages.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="animate-fade-in h-full">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Messages</h1>
          <p className="mt-2 text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'Tous les messages sont lus'}
          </p>
        </div>
        <div className="flex gap-3">
          <GmailConnectButton isConnected={gmailConnected} onStatusChange={setGmailConnected} />
          <button
            onClick={() => setShowComposeModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Nouveau message
          </button>
        </div>
      </div>

      {/* Gmail Status Alert */}
      {!gmailConnected && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            📧 Connectez votre Gmail pour synchroniser automatiquement vos emails
          </p>
        </div>
      )}

      {/* Messages Container */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Messages List */}
        <div className="lg:col-span-2 space-y-2">
          {messages.length === 0 ? (
            <div className="rounded-lg bg-white p-12 text-center shadow">
              <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">Aucun message</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((message) => (
                <div
                  key={message.ID}
                  onClick={() => handleMessageClick(message)}
                  className={`rounded-lg bg-white p-4 shadow hover:shadow-md transition-all cursor-pointer ${
                    !message.IsRead
                      ? 'border-l-4 border-primary-600 bg-primary-50'
                      : selectedMessage?.ID === message.ID
                      ? 'ring-2 ring-primary-600'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={`text-sm ${!message.IsRead ? 'font-bold' : 'font-medium'} text-slate-800`}
                        >
                          {message.sender?.USER_NAME
                            ? message.sender.USER_NAME
                            : message.SenderName || `Expéditeur #${message.SenderID}`}
                        </h3>
                        {!message.IsRead && (
                          <span className="inline-flex h-2 w-2 rounded-full bg-primary-600"></span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {message.Subject || '(Pas de sujet)'}
                      </p>
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {message.MessageUnicodeText || message.MessageText || 'Pas de contenu'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {formatRelativeDate(message.SendingDate)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination?.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm rounded-lg bg-white shadow disabled:opacity-50 hover:shadow-md"
              >
                Précédent
              </button>
              <page className="text-sm text-gray-600">
                Page {currentPage} sur {pagination.totalPages}
              </page>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))
                }
                disabled={currentPage === pagination.totalPages}
                className="px-3 py-2 text-sm rounded-lg bg-white shadow disabled:opacity-50 hover:shadow-md"
              >
                Suivant
              </button>
            </div>
          )}
        </div>

        {/* Message Preview */}
        {selectedMessage && (
          <div className="lg:col-span-1">
            <div className="sticky top-4 rounded-lg bg-white shadow p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">
                {selectedMessage.Subject || '(Pas de sujet)'}
              </h2>

              <div className="mb-4 pb-4 border-b">
                <p className="text-sm text-gray-600">
                  <strong>De:</strong> {selectedMessage.sender?.USER_NAME
                    ? selectedMessage.sender.USER_NAME
                    : selectedMessage.SenderName || `Utilisateur #${selectedMessage.SenderID}`}
                </p>
                {selectedMessage.recipient && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>À:</strong> {selectedMessage.recipient.USER_NAME
                      ? selectedMessage.recipient.USER_NAME
                      : `Utilisateur #${selectedMessage.RecipientID}`}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Date:</strong> {new Date(selectedMessage.SendingDate).toLocaleString('fr-FR')}
                </p>
              </div>

              <div className="mb-6 bg-gray-50 p-4 rounded text-sm text-gray-700 whitespace-pre-wrap">
                {selectedMessage.MessageUnicodeText || selectedMessage.MessageText}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    handleMarkAsRead(selectedMessage.ID, selectedMessage.IsRead)
                  }
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {selectedMessage.IsRead ? (
                    <>
                      <EnvelopeIcon className="h-4 w-4" />
                      Non lu
                    </>
                  ) : (
                    <>
                      <EnvelopeOpenIcon className="h-4 w-4" />
                      Marquer comme lu
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.ID)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
                >
                  <TrashIcon className="h-4 w-4" />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compose Modal */}
      <ComposeEmailModal
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
        onSuccess={() => {
          setShowComposeModal(false);
          dispatch(fetchMessages({ page: 1, limit: 10 }));
        }}
      />
    </div>
  );
};

export default MessageInbox;
