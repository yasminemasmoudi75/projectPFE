import { Briefcase, FileText, Target, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const statsCards = [
  { label: 'Projets actifs',   value: '8',    change: '+2 ce mois',  icon: Briefcase,  color: 'text-blue-600' },
  { label: 'Devis en cours',   value: '12',   change: '+4 ce mois',  icon: FileText,   color: 'text-blue-600' },
  { label: 'CA du mois',       value: '45K€', change: '+18%',        icon: DollarSign, color: 'text-blue-600' },
  { label: 'Objectif mensuel', value: '75%',  change: 'En bonne voie', icon: Target,   color: 'text-blue-600' },
];

const mesDevis = [
  { id: 'DEV-234', client: 'Tech Solutions SARL', montant: '45 000 €', date: '10/01/2026', statut: 'En attente' },
  { id: 'DEV-241', client: 'Digital Agency',       montant: '89 000 €', date: '12/01/2026', statut: 'Accepté'   },
  { id: 'DEV-245', client: 'Innovation Corp',      montant: '32 000 €', date: '15/01/2026', statut: 'En attente' },
  { id: 'DEV-248', client: 'Cloud Masters',        montant: '67 000 €', date: '18/01/2026', statut: 'Refusé'    },
];

const projetsRecents = [
  { id: 'PROJ-001', nom: 'Migration Cloud Solutions', client: 'Tech Solutions',  progression: 65, statut: 'En cours'  },
  { id: 'PROJ-002', nom: 'ERP Implementation',         client: 'Digital Agency',  progression: 40, statut: 'En cours'  },
  { id: 'PROJ-003', nom: 'Infrastructure réseau',       client: 'Innovation Corp', progression: 15, statut: 'Planifié'  },
];

const devisStatutStyle: Record<string, string> = {
  'En attente': 'bg-amber-50   text-amber-700',
  'Accepté':    'bg-emerald-50 text-emerald-700',
  'Refusé':     'bg-red-50     text-red-700',
};

export function DashboardCommercial() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Tableau de bord Commercial</h2>
        <p className="text-sm text-slate-500 mt-0.5">Gérez vos projets, devis et objectifs</p>
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

        {/* Devis récents */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><FileText className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Mes Devis récents</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {mesDevis.map(d => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-mono font-bold text-blue-600">{d.id}</p>
                  <p className="text-xs text-slate-500">{d.client}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800">{d.montant}</p>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', devisStatutStyle[d.statut])}>{d.statut}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projets en cours */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><Briefcase className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Projets en cours</h3>
          </div>
          <div className="p-4 space-y-4">
            {projetsRecents.map(p => (
              <div key={p.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.nom}</p>
                    <p className="text-xs text-slate-500">{p.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                      p.progression >= 60 ? 'bg-emerald-50 text-emerald-700' : p.progression >= 30 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')}>
                      {p.progression}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all',
                    p.progression >= 60 ? 'bg-emerald-500' : p.progression >= 30 ? 'bg-amber-400' : 'bg-blue-400')}
                    style={{ width: `${p.progression}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, value: '156', label: 'Commandes livrées', color: 'text-emerald-600' },
          { icon: Clock,       value: '23',  label: 'Devis en attente',  color: 'text-amber-600'   },
          { icon: TrendingUp,  value: '68%', label: 'Taux de conversion', color: 'text-blue-600'  },
        ].map((q, i) => {
          const Icon = q.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
              <Icon className={cn('w-6 h-6 mx-auto mb-2', q.color)} />
              <p className={cn('text-2xl font-bold', q.color)}>{q.value}</p>
              <p className="text-xs text-slate-400 mt-1">{q.label}</p>
            </div>
          );
        })}
      </div>

    </div>
  );
}
