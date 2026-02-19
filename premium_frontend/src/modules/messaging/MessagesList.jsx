import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PlusIcon } from '@heroicons/react/24/outline';
import { fetchMessages } from './messageSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';
import { formatRelativeDate } from '../../utils/format';

const MessagesList = () => {
  const dispatch = useDispatch();
  const { messages, loading, unreadCount } = useSelector((state) => state.messages);

  useEffect(() => {
    dispatch(fetchMessages({ page: 1, limit: 10 }));
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Messages</h1>
          <p className="mt-2 text-sm text-gray-600">
            {unreadCount > 0 ? `${unreadCount} message(s) non lu(s)` : 'Aucun nouveau message'}
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700">
          <PlusIcon className="h-5 w-5" />
          Nouveau message
        </button>
      </div>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">Aucun message</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.ID}
              className={`rounded-lg bg-white p-4 shadow hover:shadow-md transition-shadow cursor-pointer ${
                !message.IsRead ? 'border-l-4 border-primary-600' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm ${!message.IsRead ? 'font-bold' : 'font-medium'} text-slate-800`}>
                      De: Utilisateur #{message.SenderID}
                    </h3>
                    {!message.IsRead && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-primary-600"></span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {message.MessageUnicodeText || message.MessageText || 'Pas de contenu'}
                  </p>
                </div>
                <span className="text-xs text-gray-500">{formatRelativeDate(message.SendingDate)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessagesList;

