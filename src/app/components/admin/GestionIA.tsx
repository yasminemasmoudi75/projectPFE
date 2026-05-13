import { Sparkles, Brain, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const predictions = [
  { titre: 'Objectif CA Janvier',  value: '52 000 €', confiance: 92, change: '+4%',  up: true  },
  { titre: 'Satisfaction Clients', value: '4.2 / 5',   confiance: 88, change: '+0.3', up: true  },
  { titre: 'Taux de Conversion',   value: '68%',        confiance: 85, change: '+5%',  up: true  },
];

const relances = [
  { client: 'Tech Solutions',  type: 'Devis en attente',    priorite: 'Haute',   prediction: '85% chance de conversion',  action: 'Relance automatique envoyée' },
  { client: 'Digital Agency',  type: 'Projet inactif',       priorite: 'Moyenne', prediction: "60% risque d'abandon",       action: 'Email de suivi programmé'    },
  { client: 'Innovation Corp', type: 'Satisfaction faible',  priorite: 'Haute',   prediction: '70% risque de churn',        action: 'Appel recommandé'            },
];

const prioriteStyle: Record<string, string> = {
  Haute:   'bg-red-50   text-red-700',
  Moyenne: 'bg-amber-50 text-amber-700',
};

export function GestionIA() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">IA & Relances Automatiques</h1>
              <p className="text-sm text-slate-500">Optimisez vos ventes avec l'intelligence artificielle</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Zap className="w-4 h-4" /> Configurer l'IA
          </button>
        </div>
      </div>

      {/* ── Prédictions ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {predictions.map((p, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-slate-50"><Brain className="w-4 h-4 text-blue-600" /></div>
              <span className={cn('flex items-center gap-1 text-xs font-semibold', p.up ? 'text-emerald-600' : 'text-red-500')}>
                <TrendingUp className="w-3 h-3" />{p.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{p.value}</p>
            <p className="text-sm text-slate-600 mt-0.5">{p.titre}</p>
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-400">Confiance IA</span>
                <span className="text-xs font-semibold text-slate-600">{p.confiance}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${p.confiance}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Relances IA ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Zap className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Relances Recommandées par l'IA</h2>
          <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{relances.length} actions</span>
        </div>
        <div className="divide-y divide-slate-100">
          {relances.map((r, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
              <div className="p-2 rounded-lg bg-slate-50 flex-shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-semibold text-slate-800 text-sm">{r.client}</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-500">{r.type}</span>
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[r.priorite])}>
                    {r.priorite}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-2">{r.prediction}</p>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-emerald-700 font-medium">{r.action}</span>
                </div>
              </div>
              <button className="flex-shrink-0 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                Voir
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
