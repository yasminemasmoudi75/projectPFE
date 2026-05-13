import { TrendingUp, TrendingDown, DollarSign, Users, Briefcase, Target, BarChart3, Award, Download } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const kpis = [
  { label: 'CA Total',         value: '156 400 €', change: '+18%', up: true,  icon: DollarSign },
  { label: 'Nouveaux Clients', value: '12',          change: '+25%', up: true,  icon: Users      },
  { label: 'Projets Actifs',   value: '34',          change: '+8%',  up: true,  icon: Briefcase  },
  { label: 'Taux Conversion',  value: '68%',         change: '-2%',  up: false, icon: Target     },
];

const perfMensuelle = [
  { mois: 'Janvier',  objectif: 50000, realise: 38500, clients: 12 },
  { mois: 'Décembre', objectif: 45000, realise: 47200, clients: 15 },
  { mois: 'Novembre', objectif: 40000, realise: 39800, clients: 10 },
  { mois: 'Octobre',  objectif: 42000, realise: 44500, clients: 13 },
];

const topCommerciaux = [
  { nom: 'Fatima Zahra', ca: 82500, clients: 18, projets: 15, taux: 72 },
  { nom: 'Karim Sales',  ca: 73900, clients: 16, projets: 13, taux: 68 },
];

const topClients = [
  { nom: 'Innovation Corp',   ca: 156000, projets: 6, sat: 92 },
  { nom: 'Tech Solutions SARL',ca: 125000, projets: 5, sat: 95 },
  { nom: 'Digital Agency',    ca: 89000,  projets: 4, sat: 88 },
  { nom: 'Cloud Masters',     ca: 67000,  projets: 3, sat: 90 },
];

export function StatistiquesTableaux() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Statistiques & Tableaux de bord</h1>
              <p className="text-sm text-slate-500">Analyse de performance — Janvier 2026</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className="w-5 h-5 text-blue-600" /></div>
                <span className={cn('flex items-center gap-1 text-xs font-semibold',
                  k.up ? 'text-emerald-600' : 'text-red-500')}>
                  {k.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {k.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{k.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{k.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── Performance mensuelle ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Performance Mensuelle</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Mois', 'Objectif', 'Réalisé', 'Taux', 'Clients'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {perfMensuelle.map((m, i) => {
                const pct = Math.round(m.realise / m.objectif * 100);
                return (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{m.mois}</td>
                    <td className="px-4 py-3 text-slate-500">{m.objectif.toLocaleString('fr-FR')} €</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{m.realise.toLocaleString('fr-FR')} €</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                        pct >= 100 ? 'bg-emerald-50 text-emerald-700' : pct >= 80 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                        {pct}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{m.clients}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Top Clients ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><Award className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Top Clients</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Client', 'CA Total', 'Projets', 'Satisfaction'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {topClients.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                      <span className="font-medium text-slate-800">{c.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.ca.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-slate-500">{c.projets}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${c.sat}%` }} />
                      </div>
                      <span className="text-xs text-slate-500">{c.sat}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Top Commerciaux ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Users className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Classement Commerciaux</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['#', 'Nom', 'CA Réalisé', 'Clients', 'Projets', 'Taux conv.'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {topCommerciaux.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-slate-400">#{i + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                      {c.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-800">{c.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{c.ca.toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3 text-slate-600">{c.clients}</td>
                <td className="px-4 py-3 text-slate-600">{c.projets}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                    c.taux >= 70 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700')}>
                    {c.taux}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
