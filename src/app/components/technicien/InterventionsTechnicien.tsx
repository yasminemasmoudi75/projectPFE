import { useState } from 'react';
import { Search, Wrench, Calendar, MapPin, Clock, CheckCircle, Plus, Eye } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockInterventions = [
  { id: 'INT-001', reclamation: 'REC-234', client: 'Tech Solutions SARL', adresse: '123 Rue Mohamed V, Casablanca',    type: 'Réparation',      date: '19/01/2026', heure: '09:00', duree: '2h',      statut: 'planifiee', materiel: 'Serveur HP ProLiant',      description: 'Réparation serveur principal'             },
  { id: 'INT-002', reclamation: 'REC-235', client: 'Digital Services',    adresse: '45 Avenue des FAR, Rabat',        type: 'Configuration',   date: '19/01/2026', heure: '14:00', duree: '4h',      statut: 'en_cours',  materiel: 'Réseau Cisco',              description: 'Configuration du réseau interne'          },
  { id: 'INT-003', reclamation: 'REC-237', client: 'Web Agency Pro',      adresse: '78 Bd Zerktouni, Tanger',         type: 'Installation',    date: '20/01/2026', heure: '10:00', duree: '6h',      statut: 'planifiee', materiel: '5 PC Dell OptiPlex',        description: 'Installation et configuration nouveaux PC' },
  { id: 'INT-004', reclamation: 'REC-238', client: 'Cloud Masters',       adresse: '234 Rue Ibn Tachfine, Casablanca', type: 'Maintenance',     date: '17/01/2026', heure: '14:00', duree: '3h',      statut: 'terminee',  materiel: 'Serveur Cloud',             description: 'Maintenance préventive système'           },
  { id: 'INT-005', reclamation: 'REC-236', client: 'Innovation Corp',     adresse: '12 Avenue Hassan II, Marrakech',  type: 'Support logiciel', date: '21/01/2026', heure: '09:30', duree: '1h 30min', statut: 'planifiee', materiel: 'Application de gestion',    description: 'Correction erreur logicielle'             },
];

const typeStyle: Record<string, string> = {
  'Réparation':      'bg-red-50    text-red-700',
  'Configuration':   'bg-blue-50   text-blue-700',
  'Installation':    'bg-slate-100 text-slate-600',
  'Maintenance':     'bg-emerald-50 text-emerald-700',
  'Support logiciel': 'bg-amber-50  text-amber-700',
};
const statutConfig: Record<string, { label: string; badge: string }> = {
  planifiee: { label: 'Planifiée', badge: 'bg-blue-50   text-blue-700'    },
  en_cours:  { label: 'En cours',  badge: 'bg-amber-50  text-amber-700'   },
  terminee:  { label: 'Terminée',  badge: 'bg-emerald-50 text-emerald-700' },
};

export function InterventionsTechnicien() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatut, setFilterStatut] = useState('all');

  const filtered = mockInterventions.filter(iv =>
    (filterType === 'all' || iv.type === filterType) &&
    (filterStatut === 'all' || iv.statut === filterStatut) &&
    (!search || iv.client.toLowerCase().includes(search.toLowerCase()) || iv.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mes Interventions</h1>
              <p className="text-sm text-slate-500">Gérez vos interventions planifiées et en cours</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle intervention
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
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
            <option value="all">Tous les types</option>
            {['Réparation','Configuration','Installation','Maintenance','Support logiciel'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filterStatut}
            onChange={e => setFilterStatut(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
            <option value="all">Tous les statuts</option>
            <option value="planifiee">Planifiées</option>
            <option value="en_cours">En cours</option>
            <option value="terminee">Terminées</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(iv => {
          const statConf = statutConfig[iv.statut];
          return (
            <div key={iv.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 flex-shrink-0">
                  <Wrench className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-mono font-bold text-blue-600">{iv.id}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeStyle[iv.type] || 'bg-slate-100 text-slate-600')}>{iv.type}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statConf.badge)}>{statConf.label}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 mb-0.5">{iv.client}</p>
                  <p className="text-xs text-slate-500 mb-3">{iv.description}</p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
                    {[
                      { icon: Calendar, label: iv.date  },
                      { icon: Clock,    label: iv.heure },
                      { icon: Clock,    label: iv.duree },
                      { icon: MapPin,   label: iv.adresse.split(',')[1]?.trim() || iv.adresse },
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

                  <div className="flex items-center gap-4 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-3">
                    <span>Matériel : <span className="font-medium text-slate-700">{iv.materiel}</span></span>
                    <span className="text-slate-300">·</span>
                    <span>Réclamation : <span className="font-mono font-medium text-blue-600">{iv.reclamation}</span></span>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                      <Eye className="w-3 h-3" /> Détails
                    </button>
                    {iv.statut === 'planifiee' && (
                      <button className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        Démarrer
                      </button>
                    )}
                    {iv.statut === 'en_cours' && (
                      <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors">
                        <CheckCircle className="w-3 h-3" /> Terminer
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
