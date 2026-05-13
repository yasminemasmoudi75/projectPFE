import { useState } from 'react';
import { Search, AlertCircle, Clock, CheckCircle, Play, MessageSquare, FileText, Building2, User } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockReclamations = [
  { id: 'REC-234', client: 'Tech Solutions SARL', contact: 'Ahmed Benali',  objet: 'Panne matériel critique - Serveur principal',  description: 'Le serveur principal ne démarre plus. Erreur critique au démarrage.',   priorite: 'Haute',   statut: 'assignee',  date: '19/01/2026 08:30', temps: '2h',      type: 'Réparation',      messages: 3 },
  { id: 'REC-235', client: 'Digital Services',    contact: 'Fatima Zahra',  objet: 'Problème configuration réseau',               description: 'Les postes ne peuvent plus accéder au réseau interne.',                  priorite: 'Haute',   statut: 'en_cours',  date: '19/01/2026 09:15', temps: '4h',      type: 'Configuration',   messages: 5 },
  { id: 'REC-236', client: 'Innovation Corp',     contact: 'Youssef Alami', objet: 'Erreur logicielle bloquante',                 description: "L'application de gestion crash au démarrage.",                          priorite: 'Moyenne', statut: 'assignee',  date: '18/01/2026 16:00', temps: '1h 30min', type: 'Support logiciel', messages: 2 },
  { id: 'REC-237', client: 'Web Agency Pro',      contact: 'Sarah Mokhtar', objet: 'Installation nouveau matériel',               description: 'Installation et configuration de 5 nouveaux PC.',                        priorite: 'Basse',   statut: 'en_cours',  date: '18/01/2026 10:00', temps: '6h',      type: 'Installation',    messages: 1 },
  { id: 'REC-238', client: 'Cloud Masters',       contact: 'Karim B.',      objet: 'Maintenance serveur cloud',                   description: 'Maintenance préventive et mise à jour système.',                        priorite: 'Moyenne', statut: 'terminee',  date: '17/01/2026 14:00', temps: '3h',      type: 'Maintenance',     messages: 4 },
];

const prioriteStyle: Record<string, string> = {
  Haute:   'bg-red-50    text-red-700',
  Moyenne: 'bg-amber-50  text-amber-700',
  Basse:   'bg-slate-100 text-slate-600',
};
const statutConfig: Record<string, { label: string; badge: string; icon: typeof AlertCircle }> = {
  assignee:  { label: 'Assignée', badge: 'bg-amber-50   text-amber-700',   icon: AlertCircle  },
  en_cours:  { label: 'En cours', badge: 'bg-blue-50    text-blue-700',    icon: Clock        },
  terminee:  { label: 'Terminée', badge: 'bg-emerald-50 text-emerald-700', icon: CheckCircle  },
};
const tabs = [
  { value: 'toutes',   label: 'Toutes'    },
  { value: 'assignee', label: 'Assignées' },
  { value: 'en_cours', label: 'En cours'  },
  { value: 'terminee', label: 'Terminées' },
];

export function ReclamationsTechnicien() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('assignee');

  const filtered = mockReclamations.filter(r => {
    const matchTab = activeTab === 'toutes' || r.statut === activeTab;
    const matchSearch = !search || r.client.toLowerCase().includes(search.toLowerCase()) || r.objet.toLowerCase().includes(search.toLowerCase()) || r.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mes Réclamations</h1>
            <p className="text-sm text-slate-500">Consultez et gérez les réclamations qui vous sont assignées</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par numéro, client ou objet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-mono font-bold text-blue-600">{r.id}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[r.priorite])}>{r.priorite}</span>
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statConf.badge)}>
                      <StatutIcon className="w-3 h-3" />{statConf.label}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-1">{r.objet}</p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0 ml-4">{r.date}</p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                {[
                  { icon: Building2, label: r.client   },
                  { icon: User,      label: r.contact  },
                  { icon: FileText,  label: r.type     },
                  { icon: Clock,     label: r.temps    },
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

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <MessageSquare className="w-3 h-3" />{r.messages} messages
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                    Voir détails
                  </button>
                  {r.statut === 'assignee' && (
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                      <Play className="w-3 h-3" /> Démarrer
                    </button>
                  )}
                  {r.statut === 'en_cours' && (
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                      <CheckCircle className="w-3 h-3" /> Terminer
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
