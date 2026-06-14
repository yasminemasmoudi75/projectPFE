import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Popover, Transition } from '@headlessui/react';
import {
  BellIcon, CheckIcon, CheckCircleIcon, XCircleIcon,
  ArrowTopRightOnSquareIcon, XMarkIcon, CalendarIcon,
  LifebuoyIcon, DocumentTextIcon, WrenchScrewdriverIcon,
  ArrowPathIcon, ShieldCheckIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import axios from '../../app/axios';

/* ─── helpers ─── */
const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
};

const TYPE_META = {
  TRANSFORM_REQUEST: { bg: 'bg-amber-100',   icon: ArrowPathIcon,          iconColor: 'text-amber-600',  ring: 'ring-amber-300' },
  TRANSFORM_DECISION:{ bg: 'bg-blue-100',    icon: ShieldCheckIcon,        iconColor: 'text-blue-600',   ring: 'ring-blue-300'  },
  BCV_CREATED:       { bg: 'bg-emerald-100', icon: DocumentTextIcon,       iconColor: 'text-emerald-600',ring: 'ring-emerald-300'},
  MEETING_INVITE:    { bg: 'bg-violet-100',  icon: CalendarIcon,           iconColor: 'text-violet-600', ring: 'ring-violet-300'},
  ACTIVITY_REMINDER: { bg: 'bg-amber-100',   icon: BellIcon,               iconColor: 'text-amber-600',  ring: 'ring-amber-300' },
  ACTIVITY_OVERDUE:  { bg: 'bg-rose-100',    icon: BellIcon,               iconColor: 'text-rose-600',   ring: 'ring-rose-300'  },
  CLAIM_CREATED:     { bg: 'bg-rose-100',    icon: LifebuoyIcon,           iconColor: 'text-rose-600',   ring: 'ring-rose-300'  },
  DOC_CREATED:       { bg: 'bg-sky-100',     icon: DocumentTextIcon,       iconColor: 'text-sky-600',    ring: 'ring-sky-300'   },
  INTERVENTION_ADDED:{ bg: 'bg-indigo-100',  icon: WrenchScrewdriverIcon,  iconColor: 'text-indigo-600', ring: 'ring-indigo-300'},
  DEFAULT:           { bg: 'bg-slate-100',   icon: SparklesIcon,           iconColor: 'text-slate-500',  ring: 'ring-slate-200' },
};

const getMeta = (type) => TYPE_META[type] || TYPE_META.DEFAULT;

const IconAvatar = ({ type, size = 'sm' }) => {
  const { bg, icon: Icon, iconColor } = getMeta(type);
  const sz = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const isz = size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div className={clsx('rounded-xl flex items-center justify-center flex-shrink-0', sz, bg)}>
      <Icon className={clsx(isz, iconColor)} />
    </div>
  );
};

/* ─── main component ─── */
const NotificationBell = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const previousIdsRef = useRef(new Set());

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const hasUrgent = useMemo(
    () => isAdmin && notifications.some((n) => !n.read && n.type === 'TRANSFORM_REQUEST'),
    [notifications, isAdmin]
  );

  const normalizeNotification = (n) => {
    let payload = null;
    if (['TRANSFORM_REQUEST','BCV_CREATED','TRANSFORM_DECISION','ACTIVITY_REMINDER',
         'ACTIVITY_OVERDUE','MEETING_INVITE','CLAIM_CREATED','DOC_CREATED','INTERVENTION_ADDED'].includes(n.Type)) {
      try { payload = JSON.parse(n.Message); } catch (_) {}
    }
    return {
      id: n.ID,
      title: n.Title || 'Sans objet',
      desc: payload ? null : (n.Message || ''),
      date: n.CreatedAt,
      read: Boolean(n.IsRead),
      type: n.Type || 'INFO',
      payload,
    };
  };

  const fetchNotifications = async () => {
    if (!user?.UserID) return;
    setLoading(true);
    try {
      const response = await axios.get(`/notifications/${user.UserID}?limit=12`);
      const normalized = (response?.data || []).map(normalizeNotification);

      const previousIds = previousIdsRef.current;
      if (previousIds.size > 0) {
        normalized.filter((n) => !previousIds.has(n.id)).forEach((n) => {
          if (n.type === 'TRANSFORM_DECISION' && n.payload?.approved && n.payload?.docGuid) {
            const path = n.payload.targetType === 'FAC' ? `/fav/${n.payload.docGuid}` : `/blv/${n.payload.docGuid}`;
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-xl rounded-2xl border border-blue-200 p-4 flex items-start gap-3 cursor-pointer`}
                onClick={() => { window.location.href = path; toast.dismiss(t.id); }}>
                <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  <p className="text-xs text-blue-600 font-medium mt-0.5">{n.payload.targetType === 'FAC' ? 'Voir la facture →' : 'Voir le BL →'}</p>
                </div>
              </div>
            ), { duration: 8000, position: 'top-right' });
          } else if (n.type === 'TRANSFORM_REQUEST' && isAdmin) {
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-xl rounded-2xl border-2 border-amber-300 p-4 flex items-start gap-3`}>
                <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <ArrowPathIcon className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-0.5">Action requise</p>
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Cliquez sur la cloche pour traiter</p>
                </div>
              </div>
            ), { duration: 10000, position: 'top-right' });
          } else if (n.type === 'ACTIVITY_OVERDUE') {
            toast.custom((t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-xl rounded-2xl border border-rose-200 p-4 flex items-start gap-3 cursor-pointer`}
                onClick={() => { navigate('/calendar'); toast.dismiss(t.id); }}>
                <BellIcon className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-slate-800">{n.title}</p>
                  <p className="text-xs text-rose-600 font-medium mt-0.5">Voir le calendrier →</p>
                </div>
              </div>
            ), { duration: 8000, position: 'top-right' });
          } else {
            toast(n.title, { icon: '🔔', duration: 4000, position: 'top-right' });
          }
        });
      }

      previousIdsRef.current = new Set(normalized.map((n) => n.id));
      setNotifications(normalized);
    } catch (err) {
      console.error('Erreur notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.UserID) { setNotifications([]); previousIdsRef.current = new Set(); return; }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, isAdmin ? 30000 : 60000);
    return () => clearInterval(interval);
  }, [user?.UserID]);

  const markRead = async (id) => {
    try {
      await axios.patch(`/notifications/${id}/read`);
      setNotifications((cur) => cur.map((n) => n.id === id ? { ...n, read: true } : n));
    } catch { toast.error('Impossible de marquer comme lue'); }
  };

  const markAllRead = async () => {
    try {
      await axios.post('/notifications/read-all');
      setNotifications((cur) => cur.map((n) => ({ ...n, read: true })));
    } catch { toast.error('Impossible de marquer toutes comme lues'); }
  };

  const deleteNotif = async (id, e) => {
    e.stopPropagation();
    try {
      await axios.delete(`/notifications/${id}`);
      setNotifications((cur) => cur.filter((n) => n.id !== id));
    } catch { toast.error('Impossible de supprimer'); }
  };

  const handleApprove = async (notif) => {
    const { payload, id: notifId } = notif;
    if (!payload) return;
    setProcessingId(notifId);
    try {
      let newDocGuid = null;
      if (payload.sourceType === 'DEV') {
        const res = await axios.patch(`/devis/${payload.sourceGuid}/convert`);
        newDocGuid = res?.data?.Guid || null;
      } else {
        const res = await axios.post(`/bcv/${payload.sourceGuid}/transfer`, { targetType: payload.targetType });
        newDocGuid = res?.data?.Guid || null;
      }
      await axios.patch(`/notifications/${notifId}/read`);
      setNotifications((cur) => cur.filter((n) => n.id !== notifId));
      await axios.post('/notifications/notify-decision', {
        recipientId: payload.requestedByUserId, sourceType: payload.sourceType,
        sourceNf: payload.sourceNf, targetType: payload.targetType,
        decision: 'APPROVED', newDocGuid,
      });
      toast.success('Transformation approuvée');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur lors de l\'approbation');
    } finally { setProcessingId(null); }
  };

  const handleRefuse = async (notif) => {
    const { payload, id: notifId } = notif;
    if (!payload) return;
    setProcessingId(notifId);
    try {
      await axios.patch(`/notifications/${notifId}/read`);
      setNotifications((cur) => cur.filter((n) => n.id !== notifId));
      await axios.post('/notifications/notify-decision', {
        recipientId: payload.requestedByUserId, sourceType: payload.sourceType,
        sourceNf: payload.sourceNf, targetType: payload.targetType, decision: 'REJECTED',
      });
      toast('Demande refusée', { icon: '✖️' });
    } catch (err) {
      toast.error('Erreur lors du refus');
    } finally { setProcessingId(null); }
  };

  /* ─── sub-render: single notification card ─── */
  const renderCard = (notif) => {
    const isTransformRequest = notif.type === 'TRANSFORM_REQUEST' && isAdmin;
    const key = notif.id;

    if (isTransformRequest) {
      return (
        <div key={key} className="relative rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-4 mb-2 shadow-sm shadow-amber-100">
          {/* Pulse badge */}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
          </span>

          <button type="button" className="w-full text-left group mb-3"
            onClick={() => {
              const p = notif.payload;
              if (!p) return;
              navigate(p.sourceType === 'DEV' ? `/devis/${p.sourceGuid}` : `/bcv/${p.sourceGuid}`);
            }}>
            <div className="flex items-start gap-3">
              <IconAvatar type={notif.type} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-0.5">Action requise</p>
                <p className="text-sm font-bold text-slate-800 leading-snug group-hover:text-amber-700 transition-colors">
                  {notif.title}
                </p>
                {notif.payload && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-400">Client</span>
                      <span className="font-bold text-slate-700">{notif.payload.libTiers}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-400">Montant</span>
                      <span className="font-bold text-amber-700">{Number(notif.payload.totalTTC || 0).toFixed(3)} TND</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <span className="font-medium text-slate-400">Demandé par</span>
                      <span className="font-bold text-slate-700">{notif.payload.requestedByName}</span>
                    </div>
                  </div>
                )}
                <p className="mt-2 text-[10px] text-amber-500 font-semibold flex items-center gap-1">
                  <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                  Voir le document
                </p>
              </div>
            </div>
          </button>

          {/* Actions */}
          <div className="flex gap-2">
            <button onClick={() => handleApprove(notif)} disabled={processingId === notif.id}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 transition-all disabled:opacity-60 shadow-sm shadow-emerald-500/30 active:scale-[0.97]">
              {processingId === notif.id
                ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                : <CheckCircleIcon className="h-3.5 w-3.5" />}
              Approuver
            </button>
            <button onClick={() => handleRefuse(notif)} disabled={processingId === notif.id}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold py-2.5 transition-all disabled:opacity-60 active:scale-[0.97]">
              <XCircleIcon className="h-3.5 w-3.5" />
              Refuser
            </button>
          </div>

          <p className="mt-2 text-[10px] text-slate-400 text-right">{timeAgo(notif.date)}</p>
        </div>
      );
    }

    /* ── generic card ── */
    const handleClick = async () => {
      await markRead(notif.id);
      const p = notif.payload;
      if (!p) return;
      if (notif.type === 'TRANSFORM_DECISION' && p.docGuid)
        navigate(p.targetType === 'FAC' ? `/fav/${p.docGuid}` : `/blv/${p.docGuid}`);
      else if (notif.type === 'BCV_CREATED' && p.bcvGuid) navigate(`/bcv/${p.bcvGuid}`);
      else if (notif.type === 'CLAIM_CREATED' && p.claimId) navigate(`/claims/${p.claimId}`);
      else if (notif.type === 'INTERVENTION_ADDED' && p.claimId) navigate(`/claims/${p.claimId}?tab=interventions`);
      else if (notif.type === 'MEETING_INVITE' || notif.type === 'ACTIVITY_REMINDER' || notif.type === 'ACTIVITY_OVERDUE') navigate('/calendar');
      else if (notif.type === 'DOC_CREATED') navigate('/mes-documents');
    };

    return (
      <div key={key}
        className={clsx(
          'relative rounded-xl border p-3 mb-1.5 group transition-all',
          !notif.read ? 'bg-white border-slate-200 shadow-sm' : 'border-transparent hover:border-slate-100 hover:bg-slate-50/80'
        )}>
        <button type="button" className="w-full text-left" onClick={handleClick}>
          <div className="flex items-start gap-3">
            <IconAvatar type={notif.type} />
            <div className="min-w-0 flex-1 pr-4">
              <p className={clsx('text-sm font-semibold leading-snug truncate', !notif.read ? 'text-slate-800' : 'text-slate-600')}>
                {notif.title}
              </p>
              {notif.desc && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{notif.desc}</p>}
              {notif.payload?.libTiers && (
                <p className="text-xs text-slate-500 mt-0.5">Client : <span className="font-semibold">{notif.payload.libTiers}</span></p>
              )}
              {notif.payload?.totalTTC != null && (
                <p className="text-xs text-slate-500">Montant : <span className="font-semibold">{Number(notif.payload.totalTTC).toFixed(3)} TND</span></p>
              )}
              <p className="mt-1.5 text-[10px] text-slate-400 font-medium">{timeAgo(notif.date)}</p>
            </div>
          </div>
        </button>

        {/* Unread dot */}
        {!notif.read && (
          <span className="absolute top-3.5 right-8 h-2 w-2 rounded-full bg-[#0062AF]" />
        )}

        {/* Delete */}
        <button type="button" onClick={(e) => deleteNotif(notif.id, e)}
          className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all">
          <XMarkIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  const urgent = notifications.filter((n) => n.type === 'TRANSFORM_REQUEST' && isAdmin && !n.read);
  const rest   = notifications.filter((n) => !(n.type === 'TRANSFORM_REQUEST' && isAdmin && !n.read));

  return (
    <Popover className="relative">
      {/* ── Bell button ── */}
      <Popover.Button className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all focus:outline-none">
        {unreadCount > 0 ? (
          <BellSolid className={clsx('h-6 w-6', hasUrgent ? 'text-amber-500' : 'text-[#0062AF]')} />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}

        {/* Animated ring for urgent */}
        {hasUrgent && (
          <span className="absolute inset-0 rounded-xl">
            <span className="absolute inset-0 rounded-xl ring-2 ring-amber-400 animate-ping opacity-50" />
          </span>
        )}

        {/* Badge */}
        {unreadCount > 0 && (
          <span className={clsx(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-sm',
            hasUrgent ? 'bg-amber-500' : 'bg-rose-500'
          )}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Popover.Button>

      <Transition as={Fragment}
        enter="transition ease-out duration-200" enterFrom="opacity-0 scale-95 translate-y-1" enterTo="opacity-100 scale-100 translate-y-0"
        leave="transition ease-in duration-150" leaveFrom="opacity-100 scale-100 translate-y-0" leaveTo="opacity-0 scale-95 translate-y-1">
        <Popover.Panel className="absolute right-0 z-50 mt-3 w-[420px] origin-top-right rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 overflow-hidden">

          {/* Header */}
          <div className={clsx(
            'px-5 py-4 flex items-center justify-between',
            hasUrgent
              ? 'bg-gradient-to-r from-amber-500 to-orange-400'
              : 'bg-gradient-to-r from-[#0062AF] to-sky-500'
          )}>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <BellSolid className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Notifications</h3>
                <p className="text-[11px] text-white/70">
                  {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est à jour'}
                  {hasUrgent && <span className="ml-1 font-bold text-white"> · {urgent.length} action{urgent.length > 1 ? 's' : ''} requise{urgent.length > 1 ? 's' : ''}</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {loading && <ArrowPathIcon className="h-4 w-4 text-white/60 animate-spin" />}
              {unreadCount > 0 && (
                <button type="button" onClick={markAllRead}
                  className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-white bg-white/20 hover:bg-white/30 transition-colors">
                  <CheckIcon className="h-3 w-3" />
                  Tout lire
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-[480px] overflow-y-auto p-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                  <BellIcon className="h-7 w-7 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-500">Aucune notification</p>
                <p className="text-xs text-slate-400 mt-1">Les nouveaux événements apparaîtront ici.</p>
              </div>
            ) : (
              <>
                {/* Urgent d'abord */}
                {urgent.length > 0 && (
                  <>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest px-1 mb-2">
                      Actions requises
                    </p>
                    {urgent.map(renderCard)}
                    {rest.length > 0 && <div className="my-3 border-t border-slate-100" />}
                  </>
                )}

                {/* Reste */}
                {rest.length > 0 && (
                  <>
                    {unreadCount > urgent.length && (
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mb-2">
                        Récentes
                      </p>
                    )}
                    {rest.map(renderCard)}
                  </>
                )}
              </>
            )}
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
};

export default NotificationBell;
