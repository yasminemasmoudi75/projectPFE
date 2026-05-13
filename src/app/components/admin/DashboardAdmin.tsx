import {
  Users, Building2, Briefcase, DollarSign,
  AlertTriangle, Clock, Target, CheckCircle, Package, TrendingUp
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const statsCards = [
  { label: 'Utilisateurs actifs', value: '47',    change: '+5 ce mois',  icon: Users,     color: 'text-blue-600'    },
  { label: 'Sociétés clientes',   value: '128',   change: '+12 ce mois', icon: Building2, color: 'text-blue-600'    },
  { label: 'Projets actifs',      value: '34',    change: '+8 ce mois',  icon: Briefcase, color: 'text-blue-600'    },
  { label: "CA du mois",          value: '156K€', change: '+18%',        icon: DollarSign,color: 'text-blue-600'    },
];

const alertesStocks = [
  { produit: 'Serveur HP ProLiant DL380', stock: 2,  seuil: 5,  statut: 'critique' },
  { produit: 'Switch Cisco 24 ports',     stock: 4,  seuil: 10, statut: 'faible'   },
  { produit: 'Licence Microsoft 365',     stock: 8,  seuil: 20, statut: 'faible'   },
];

const projetsCritiques = [
  { code: 'PRO-156', client: 'Tech Solutions',  statut: 'En retard', deadline: '25 jan. 2026' },
  { code: 'PRO-167', client: 'Digital Agency',  statut: 'Critique',  deadline: '22 jan. 2026' },
];

const objectifsEquipe = [
  { equipe: 'Commerciaux', objectif: 50000, realise: 38500, pct: 77 },
  { equipe: 'Techniciens', objectif: 40,    realise: 32,    pct: 80 },
  { equipe: 'Agents',      objectif: 100,   realise: 85,    pct: 85 },
];

const quickStats = [
  { icon: CheckCircle,   value: '156', label: 'Commandes traitées',    color: 'text-emerald-600' },
  { icon: Clock,         value: '23',  label: 'Projets en cours',      color: 'text-blue-600'    },
  { icon: Package,       value: '289', label: 'Produits en stock',     color: 'text-slate-600'   },
  { icon: AlertTriangle, value: '12',  label: 'Réclamations ouvertes', color: 'text-amber-600'   },
];

export function DashboardAdmin() {
  return (
    <div className="space-y-5">

      {/* ── Welcome ── */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Tableau de bord</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Vue d'ensemble · {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stats ── */}
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

        {/* ── Alertes stocks ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><AlertTriangle className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Alertes Stocks</h3>
          </div>
          <div className="p-4 space-y-2">
            {alertesStocks.map((item, i) => (
              <div key={i} className={cn(
                'flex items-center justify-between p-3 rounded-xl border-l-4',
                item.statut === 'critique' ? 'border-red-400 bg-red-50/50' : 'border-amber-400 bg-amber-50/50'
              )}>
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.produit}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Stock : <span className="font-bold text-slate-700">{item.stock}</span> / Seuil : {item.seuil}</p>
                </div>
                <span className={cn('text-xs font-semibold uppercase px-2.5 py-1 rounded-full',
                  item.statut === 'critique' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                  {item.statut}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Projets critiques ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><Clock className="w-4 h-4 text-blue-600" /></div>
            <h3 className="text-sm font-semibold text-slate-800">Projets Critiques</h3>
          </div>
          <div className="p-4 space-y-2">
            {projetsCritiques.map((p) => (
              <div key={p.code} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-mono font-bold text-blue-600">{p.code}</p>
                  <p className="text-xs text-slate-500">{p.client}</p>
                </div>
                <div className="text-right">
                  <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full',
                    p.statut === 'Critique' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                    {p.statut}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{p.deadline}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Objectifs équipes ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Target className="w-4 h-4 text-blue-600" /></div>
          <h3 className="text-sm font-semibold text-slate-800">Objectifs des Équipes</h3>
        </div>
        <div className="p-5 space-y-4">
          {objectifsEquipe.map((o, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-slate-700">{o.equipe}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{o.realise.toLocaleString('fr-FR')} / {o.objectif.toLocaleString('fr-FR')}</span>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                    o.pct >= 80 ? 'bg-emerald-50 text-emerald-700' : o.pct >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                    {o.pct}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500',
                  o.pct >= 80 ? 'bg-emerald-500' : o.pct >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                  style={{ width: `${o.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((q, i) => {
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
