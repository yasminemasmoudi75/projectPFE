import { useState } from 'react';
import { AlertCircle, Clock, CheckCircle, Plus, MessageSquare } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockReclamations = [
  { id: 'REC-001', client: 'Tech Solutions SARL', objet: 'Produit défectueux',          description: 'Le produit livré ne fonctionne pas correctement',   priorite: 'haute',   statut: 'ouverte',  date: '19/01/2026', technicien: 'Non assigné',    messages: 2 },
  { id: 'REC-002', client: 'Digital Services',    objet: 'Retard de livraison',          description: "La commande n'a pas été livrée dans les délais",   priorite: 'moyenne', statut: 'en_cours', date: '18/01/2026', technicien: 'Jean Dupont',     messages: 5 },
  { id: 'REC-003', client: 'Innovation Corp',     objet: 'Demande de remboursement',     description: 'Client souhaite retourner le produit',              priorite: 'basse',   statut: 'resolue',  date: '17/01/2026', technicien: 'Marie Laurent',   messages: 8 },
  { id: 'REC-004', client: 'Web Agency Pro',      objet: 'Problème technique',           description: "Erreur lors de l'installation du logiciel",         priorite: 'haute',   statut: 'en_cours', date: '16/01/2026', technicien: 'Pierre Martin',   messages: 3 },
];

const prioriteStyle: Record<string, string> = {
  haute:   'bg-red-50    text-red-700',
  moyenne: 'bg-amber-50  text-amber-700',
  basse:   'bg-slate-100 text-slate-600',
};
const statutConfig: Record<string, { label: string; badge: string; icon: typeof AlertCircle }> = {
  ouverte:  { label: 'Ouverte',   badge: 'bg-red-50    text-red-700',     icon: AlertCircle  },
  en_cours: { label: 'En cours',  badge: 'bg-blue-50   text-blue-700',    icon: Clock        },
  resolue:  { label: 'Résolue',   badge: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
};

const tabs = [
  { value: 'toutes',   label: 'Toutes'    },
  { value: 'ouverte',  label: 'Ouvertes'  },
  { value: 'en_cours', label: 'En cours'  },
  { value: 'resolue',  label: 'Résolues'  },
];

export function Reclamations() {
  const [activeTab, setActiveTab] = useState('toutes');

  const filtered = mockReclamations.filter(r => activeTab === 'toutes' || r.statut === activeTab);

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Réclamations</h1>
              <p className="text-sm text-slate-500">Créez et suivez les réclamations clients</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle réclamation
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {tabs.map(t => (
          <button key={t.value}
            onClick={() => setActiveTab(t.value)}
            className={cn('px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
              activeTab === t.value ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
            {t.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(r => {
          const statConf = statutConfig[r.statut];
          const StatutIcon = statConf.icon;
          return (
            <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-mono font-bold text-blue-600">{r.id}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[r.priorite])}>
                      {r.priorite}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statConf.badge)}>
                      <StatutIcon className="w-3 h-3" />{statConf.label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-700">{r.client}</p>
                  <p className="text-sm font-semibold text-slate-900 mt-0.5">{r.objet}</p>
                  <p className="text-xs text-slate-500 mt-1">{r.description}</p>
                </div>
                <div className="ml-4 text-right flex-shrink-0">
                  <p className="text-xs text-slate-400 mb-1">{r.date}</p>
                  <div className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-full">
                    <MessageSquare className="w-3 h-3" />{r.messages}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Technicien : <span className={cn('font-medium', r.technicien === 'Non assigné' ? 'text-red-500' : 'text-slate-700')}>{r.technicien}</span>
                </p>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                    Voir détails
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    <MessageSquare className="w-3 h-3" /> Contacter
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
