import { Bot, Send, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const relances = [
  { id: 'REL-001', client: 'Tech Solutions SARL', type: 'Devis non répondu', ref: 'DEV-234', montant: '45 000 €', statut: 'Planifiée', dateRelance: '22/01/2026', priorite: 'Haute'    },
  { id: 'REL-002', client: 'Digital Agency',       type: 'Projet en retard',  ref: 'PRO-156', montant: '89 000 €', statut: 'Envoyée',   dateRelance: '18/01/2026', priorite: 'Critique' },
  { id: 'REL-003', client: 'Innovation Corp',      type: 'Facture impayée',   ref: 'FAC-789', montant: '25 000 €', statut: 'Envoyée',   dateRelance: '20/01/2026', priorite: 'Moyenne'  },
  { id: 'REL-004', client: 'Web Solutions Pro',    type: 'Devis non répondu', ref: 'DEV-241', montant: '12 500 €', statut: 'Planifiée', dateRelance: '25/01/2026', priorite: 'Basse'    },
];

const statutStyle: Record<string, string> = {
  Planifiée: 'bg-blue-50   text-blue-700',
  Envoyée:   'bg-emerald-50 text-emerald-700',
  Ignorée:   'bg-slate-100  text-slate-500',
};
const prioriteStyle: Record<string, string> = {
  Critique: 'bg-red-50    text-red-700',
  Haute:    'bg-amber-50  text-amber-700',
  Moyenne:  'bg-yellow-50 text-yellow-700',
  Basse:    'bg-slate-100 text-slate-600',
};

export function RelancesIA() {
  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Relances Automatiques IA</h1>
              <p className="text-sm text-slate-500">Relances intelligentes gérées par l'IA</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle relance
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total relances', value: relances.length,                                    icon: Bot          },
          { label: 'Planifiées',     value: relances.filter(r => r.statut === 'Planifiée').length, icon: Clock     },
          { label: 'Envoyées',       value: relances.filter(r => r.statut === 'Envoyée').length,   icon: Send      },
          { label: 'Critiques',      value: relances.filter(r => r.priorite === 'Critique').length, icon: AlertCircle },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className="w-5 h-5 text-blue-600" /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Bot className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Liste des Relances</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['ID', 'Client', 'Type', 'Référence', 'Montant', 'Priorité', 'Statut', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relances.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{r.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.client}</td>
                <td className="px-4 py-3 text-slate-600">{r.type}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{r.ref}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.montant}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[r.priorite])}>{r.priorite}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[r.statut])}>
                    {r.statut === 'Envoyée' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {r.statut}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{r.dateRelance}</td>
                <td className="px-4 py-3">
                  <button className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                    <Send className="w-3 h-3" /> Envoyer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
