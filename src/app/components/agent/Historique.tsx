import { useState } from 'react';
import { Search, Eye, Download, Clock } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockHistorique = [
  { id: 1, date: '19/01/2026 10:30', type: 'Activité',    action: 'Appel téléphonique',       client: 'Tech Solutions SARL', projet: 'Migration Cloud',          utilisateur: 'Sophie Martin', statut: 'Terminé'  },
  { id: 2, date: '19/01/2026 09:15', type: 'Réclamation', action: 'Création réclamation',     client: 'Digital Services',    projet: 'Plateforme E-commerce',    utilisateur: 'Sophie Martin', statut: 'Ouvert'   },
  { id: 3, date: '18/01/2026 16:45', type: 'Activité',    action: 'Email envoyé',             client: 'Innovation Corp',     projet: 'App Mobile',               utilisateur: 'Sophie Martin', statut: 'Terminé'  },
  { id: 4, date: '18/01/2026 14:00', type: 'Visite',      action: 'Visite client',            client: 'Web Agency Pro',      projet: 'Site vitrine',             utilisateur: 'Sophie Martin', statut: 'Terminé'  },
  { id: 5, date: '17/01/2026 11:20', type: 'Réclamation', action: 'Mise à jour réclamation',  client: 'Cloud Masters',       projet: 'Infrastructure IT',        utilisateur: 'Jean Dupont',   statut: 'En cours' },
  { id: 6, date: '17/01/2026 10:00', type: 'Activité',    action: 'Note ajoutée',             client: 'Tech Solutions SARL', projet: 'Migration Cloud',          utilisateur: 'Sophie Martin', statut: 'Terminé'  },
  { id: 7, date: '16/01/2026 15:30', type: 'Réclamation', action: 'Résolution réclamation',   client: 'Innovation Corp',     projet: 'App Mobile',               utilisateur: 'Marie Laurent', statut: 'Résolu'   },
  { id: 8, date: '16/01/2026 09:45', type: 'Activité',    action: 'Appel téléphonique',       client: 'Digital Services',    projet: 'Plateforme E-commerce',    utilisateur: 'Sophie Martin', statut: 'Terminé'  },
];

const typeStyle: Record<string, string> = {
  Activité:    'bg-blue-50   text-blue-700',
  Réclamation: 'bg-amber-50  text-amber-700',
  Visite:      'bg-emerald-50 text-emerald-700',
};
const statutStyle: Record<string, string> = {
  Terminé:  'bg-emerald-50 text-emerald-700',
  Ouvert:   'bg-amber-50   text-amber-700',
  'En cours': 'bg-blue-50  text-blue-700',
  Résolu:   'bg-emerald-50 text-emerald-700',
};

export function Historique() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = mockHistorique
    .filter(h => filterType === 'all' || h.type === filterType)
    .filter(h => !search || h.client.toLowerCase().includes(search.toLowerCase()) || h.projet.toLowerCase().includes(search.toLowerCase()) || h.action.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Historique des activités</h1>
              <p className="text-sm text-slate-500">Journal complet des actions et interactions</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client, projet ou action..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="flex gap-1">
            {[['all', 'Tous'], ['Activité', 'Activités'], ['Réclamation', 'Réclamations'], ['Visite', 'Visites']].map(([v, l]) => (
              <button key={v}
                onClick={() => setFilterType(v)}
                className={cn('px-3 py-2 text-xs font-medium rounded-lg transition-colors',
                  filterType === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Clock className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Journal d'activités</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Date & Heure', 'Type', 'Action', 'Client', 'Projet', 'Utilisateur', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(h => (
              <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{h.date}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeStyle[h.type] || 'bg-slate-100 text-slate-600')}>{h.type}</span>
                </td>
                <td className="px-4 py-3 text-slate-700">{h.action}</td>
                <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{h.client}</td>
                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{h.projet}</td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{h.utilisateur}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[h.statut] || 'bg-slate-100 text-slate-600')}>{h.statut}</span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                    <Eye className="w-3.5 h-3.5" />
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
