import { useState } from 'react';
import { AlertCircle, Clock, CheckCircle, Plus, Eye, User, Calendar } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockReclamations = [
  { id: 'REC-045', sujet: 'Serveur ne démarre plus',    description: 'Le serveur principal refuse de démarrer depuis ce matin.',      priorite: 'Critique', statut: 'en_cours', technicien: 'Mohamed Tech',    dateCreation: '19/01/2026 09:30', dateResolution: null            },
  { id: 'REC-042', sujet: 'Problème réseau WiFi',       description: 'Connexion internet instable dans le bureau.',                    priorite: 'Haute',    statut: 'affectee', technicien: 'Youssef Support', dateCreation: '18/01/2026 14:20', dateResolution: null            },
  { id: 'REC-038', sujet: 'Mise à jour système',        description: 'Demande de mise à jour du système ERP.',                        priorite: 'Moyenne',  statut: 'resolue',  technicien: 'Mohamed Tech',    dateCreation: '15/01/2026 10:15', dateResolution: '17/01/2026 16:30' },
  { id: 'REC-035', sujet: "Imprimante bloquée",         description: "L'imprimante du service RH ne répond plus.",                    priorite: 'Basse',    statut: 'resolue',  technicien: 'Youssef Support', dateCreation: '14/01/2026 11:00', dateResolution: '14/01/2026 15:00' },
];

const prioriteStyle: Record<string, string> = {
  Critique: 'bg-red-50    text-red-700',
  Haute:    'bg-amber-50  text-amber-700',
  Moyenne:  'bg-slate-100 text-slate-600',
  Basse:    'bg-slate-100 text-slate-500',
};

const statutConfig: Record<string, { label: string; badge: string; icon: typeof AlertCircle }> = {
  ouverte:  { label: 'Ouverte',  badge: 'bg-red-50    text-red-700',    icon: AlertCircle },
  affectee: { label: 'Affectée', badge: 'bg-amber-50  text-amber-700',  icon: Clock       },
  en_cours: { label: 'En cours', badge: 'bg-blue-50   text-blue-700',   icon: Clock       },
  resolue:  { label: 'Résolue',  badge: 'bg-emerald-50 text-emerald-700', icon: CheckCircle },
};

const tabs = [
  { value: 'toutes',   label: 'Toutes'    },
  { value: 'ouverte',  label: 'Ouvertes'  },
  { value: 'affectee', label: 'Affectées' },
  { value: 'en_cours', label: 'En cours'  },
  { value: 'resolue',  label: 'Résolues'  },
];

export function ReclamationsClient() {
  const [activeTab, setActiveTab] = useState('toutes');
  const [showForm, setShowForm] = useState(false);
  const [newSujet, setNewSujet] = useState('');
  const [newPriorite, setNewPriorite] = useState('Moyenne');
  const [newDescription, setNewDescription] = useState('');

  const filtered = mockReclamations.filter(r =>
    activeTab === 'toutes' || r.statut === activeTab
  );

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mes Réclamations</h1>
              <p className="text-sm text-slate-500">Créez et suivez vos réclamations</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle réclamation
          </button>
        </div>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Créer une réclamation</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sujet</label>
              <input
                type="text"
                value={newSujet}
                onChange={e => setNewSujet(e.target.value)}
                placeholder="Décrivez brièvement le problème"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priorité</label>
              <select
                value={newPriorite}
                onChange={e => setNewPriorite(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
                <option>Critique</option>
                <option>Haute</option>
                <option>Moyenne</option>
                <option>Basse</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                rows={3}
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                placeholder="Détaillez le problème rencontré..."
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                Annuler
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                Soumettre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit flex-wrap">
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-mono font-bold text-blue-600">{r.id}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[r.priorite])}>
                      {r.priorite}
                    </span>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statConf.badge)}>
                      <StatutIcon className="w-3 h-3" />{statConf.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{r.sujet}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0 ml-4">{r.dateCreation}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
                {[
                  { icon: User,     label: r.technicien || 'Non affecté' },
                  { icon: Calendar, label: `Créée : ${r.dateCreation}`   },
                  { icon: CheckCircle, label: r.dateResolution ? `Résolue : ${r.dateResolution}` : 'En attente' },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg">
                      <Icon className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="text-xs text-slate-600 truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                  <Eye className="w-3 h-3" /> Voir détails
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
