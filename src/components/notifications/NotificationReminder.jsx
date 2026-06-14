import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon, XMarkIcon, CheckCircleIcon, XCircleIcon,
  ArrowTopRightOnSquareIcon, ArrowPathIcon, CalendarIcon,
  LifebuoyIcon, DocumentTextIcon, WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolid } from '@heroicons/react/24/solid';
import clsx from 'clsx';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const SESSION_KEY = 'notif_reminder_shown';

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const m = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (m < 1) return 'À l\'instant';
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  return `Il y a ${Math.floor(h / 24)}j`;
};

const TYPE_CFG = {
  TRANSFORM_REQUEST:  { label: 'Action requise',  dot: 'bg-amber-500',   border: 'border-amber-300',  bg: 'bg-amber-50',   icon: ArrowPathIcon,         iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'  },
  CLAIM_CREATED:      { label: 'Réclamation',     dot: 'bg-rose-500',    border: 'border-rose-200',   bg: 'bg-rose-50',    icon: LifebuoyIcon,          iconBg: 'bg-rose-100',    iconColor: 'text-rose-600'   },
  BCV_CREATED:        { label: 'Bon de commande', dot: 'bg-emerald-500', border: 'border-emerald-200',bg: 'bg-emerald-50', icon: DocumentTextIcon,      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600'},
  ACTIVITY_OVERDUE:   { label: 'En retard',       dot: 'bg-rose-500',    border: 'border-rose-200',   bg: 'bg-rose-50',    icon: BellIcon,              iconBg: 'bg-rose-100',    iconColor: 'text-rose-600'   },
  ACTIVITY_REMINDER:  { label: 'Rappel',          dot: 'bg-amber-500',   border: 'border-amber-200',  bg: 'bg-amber-50',   icon: BellIcon,              iconBg: 'bg-amber-100',   iconColor: 'text-amber-600'  },
  MEETING_INVITE:     { label: 'Réunion',         dot: 'bg-violet-500',  border: 'border-violet-200', bg: 'bg-violet-50',  icon: CalendarIcon,          iconBg: 'bg-violet-100',  iconColor: 'text-violet-600' },
  INTERVENTION_ADDED: { label: 'Intervention',    dot: 'bg-indigo-500',  border: 'border-indigo-200', bg: 'bg-indigo-50',  icon: WrenchScrewdriverIcon, iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-600' },
  DOC_CREATED:        { label: 'Document',        dot: 'bg-sky-500',     border: 'border-sky-200',    bg: 'bg-sky-50',     icon: DocumentTextIcon,      iconBg: 'bg-sky-100',     iconColor: 'text-sky-600'    },
  DEFAULT:            { label: 'Info',            dot: 'bg-blue-500',    border: 'border-blue-200',   bg: 'bg-blue-50',    icon: BellIcon,              iconBg: 'bg-blue-100',    iconColor: 'text-blue-600'   },
};

const getCfg = (type) => TYPE_CFG[type] || TYPE_CFG.DEFAULT;

const NotificationReminder = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    if (!user?.UserID) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(`/notifications/${user.UserID}?limit=20`);
        const unread = (res?.data || [])
          .filter((n) => !n.IsRead)
          .map((n) => {
            let payload = null;
            try { payload = JSON.parse(n.Message); } catch (_) {}
            return { id: n.ID, title: n.Title || 'Sans objet', date: n.CreatedAt, type: n.Type || 'INFO', payload };
          })
          // Trier : TRANSFORM_REQUEST d'abord, puis par date desc
          .sort((a, b) => {
            if (a.type === 'TRANSFORM_REQUEST' && b.type !== 'TRANSFORM_REQUEST') return -1;
            if (b.type === 'TRANSFORM_REQUEST' && a.type !== 'TRANSFORM_REQUEST') return 1;
            return new Date(b.date) - new Date(a.date);
          })
          .slice(0, 6);

        if (unread.length > 0) {
          setNotifications(unread);
          setVisible(true);
          sessionStorage.setItem(SESSION_KEY, '1');
        }
      } catch { /* silencieux */ }
    }, 1200);

    return () => clearTimeout(timer);
  }, [user?.UserID]);

  const close = () => setVisible(false);

  const markRead = async (id) => {
    try { await axios.patch(`/notifications/${id}/read`); } catch { /* silencieux */ }
    setNotifications((cur) => cur.filter((n) => n.id !== id));
  };

  const handleApprove = async (notif) => {
    const { payload, id } = notif;
    if (!payload) return;
    setProcessingId(id);
    try {
      let newDocGuid = null;
      if (payload.sourceType === 'DEV') {
        const res = await axios.patch(`/devis/${payload.sourceGuid}/convert`);
        newDocGuid = res?.data?.Guid || null;
      } else {
        const res = await axios.post(`/bcv/${payload.sourceGuid}/transfer`, { targetType: payload.targetType });
        newDocGuid = res?.data?.Guid || null;
      }
      await axios.patch(`/notifications/${id}/read`);
      await axios.post('/notifications/notify-decision', {
        recipientId: payload.requestedByUserId, sourceType: payload.sourceType,
        sourceNf: payload.sourceNf, targetType: payload.targetType,
        decision: 'APPROVED', newDocGuid,
      });
      toast.success('Transformation approuvée');
      setNotifications((cur) => cur.filter((n) => n.id !== id));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Erreur');
    } finally { setProcessingId(null); }
  };

  const handleRefuse = async (notif) => {
    const { payload, id } = notif;
    if (!payload) return;
    setProcessingId(id);
    try {
      await axios.patch(`/notifications/${id}/read`);
      await axios.post('/notifications/notify-decision', {
        recipientId: payload.requestedByUserId, sourceType: payload.sourceType,
        sourceNf: payload.sourceNf, targetType: payload.targetType, decision: 'REJECTED',
      });
      toast('Demande refusée', { icon: '✖️' });
      setNotifications((cur) => cur.filter((n) => n.id !== id));
    } catch { toast.error('Erreur'); }
    finally { setProcessingId(null); }
  };

  const navigate_ = (notif) => {
    const p = notif.payload;
    if (!p) return;
    if (notif.type === 'TRANSFORM_REQUEST') navigate(p.sourceType === 'DEV' ? `/devis/${p.sourceGuid}` : `/bcv/${p.sourceGuid}`);
    else if (notif.type === 'BCV_CREATED' && p.bcvGuid) navigate(`/bcv/${p.bcvGuid}`);
    else if (notif.type === 'CLAIM_CREATED' && p.claimId) navigate(`/claims/${p.claimId}`);
    else if (notif.type === 'INTERVENTION_ADDED' && p.claimId) navigate(`/claims/${p.claimId}?tab=interventions`);
    else if (['MEETING_INVITE','ACTIVITY_REMINDER','ACTIVITY_OVERDUE'].includes(notif.type)) navigate('/calendar');
    else if (notif.type === 'DOC_CREATED') navigate('/mes-documents');
    markRead(notif.id);
    close();
  };

  if (!visible || notifications.length === 0) return null;

  const urgentCount = notifications.filter((n) => n.type === 'TRANSFORM_REQUEST').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)' }}>

      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className={clsx(
          'px-6 py-5 flex items-center justify-between',
          urgentCount > 0
            ? 'bg-gradient-to-r from-amber-500 to-orange-400'
            : 'bg-gradient-to-r from-[#0062AF] to-sky-500'
        )}>
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-11 w-11 rounded-2xl bg-white/20 flex items-center justify-center">
                <BellSolid className="h-6 w-6 text-white" />
              </div>
              {urgentCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-white items-center justify-center">
                    <span className="text-[9px] font-black text-amber-600">{urgentCount}</span>
                  </span>
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                {urgentCount > 0 ? 'Actions en attente' : 'Notifications non lues'}
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                {notifications.length} notification{notifications.length > 1 ? 's' : ''} depuis votre dernière connexion
              </p>
            </div>
          </div>
          <button onClick={close}
            className="h-8 w-8 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
            <XMarkIcon className="h-4 w-4 text-white" />
          </button>
        </div>

        {/* Notifications list */}
        <div className="p-4 space-y-2 max-h-[420px] overflow-y-auto">
          {notifications.map((notif) => {
            const cfg = getCfg(notif.type);
            const Icon = cfg.icon;
            const isUrgent = notif.type === 'TRANSFORM_REQUEST' && isAdmin;

            return (
              <div key={notif.id}
                className={clsx('rounded-2xl border p-4 transition-all', cfg.border, cfg.bg)}>
                <div className="flex items-start gap-3">
                  <div className={clsx('h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.iconBg)}>
                    <Icon className={clsx('h-5 w-5', cfg.iconColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={clsx('text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-full text-white', cfg.dot)}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-slate-400">{timeAgo(notif.date)}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-snug">{notif.title}</p>
                    {notif.payload?.libTiers && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Client : <span className="font-semibold">{notif.payload.libTiers}</span>
                        {notif.payload.totalTTC != null && (
                          <> · <span className="font-semibold">{Number(notif.payload.totalTTC).toFixed(3)} TND</span></>
                        )}
                      </p>
                    )}

                    {/* Actions admin urgentes */}
                    {isUrgent ? (
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => handleApprove(notif)} disabled={processingId === notif.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm shadow-emerald-500/30">
                          {processingId === notif.id
                            ? <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                            : <CheckCircleIcon className="h-3.5 w-3.5" />}
                          Approuver
                        </button>
                        <button onClick={() => handleRefuse(notif)} disabled={processingId === notif.id}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition-all disabled:opacity-60">
                          <XCircleIcon className="h-3.5 w-3.5" />
                          Refuser
                        </button>
                        <button onClick={() => navigate_(notif)}
                          className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all" title="Voir le document">
                          <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => navigate_(notif)}
                        className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-[#0062AF] hover:underline">
                        <ArrowTopRightOnSquareIcon className="h-3 w-3" />
                        Voir le détail
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 flex items-center justify-between">
          <p className="text-xs text-slate-400">Ce rappel s'affiche une fois par session</p>
          <button onClick={close}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-semibold transition-all">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationReminder;
