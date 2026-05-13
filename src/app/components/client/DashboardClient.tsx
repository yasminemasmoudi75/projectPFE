import { AlertCircle, CheckCircle, Clock, Wrench, TrendingUp } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const statsCards = [
  { label: 'Réclamations ouvertes', value: '3',  change: '+1 vs hier', icon: AlertCircle, color: 'text-blue-600' },
  { label: 'En traitement',         value: '2',  change: 'Stable',     icon: Clock,       color: 'text-blue-600' },
  { label: 'Résolues ce mois',      value: '15', change: '+3 vs mois', icon: CheckCircle, color: 'text-blue-600' },
  { label: 'Interventions totales', value: '18', change: 'Total',      icon: Wrench,      color: 'text-blue-600' },
];

const mockReclamationsRecentes = [
  { id: 'REC-045', sujet: 'Serveur ne démarre plus',  statut: 'En cours', date: '19/01/2026', priorite: 'Critique' },
  { id: 'REC-042', sujet: 'Problème réseau WiFi',     statut: 'Affectée', date: '18/01/2026', priorite: 'Haute'    },
  { id: 'REC-038', sujet: 'Mise à jour système',      statut: 'Résolue',  date: '15/01/2026', priorite: 'Moyenne'  },
];

const mockInterventionsRecentes = [
  { id: 'INT-089', technicien: 'Mohamed Tech',   type: 'Maintenance',  date: '17/01/2026', duree: '3h' },
  { id: 'INT-085', technicien: 'Youssef Support', type: 'Installation', date: '14/01/2026', duree: '4h' },
];

const prioriteStyle: Record<string, string> = {
  Critique: 'bg-red-50    text-red-700',
  Haute:    'bg-amber-50  text-amber-700',
  Moyenne:  'bg-slate-100 text-slate-600',
};

const statutStyle: Record<string, string> = {
  'En cours': 'bg-blue-50    text-blue-700',
  'Affectée': 'bg-amber-50   text-amber-700',
  'Résolue':  'bg-emerald-50 text-emerald-700',
};

export function DashboardClient() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Bienvenue</h2>
        <p className="text-sm text-slate-500 mt-0.5">Tech Solutions SARL — Suivi de vos services</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Réclamations récentes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><AlertCircle className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Réclamations Récentes</h3>
          </div>
          <div className="p-4 space-y-3">
            {mockReclamationsRecentes.map(r => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono font-bold text-blue-600">{r.id}</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[r.statut] || 'bg-slate-100 text-slate-600')}>
                    {r.statut}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-2">{r.sujet}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{r.date}</span>
                  <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', prioriteStyle[r.priorite] || 'bg-slate-100 text-slate-600')}>
                    {r.priorite}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interventions récentes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><Wrench className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Interventions Récentes</h3>
          </div>
          <div className="p-4 space-y-3">
            {mockInterventionsRecentes.map(iv => (
              <div key={iv.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-mono font-bold text-blue-600">{iv.id}</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{iv.type}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800 mb-2">Technicien : {iv.technicien}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">{iv.date}</span>
                  <span className="text-[10px] text-slate-400">Durée : {iv.duree}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
