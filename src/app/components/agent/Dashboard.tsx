import { Activity, AlertCircle, CheckCircle, Clock, Phone, Mail, MapPin, FileText, TrendingUp } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const statsCards = [
  { label: 'Activités du jour',      value: '12', change: '+3 aujourd\'hui', icon: Activity,      color: 'text-blue-600' },
  { label: 'Réclamations ouvertes',  value: '8',  change: '2 critiques',     icon: AlertCircle,   color: 'text-blue-600' },
  { label: 'Réclamations résolues',  value: '24', change: '+5 ce mois',      icon: CheckCircle,   color: 'text-blue-600' },
  { label: 'En attente',             value: '5',  change: 'à traiter',       icon: Clock,         color: 'text-blue-600' },
];

const recentActivities = [
  { client: 'Tech Solutions SARL', action: 'Réclamation créée',       time: 'Il y a 15 min', type: 'alert',  status: 'new'       },
  { client: 'Digital Services',    action: 'Appel téléphonique',      time: 'Il y a 1h',    type: 'phone',  status: 'completed'  },
  { client: 'Innovation Corp',     action: 'Email envoyé',            time: 'Il y a 2h',    type: 'email',  status: 'completed'  },
  { client: 'Web Agency Pro',      action: 'Réclamation mise à jour', time: 'Il y a 3h',    type: 'alert',  status: 'pending'    },
  { client: 'Cloud Masters',       action: 'Note ajoutée',            time: 'Il y a 4h',    type: 'note',   status: 'completed'  },
];

const typeIcon: Record<string, typeof Phone> = { phone: Phone, email: Mail, visit: MapPin, note: FileText, alert: AlertCircle };
const statusStyle: Record<string, string> = {
  new:       'bg-red-50    text-red-700',
  pending:   'bg-amber-50  text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
};
const statusLabel: Record<string, string> = { new: 'Nouveau', pending: 'En attente', completed: 'Terminé' };

export function Dashboard() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble de vos activités</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <Icon className={cn('w-5 h-5', s.color)} />
                </div>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />{s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent activities */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Clock className="w-4 h-4 text-blue-600" /></div>
          <h3 className="text-sm font-semibold text-slate-800">Activités récentes</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {recentActivities.map((a, i) => {
            const Icon = typeIcon[a.type] || FileText;
            return (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-50 flex-shrink-0">
                    <Icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.client}</p>
                    <p className="text-xs text-slate-500">{a.action}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statusStyle[a.status])}>
                    {statusLabel[a.status]}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{a.time}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
