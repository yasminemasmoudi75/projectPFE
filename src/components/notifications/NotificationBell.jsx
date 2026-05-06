import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import axios from '../../app/axios';

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const previousIdsRef = useRef(new Set());

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const normalizeNotification = (notification) => ({
    id: notification.ID,
    title: notification.Title || 'Sans objet',
    desc: notification.Message || '',
    date: notification.CreatedAt,
    read: Boolean(notification.IsRead),
    type: notification.Type || 'INFO'
  });

  const fetchNotifications = async () => {
    if (!user?.UserID) {
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`/notifications/${user.UserID}?limit=8`);
      const data = response?.data || [];
      const normalized = data.map(normalizeNotification);

      const previousIds = previousIdsRef.current;
      if (previousIds.size > 0) {
        normalized
          .filter((notification) => !previousIds.has(notification.id))
          .forEach((notification) => {
            toast(notification.title, {
              icon: '🔔',
              duration: 4000,
              position: 'top-right'
            });
          });
      }

      previousIdsRef.current = new Set(normalized.map((notification) => notification.id));
      setNotifications(normalized);
    } catch (error) {
      console.error('Erreur notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.UserID) {
      setNotifications([]);
      previousIdsRef.current = new Set();
      return undefined;
    }

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);

    return () => clearInterval(interval);
  }, [user?.UserID]);

  const handleMarkRead = async (notificationId) => {
    try {
      await axios.patch(`/notifications/${notificationId}/read`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      toast.error('Impossible de marquer la notification comme lue');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.post('/notifications/read-all');
      setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    } catch (error) {
      toast.error('Impossible de marquer toutes les notifications comme lues');
    }
  };

  return (
    <Popover className="relative">
      <Popover.Button className="relative rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600">
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
        )}
      </Popover.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute right-0 z-10 mt-3 w-96 origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadCount} non lue(s)</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 transition-colors hover:bg-blue-50"
              disabled={loading || notifications.length === 0}
            >
              <CheckIcon className="h-3.5 w-3.5" />
              Tout lire
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkRead(notification.id)}
                  className={clsx(
                    'w-full rounded-xl border border-transparent p-3 text-left transition-colors hover:border-slate-200 hover:bg-slate-50',
                    !notification.read && 'bg-blue-50/40'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{notification.desc}</p>
                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'mt-1 h-2.5 w-2.5 rounded-full',
                        notification.read ? 'bg-slate-200' : 'bg-blue-500'
                      )}
                    />
                  </div>
                </button>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                <BellIcon className="mb-3 h-9 w-9 text-slate-200" />
                <p className="text-sm font-medium text-slate-500">Aucune notification</p>
                <p className="mt-1 text-xs text-slate-400">Les nouveaux événements apparaîtront ici.</p>
              </div>
            )}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default NotificationBell;