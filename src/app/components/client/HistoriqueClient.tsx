import { useState } from 'react';
import { Wrench, Star, User, Calendar, Clock, History } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockHistorique = [
  { id: 'INT-089', type: 'Maintenance',  technicien: 'Mohamed Tech',    reclamation: 'REC-038', description: 'Mise à jour système ERP',              date: '17/01/2026', duree: '2h 30min', satisfaction: 5, notes: 'Intervention rapide et efficace'      },
  { id: 'INT-085', type: 'Installation', technicien: 'Youssef Support', reclamation: 'REC-035', description: "Réparation imprimante service RH",       date: '14/01/2026', duree: '1h',       satisfaction: 4, notes: 'Problème résolu rapidement'          },
  { id: 'INT-078', type: 'Réparation',   technicien: 'Mohamed Tech',    reclamation: 'REC-029', description: 'Remplacement disque dur serveur',        date: '10/01/2026', duree: '4h',       satisfaction: 5, notes: 'Excellent travail, très professionnel' },
  { id: 'INT-072', type: 'Configuration', technicien: 'Youssef Support', reclamation: 'REC-025', description: 'Configuration réseau WiFi bureaux',     date: '05/01/2026', duree: '3h',       satisfaction: 5, notes: 'Configuration optimale'              },
];

const typeStyle: Record<string, string> = {
  'Réparation':   'bg-red-50    text-red-700',
  'Configuration': 'bg-blue-50  text-blue-700',
  'Installation': 'bg-slate-100 text-slate-600',
  'Maintenance':  'bg-emerald-50 text-emerald-700',
};

const periodes = [
  { value: 'all',    label: 'Toutes les périodes' },
  { value: '7j',     label: '7 derniers jours'    },
  { value: '30j',    label: '30 derniers jours'   },
  { value: '3mois',  label: '3 derniers mois'     },
];

export function HistoriqueClient() {
  const [filterPeriode, setFilterPeriode] = useState('all');

  const totalInterventions = mockHistorique.length;
  const satisfactionMoy = (mockHistorique.reduce((a, h) => a + h.satisfaction, 0) / totalInterventions).toFixed(1);

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <History className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Historique des Interventions</h1>
            <p className="text-sm text-slate-500">Consultez l'historique de toutes vos interventions</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Wrench, value: totalInterventions.toString(), label: 'Total interventions',  color: 'text-blue-600'    },
          { icon: Star,   value: `${satisfactionMoy}/5`,        label: 'Satisfaction moyenne', color: 'text-amber-500'   },
          { icon: Clock,  value: '10h 30min',                   label: 'Heures de support',    color: 'text-emerald-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className={cn('w-5 h-5', s.color)} /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <select
          value={filterPeriode}
          onChange={e => setFilterPeriode(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
          {periodes.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {mockHistorique.map(iv => (
          <div key={iv.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-50 flex-shrink-0">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-mono font-bold text-blue-600">{iv.id}</span>
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeStyle[iv.type] || 'bg-slate-100 text-slate-600')}>
                        {iv.type}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 mb-0.5">{iv.description}</p>
                    <p className="text-xs text-slate-500">Réclamation : <span className="font-mono font-medium text-blue-600">{iv.reclamation}</span></p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-slate-400 mb-1">Satisfaction</p>
                    <div className="flex gap-0.5 justify-end">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('w-3.5 h-3.5', i < iv.satisfaction ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { icon: User,     label: iv.technicien },
                    { icon: Calendar, label: iv.date       },
                    { icon: Clock,    label: iv.duree      },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-xs text-slate-600 truncate">{item.label}</span>
                      </div>
                    );
                  })}
                </div>

                {iv.notes && (
                  <div className="px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                    <p className="text-xs text-emerald-700"><span className="font-semibold">Note : </span>{iv.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
