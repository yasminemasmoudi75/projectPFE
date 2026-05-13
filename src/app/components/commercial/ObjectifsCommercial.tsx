import { Target, Award, DollarSign, FileText, MapPin, TrendingUp } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const objectifs = [
  { label: "Chiffre d'Affaires",  icon: DollarSign, objectif: 50000, realise: 38500, unite: '€',      pct: 77 },
  { label: 'Devis Créés',         icon: FileText,   objectif: 20,    realise: 16,    unite: '',        pct: 80 },
  { label: 'Visites Clients',     icon: MapPin,     objectif: 15,    realise: 11,    unite: '',        pct: 73 },
  { label: 'Conversions',         icon: TrendingUp, objectif: 8,     realise: 5,     unite: '',        pct: 63 },
];

const objectifsHebdo = [
  { semaine: 'Semaine 3 (13-19 Jan)', ca: 12000, objectif: 12500, pct: 96, devis: 5, visites: 4 },
  { semaine: 'Semaine 2 (06-12 Jan)', ca: 11500, objectif: 12500, pct: 92, devis: 6, visites: 3 },
  { semaine: 'Semaine 1 (01-05 Jan)', ca: 9000,  objectif: 12500, pct: 72, devis: 5, visites: 4 },
];

const recompenses = [
  { titre: 'Top Vendeur Janvier',  description: 'Meilleur CA du mois',        statut: 'En cours', pct: 77  },
  { titre: 'Expert Conversion',    description: '80% de taux de conversion',  statut: 'Atteint',  pct: 100 },
  { titre: 'Marathon Commercial',  description: '15 visites clients',          statut: 'En cours', pct: 73  },
];

export function ObjectifsCommercial() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mes Objectifs</h1>
            <p className="text-sm text-slate-500">Suivez votre performance et atteignez vos objectifs</p>
          </div>
        </div>
      </div>

      {/* Objectifs mensuels */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Target className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Objectifs de Janvier 2026</h2>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {objectifs.map((o, i) => {
            const Icon = o.icon;
            const pctColor = o.pct >= 80 ? 'bg-emerald-500' : o.pct >= 60 ? 'bg-blue-500' : 'bg-amber-400';
            const pctBadge = o.pct >= 80 ? 'bg-emerald-50 text-emerald-700' : o.pct >= 60 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700';
            const reste = o.objectif - o.realise;
            return (
              <div key={i} className="border border-slate-100 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-slate-50"><Icon className="w-4 h-4 text-blue-600" /></div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{o.label}</p>
                      <p className="text-xs text-slate-400">Objectif mensuel</p>
                    </div>
                  </div>
                  <span className={cn('text-sm font-bold px-2.5 py-1 rounded-full', pctBadge)}>{o.pct}%</span>
                </div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xl font-bold text-slate-900">
                    {o.unite}{o.realise.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-xs text-slate-400">/ {o.unite}{o.objectif.toLocaleString('fr-FR')}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-2">
                  <div className={cn('h-full rounded-full', pctColor)} style={{ width: `${o.pct}%` }} />
                </div>
                <p className="text-xs text-slate-500">
                  Reste : <span className="font-semibold text-slate-700">{o.unite}{reste.toLocaleString('fr-FR')}</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance hebdomadaire */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Performance Hebdomadaire</h2>
        </div>
        <div className="p-4 space-y-3">
          {objectifsHebdo.map((s, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.semaine}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.devis} devis · {s.visites} visites</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{s.ca.toLocaleString('fr-FR')} €</p>
                  <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                    s.pct >= 90 ? 'bg-emerald-50 text-emerald-700' : s.pct >= 70 ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700')}>
                    {s.pct}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={cn('h-full rounded-full',
                  s.pct >= 90 ? 'bg-emerald-500' : s.pct >= 70 ? 'bg-blue-500' : 'bg-amber-400')}
                  style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Récompenses */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Award className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Récompenses & Badges</h2>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {recompenses.map((r, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className={cn('p-2 rounded-lg', r.statut === 'Atteint' ? 'bg-emerald-50' : 'bg-slate-50')}>
                  <Award className={cn('w-4 h-4', r.statut === 'Atteint' ? 'text-emerald-600' : 'text-slate-400')} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{r.titre}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-500">Progression</span>
                <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full',
                  r.statut === 'Atteint' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600')}>
                  {r.pct}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={cn('h-full rounded-full', r.statut === 'Atteint' ? 'bg-emerald-500' : 'bg-blue-500')}
                  style={{ width: `${r.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
