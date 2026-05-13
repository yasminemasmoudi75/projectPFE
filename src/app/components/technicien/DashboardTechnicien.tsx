import { AlertCircle, Clock, CheckCircle, TrendingUp, Wrench, Award } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const statsCards = [
  { label: 'Réclamations assignées', value: '12', change: '+3 vs hier', icon: AlertCircle, color: 'text-blue-600' },
  { label: 'En cours',               value: '5',  change: '+2 vs hier', icon: Clock,       color: 'text-blue-600' },
  { label: 'Résolues ce mois',       value: '28', change: '+12%',       icon: CheckCircle, color: 'text-blue-600' },
  { label: 'Taux de résolution',     value: '92%', change: '+5%',       icon: TrendingUp,  color: 'text-blue-600' },
];

const urgentReclamations = [
  { id: 'REC-234', client: 'Tech Solutions SARL', objet: 'Panne matériel critique',         priorite: 'Haute',   temps: '2h'      },
  { id: 'REC-235', client: 'Digital Services',    objet: 'Problème configuration réseau',   priorite: 'Haute',   temps: '4h'      },
  { id: 'REC-236', client: 'Innovation Corp',     objet: 'Erreur logicielle bloquante',     priorite: 'Moyenne', temps: '1h 30min' },
];

const interventionsJour = [
  { heure: '09:00', client: 'Web Agency Pro',  type: 'Maintenance',  duree: '2h'      },
  { heure: '14:00', client: 'Cloud Masters',   type: 'Installation', duree: '3h'      },
  { heure: '16:30', client: 'Tech Solutions',  type: 'Réparation',   duree: '1h 30min' },
];

const perfStats = [
  { value: '28',   label: 'Interventions réalisées', color: 'text-blue-600'    },
  { value: '92%',  label: 'Taux de satisfaction',    color: 'text-emerald-600' },
  { value: '2.5h', label: 'Temps moyen',             color: 'text-blue-600'    },
  { value: '156h', label: 'Heures travaillées',      color: 'text-blue-600'    },
];

export function DashboardTechnicien() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Tableau de bord Technicien</h2>
        <p className="text-sm text-slate-500 mt-0.5">Vue d'ensemble de vos activités — Janvier 2026</p>
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

        {/* Réclamations urgentes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><AlertCircle className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Réclamations Urgentes</h3>
          </div>
          <div className="p-4 space-y-3">
            {urgentReclamations.map(r => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between mb-1">
                  <div>
                    <span className="text-sm font-mono font-bold text-blue-600">{r.id}</span>
                    <p className="text-xs text-slate-500">{r.client}</p>
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                    r.priorite === 'Haute' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700')}>
                    {r.priorite}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 mb-2">{r.objet}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />{r.temps}
                  </div>
                  <button className="px-2.5 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Traiter
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interventions du jour */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><Wrench className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Interventions d'aujourd'hui</h3>
          </div>
          <div className="p-4 space-y-3">
            {interventionsJour.map((iv, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="text-center min-w-[64px] bg-blue-50 rounded-lg p-2 border border-blue-100">
                  <p className="text-sm font-bold text-blue-600">{iv.heure}</p>
                  <p className="text-[10px] text-slate-400">{iv.duree}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">{iv.client}</p>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 mt-0.5 inline-block">{iv.type}</span>
                </div>
                <button className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">Voir</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Award className="w-4 h-4 text-blue-600" /></div>
          <h3 className="text-sm font-semibold text-slate-800">Performance du mois</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-0 divide-x divide-slate-100">
          {perfStats.map((p, i) => (
            <div key={i} className="p-5 text-center">
              <p className={cn('text-2xl font-bold', p.color)}>{p.value}</p>
              <p className="text-xs text-slate-400 mt-1">{p.label}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
