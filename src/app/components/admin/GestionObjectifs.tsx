import { Target, Users, TrendingUp, Plus } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const objectifs = [
  { equipe: 'Commerciaux', type: "Chiffre d'Affaires", periode: 'Janvier 2026', objectif: 50000, realise: 38500, pct: 77,  unite: '€', membres: 2 },
  { equipe: 'Techniciens', type: 'Interventions',       periode: 'Janvier 2026', objectif: 40,    realise: 32,    pct: 80,  unite: '',  membres: 3 },
  { equipe: 'Agents',      type: 'Réclamations',        periode: 'Janvier 2026', objectif: 100,   realise: 85,    pct: 85,  unite: '',  membres: 2 },
];

const individus = [
  { nom: 'Fatima Zahra',  equipe: 'Commercial', objectif: 25000, realise: 22000, pct: 88 },
  { nom: 'Karim Sales',   equipe: 'Commercial', objectif: 25000, realise: 16500, pct: 66 },
  { nom: 'Mohamed Tech',  equipe: 'Technicien', objectif: 20,    realise: 18,    pct: 90 },
  { nom: 'Youssef Agent', equipe: 'Technicien', objectif: 20,    realise: 14,    pct: 70 },
];

export function GestionObjectifs() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Objectifs</h1>
              <p className="text-sm text-slate-500">Suivez les performances des équipes — Janvier 2026</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvel objectif
          </button>
        </div>
      </div>

      {/* ── Objectifs équipes ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Users className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Objectifs par Équipe</h2>
        </div>
        <div className="p-5 space-y-5">
          {objectifs.map((o, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-semibold text-slate-800">{o.equipe}</span>
                  <span className="text-xs text-slate-400 ml-2">{o.type}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    {o.realise.toLocaleString('fr-FR')}{o.unite} / {o.objectif.toLocaleString('fr-FR')}{o.unite}
                  </span>
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
              <p className="text-xs text-slate-400 mt-1">{o.membres} membre{o.membres > 1 ? 's' : ''} · {o.periode}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Objectifs individuels ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Performances Individuelles</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Collaborateur', 'Équipe', 'Objectif', 'Réalisé', 'Progression', 'Taux'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {individus.map((ind, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                      {ind.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-800">{ind.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{ind.equipe}</span>
                </td>
                <td className="px-4 py-3 text-slate-600">{ind.objectif.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{ind.realise.toLocaleString('fr-FR')}</td>
                <td className="px-4 py-3 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={cn('h-full rounded-full', ind.pct >= 80 ? 'bg-emerald-500' : ind.pct >= 60 ? 'bg-amber-400' : 'bg-red-400')}
                        style={{ width: `${ind.pct}%` }} />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                    ind.pct >= 80 ? 'bg-emerald-50 text-emerald-700' : ind.pct >= 60 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
                    {ind.pct}%
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
