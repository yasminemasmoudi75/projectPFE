import { BarChart3, Download, Activity, Users, CheckCircle, TrendingUp } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const kpis = [
  { label: 'Total Activités',         value: '352', change: '+12%', up: true,  icon: Activity     },
  { label: 'Clients Contactés',       value: '87',  change: '+8%',  up: true,  icon: Users        },
  { label: 'Réclamations Traitées',   value: '91',  change: '+15%', up: true,  icon: CheckCircle  },
  { label: 'Taux de Résolution',      value: '94%', change: '+2%',  up: true,  icon: TrendingUp   },
];

const perfMensuelle = [
  { mois: 'Janvier',   activites: 45, reclamations: 12, resolues: 10 },
  { mois: 'Février',   activites: 52, reclamations: 15, resolues: 13 },
  { mois: 'Mars',      activites: 48, reclamations: 18, resolues: 16 },
  { mois: 'Avril',     activites: 61, reclamations: 14, resolues: 15 },
  { mois: 'Mai',       activites: 55, reclamations: 20, resolues: 18 },
  { mois: 'Juin',      activites: 67, reclamations: 16, resolues: 19 },
];

const typeActivites = [
  { name: 'Appels',  value: 145, pct: 41 },
  { name: 'Emails',  value: 98,  pct: 28 },
  { name: 'Visites', value: 42,  pct: 12 },
  { name: 'Notes',   value: 67,  pct: 19 },
];

const topClients = [
  { nom: 'Tech Solutions SARL', activites: 28, reclamations: 5 },
  { nom: 'Cloud Masters',       activites: 24, reclamations: 8 },
  { nom: 'Digital Services',    activites: 19, reclamations: 3 },
  { nom: 'Innovation Corp',     activites: 17, reclamations: 4 },
  { nom: 'Web Agency Pro',      activites: 15, reclamations: 2 },
];

export function Rapports() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Rapports & Statistiques</h1>
              <p className="text-sm text-slate-500">Analyse détaillée de vos performances</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Exporter PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className="w-5 h-5 text-blue-600" /></div>
                <span className={cn('flex items-center gap-1 text-xs font-semibold', k.up ? 'text-emerald-600' : 'text-red-500')}>
                  <TrendingUp className="w-3 h-3" />{k.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Performance mensuelle */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Performance mensuelle</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Mois', 'Activités', 'Réclamations', 'Résolues'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfMensuelle.map((m, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{m.mois}</td>
                  <td className="px-4 py-3 text-slate-600">{m.activites}</td>
                  <td className="px-4 py-3 text-slate-600">{m.reclamations}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{m.resolues}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Répartition activités */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><Activity className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Répartition par type</h2>
          </div>
          <div className="p-5 space-y-4">
            {typeActivites.map((t, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{t.value} activités</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{t.pct}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Clients */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Users className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Top 5 Clients les plus actifs</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {topClients.map((c, i) => (
            <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 flex items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.nom}</p>
                  <p className="text-xs text-slate-500">{c.activites} activités</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Réclamations : <span className="font-semibold text-slate-700">{c.reclamations}</span></span>
                <button className="px-2.5 py-1 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">Voir</button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
