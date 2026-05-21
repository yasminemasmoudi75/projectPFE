import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon, CheckCircleIcon, XCircleIcon, ArrowTopRightOnSquareIcon, XMarkIcon, CalendarIcon, LifebuoyIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import axios from '../../app/axios';

const NotificationBell = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const previousIdsRef = useRef(new Set());

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  );

  const normalizeNotification = (notification) => {
    let payload = null;
    if (['TRANSFORM_REQUEST', 'BCV_CREATED', 'TRANSFORM_DECISION', 'ACTIVITY_REMINDER', 'ACTIVITY_OVERDUE', 'MEETING_INVITE', 'CLAIM_CREATED', 'DOC_CREATED'].includes(notification.Type)) {
      try { payload = JSON.parse(notification.Message); } catch (_) {}
    }
    return {
      id: notification.ID,
      title: notification.Title || 'Sans objet',
      desc: payload ? null : (notification.Message || ''),
      date: notification.CreatedAt,
      read: Boolean(notification.IsRead),
      type: notification.Type || 'INFO',
      payload
    };
  };

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
          .filter((n) => !previousIds.has(n.id))
          .forEach((n) => {
            if (n.type === 'TRANSFORM_DECISION' && n.payload?.approved && n.payload?.docGuid) {
              const path = n.payload.targetType === 'FAC' ? `/fav/${n.payload.docGuid}` : `/blv/${n.payload.docGuid}`;
              toast.custom((t) => (
                <div
                  className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-xl border border-blue-200 p-4 flex items-start gap-3 cursor-pointer`}
                  onClick={() => { window.location.href = path; toast.dismiss(t.id); }}
                >
                  <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-blue-600 font-medium mt-0.5">
                      {n.payload.targetType === 'FAC' ? 'Voir la facture →' : 'Voir le bon de livraison →'}
                    </p>
                  </div>
                </div>
              ), { duration: 8000, position: 'top-right' });
            } else if (n.type === 'ACTIVITY_REMINDER' || n.type === 'ACTIVITY_OVERDUE') {
              const isOverdue = n.type === 'ACTIVITY_OVERDUE';
              toast.custom((t) => (
                <div
                  className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-lg rounded-xl border ${isOverdue ? 'border-rose-200' : 'border-amber-200'} p-4 flex items-start gap-3 cursor-pointer`}
                  onClick={() => { navigate('/calendar'); toast.dismiss(t.id); }}
                >
                  <BellIcon className={`h-5 w-5 ${isOverdue ? 'text-rose-500' : 'text-amber-500'} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                    <p className={`text-xs ${isOverdue ? 'text-rose-600' : 'text-amber-600'} font-medium mt-0.5`}>Voir le calendrier →</p>
                  </div>
                </div>
              ), { duration: 8000, position: 'top-right' });
            } else {
              toast(n.title, { icon: '🔔', duration: 4000, position: 'top-right' });
            }
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

  const handleDelete = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/notifications/${notificationId}`);
      setNotifications((current) => current.filter((n) => n.id !== notificationId));
    } catch {
      toast.error('Impossible de supprimer la notification');
    }
  };

  const [processingId, setProcessingId] = useState(null);

  const handleApprove = async (notification) => {
    const { payload, id: notifId } = notification;
    if (!payload) return;
    setProcessingId(notifId);
    try {
      let newDocGuid = null;
      if (payload.sourceType === 'DEV') {
        const res = await axios.patch(`/devis/${payload.sourceGuid}/convert`);
        newDocGuid = res?.data?.Guid || res?.Guid || null;
      } else {
        const res = await axios.post(`/bcv/${payload.sourceGuid}/transfer`, { targetType: payload.targetType });
        newDocGuid = res?.data?.Guid || res?.Guid || null;
      }
      await axios.patch(`/notifications/${notifId}/read`);
      setNotifications((cur) => cur.filter((n) => n.id !== notifId));
      await axios.post('/notifications/notify-decision', {
        recipientId: payload.requestedByUserId,
        sourceType: payload.sourceType,
        sourceNf: payload.sourceNf,
        targetType: payload.targetType,
        decision: 'APPROVED',
        newDocGuid
      });
      toast.success('Transformation approuvée et effectuée');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRefuse = async (notification) => {
    const { payload, id: notifId } = notification;
    if (!payload) return;
    setProcessingId(notifId);
    try {
      await axios.patch(`/notifications/${notifId}/read`);
      setNotifications((cur) => cur.filter((n) => n.id !== notifId));
      await axios.post('/notifications/notify-decision', {
        recipientId: payload.requestedByUserId,
        sourceType: payload.sourceType,
        sourceNf: payload.sourceNf,
        targetType: payload.targetType,
        decision: 'REJECTED'
      });
      toast('Demande refusée', { icon: '✖️' });
    } catch (err) {
      toast.error('Erreur lors du refus');
    } finally {
      setProcessingId(null);
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

          <div className="max-h-[420px] overflow-y-auto p-2">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                notification.type === 'TRANSFORM_REQUEST' && isAdmin ? (
                  <div
                    key={notification.id}
                    className="w-full rounded-xl border border-amber-200 bg-amber-50/60 p-3 mb-1"
                  >
                    {/* Zone cliquable → page détail du document */}
                    <button
                      type="button"
                      className="w-full text-left group"
                      onClick={() => {
                        const p = notification.payload;
                        if (!p) return;
                        const path = p.sourceType === 'DEV'
                          ? `/devis/${p.sourceGuid}`
                          : `/bcv/${p.sourceGuid}`;
                        navigate(path);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-amber-800 leading-snug group-hover:text-amber-600 transition-colors">
                            {notification.title}
                          </p>
                          {notification.payload && (
                            <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                              <p>Client : <span className="font-medium">{notification.payload.libTiers}</span></p>
                              <p>Montant TTC : <span className="font-medium">{Number(notification.payload.totalTTC || 0).toFixed(3)} TND</span></p>
                              <p>Demandé par : <span className="font-medium">{notification.payload.requestedByName}</span></p>
                            </div>
                          )}
                          <p className="mt-1.5 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 text-amber-400 group-hover:text-amber-600 transition-colors" />
                        </div>
                      </div>
                    </button>

                    <div className="mt-2.5 flex gap-2">
                      <button
                        onClick={() => handleApprove(notification)}
                        disabled={processingId === notification.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold py-1.5 hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                      >
                        <CheckCircleIcon className="h-3.5 w-3.5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => handleRefuse(notification)}
                        disabled={processingId === notification.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold py-1.5 hover:bg-rose-100 disabled:opacity-60 transition-colors"
                      >
                        <XCircleIcon className="h-3.5 w-3.5" />
                        Refuser
                      </button>
                    </div>
                  </div>
                ) : notification.type === 'TRANSFORM_DECISION' && notification.payload?.approved && notification.payload?.docGuid ? (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border p-3 mb-1 group',
                      !notification.read ? 'bg-blue-50/60 border-blue-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await handleMarkRead(notification.id);
                        const { docGuid, targetType } = notification.payload;
                        navigate(targetType === 'FAC' ? `/fav/${docGuid}` : `/blv/${docGuid}`);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 pr-5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-blue-800 group-hover:text-blue-600 transition-colors">
                            {notification.title}
                          </p>
                          <p className="mt-1.5 text-[11px] font-medium text-blue-600 flex items-center gap-1">
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            {notification.payload.targetType === 'FAC' ? 'Voir la facture' : 'Voir le bon de livraison'}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : 'bg-blue-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : notification.type === 'BCV_CREATED' && notification.payload ? (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border p-3 mb-1 group',
                      !notification.read ? 'bg-emerald-50/60 border-emerald-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await handleMarkRead(notification.id);
                        navigate(`/bcv/${notification.payload.bcvGuid}`);
                      }}
                    >
                      <div className="flex items-start justify-between gap-3 pr-5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-emerald-800 group-hover:text-emerald-600 transition-colors">
                            {notification.title}
                          </p>
                          <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                            <p>Client : <span className="font-medium">{notification.payload.libTiers}</span></p>
                            <p>BC n°{notification.payload.bcvNf} — {Number(notification.payload.totalTTC || 0).toFixed(3)} TND</p>
                          </div>
                          <p className="mt-1.5 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            Voir le bon de commande
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : 'bg-emerald-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : notification.type === 'MEETING_INVITE' ? (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border p-3 mb-1 group',
                      !notification.read ? 'bg-violet-50/60 border-violet-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await handleMarkRead(notification.id);
                        navigate('/calendar');
                      }}
                    >
                      <div className="flex items-start gap-3 pr-5">
                        <div className="h-8 w-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                          <CalendarIcon className="h-4 w-4 text-violet-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-violet-800 group-hover:text-violet-600 transition-colors">
                            {notification.title}
                          </p>
                          {notification.payload?.organizer && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Organisé par : <span className="font-medium">{notification.payload.organizer}</span>
                            </p>
                          )}
                          {notification.payload?.date && (
                            <p className="text-xs text-slate-500">
                              {new Date(notification.payload.date).toLocaleString('fr-FR')}
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-medium text-violet-500 flex items-center gap-1">
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            Voir le calendrier
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : 'bg-violet-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (notification.type === 'ACTIVITY_REMINDER' || notification.type === 'ACTIVITY_OVERDUE') ? (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border p-3 mb-1 group',
                      notification.type === 'ACTIVITY_OVERDUE'
                        ? (!notification.read ? 'bg-rose-50/60 border-rose-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50')
                        : (!notification.read ? 'bg-amber-50/60 border-amber-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50')
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await handleMarkRead(notification.id);
                        navigate('/calendar');
                      }}
                    >
                      <div className="flex items-start gap-3 pr-5">
                        <BellIcon className={clsx('h-4 w-4 flex-shrink-0 mt-0.5', notification.type === 'ACTIVITY_OVERDUE' ? 'text-rose-500' : 'text-amber-500')} />
                        <div className="min-w-0 flex-1">
                          <p className={clsx('truncate text-sm font-semibold transition-colors', notification.type === 'ACTIVITY_OVERDUE' ? 'text-rose-800 group-hover:text-rose-600' : 'text-amber-800 group-hover:text-amber-600')}>
                            {notification.title}
                          </p>
                          {notification.payload?.client && (
                            <p className="text-xs text-slate-500 mt-0.5">Client : <span className="font-medium">{notification.payload.client}</span></p>
                          )}
                          <p className={clsx('mt-1 text-[11px] font-medium flex items-center gap-1', notification.type === 'ACTIVITY_OVERDUE' ? 'text-rose-500' : 'text-amber-500')}>
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            Voir le calendrier
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : notification.type === 'ACTIVITY_OVERDUE' ? 'bg-rose-500' : 'bg-amber-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : notification.type === 'CLAIM_CREATED' && notification.payload ? (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border p-3 mb-1 group',
                      !notification.read ? 'bg-rose-50/60 border-rose-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await handleMarkRead(notification.id);
                        navigate(`/claims/${notification.payload.claimId}`);
                      }}
                    >
                      <div className="flex items-start gap-3 pr-5">
                        <div className="h-8 w-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                          <LifebuoyIcon className="h-4 w-4 text-rose-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-rose-800 group-hover:text-rose-600 transition-colors">
                            {notification.title}
                          </p>
                          {notification.payload.libTiers && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Client : <span className="font-medium">{notification.payload.libTiers}</span>
                            </p>
                          )}
                          {notification.payload.objet && (
                            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{notification.payload.objet}</p>
                          )}
                          <p className="mt-1 text-[11px] font-medium text-rose-500 flex items-center gap-1">
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            Voir la réclamation
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : 'bg-rose-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : notification.type === 'DOC_CREATED' && notification.payload ? (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border p-3 mb-1 group',
                      !notification.read ? 'bg-sky-50/60 border-sky-200' : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={async () => {
                        await handleMarkRead(notification.id);
                        navigate('/mes-documents');
                      }}
                    >
                      <div className="flex items-start gap-3 pr-5">
                        <div className="h-8 w-8 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                          <DocumentTextIcon className="h-4 w-4 text-sky-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-sky-800 group-hover:text-sky-600 transition-colors">
                            {notification.title}
                          </p>
                          {notification.payload.totalTTC != null && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              Montant TTC : <span className="font-medium">{Number(notification.payload.totalTTC).toFixed(3)} TND</span>
                            </p>
                          )}
                          <p className="mt-1 text-[11px] font-medium text-sky-500 flex items-center gap-1">
                            <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                            Voir mes documents
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : 'bg-sky-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    key={notification.id}
                    className={clsx(
                      'relative rounded-xl border border-transparent p-3 mb-1 hover:border-slate-200 hover:bg-slate-50 group',
                      !notification.read && notification.type === 'SUCCESS' && 'bg-emerald-50/40',
                      !notification.read && notification.type === 'WARNING' && 'bg-amber-50/40',
                      !notification.read && !['SUCCESS','WARNING'].includes(notification.type) && 'bg-blue-50/40'
                    )}
                  >
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <div className="flex items-start justify-between gap-3 pr-5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{notification.title}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{notification.desc}</p>
                          <p className="mt-2 text-[11px] font-medium text-slate-400">
                            {notification.date ? new Date(notification.date).toLocaleString('fr-FR') : ''}
                          </p>
                        </div>
                        <span className={clsx('mt-1 h-2.5 w-2.5 rounded-full flex-shrink-0', notification.read ? 'bg-slate-200' : 'bg-blue-500')} />
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(notification.id, e)}
                      className="absolute top-2 right-2 h-5 w-5 flex items-center justify-center rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      title="Supprimer"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
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