import { useState } from 'react';
import { Phone, Mail, MapPin, FileText, Download, Search, Plus } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockActivites = [
  { id: 1, client: 'Tech Solutions SARL', type: 'phone', objet: "Demande d'information sur nouveau produit", date: '19/01/2026', heure: '10:30', statut: 'completed', note: 'Client intéressé par la gamme premium' },
  { id: 2, client: 'Digital Services',    type: 'email', objet: 'Suivi commande #12345',                   date: '19/01/2026', heure: '09:15', statut: 'pending',   note: 'En attente de réponse du service logistique' },
  { id: 3, client: 'Innovation Corp',     type: 'visit', objet: 'Visite technique planifiée',              date: '18/01/2026', heure: '14:00', statut: 'completed', note: 'Visite réalisée avec succès' },
  { id: 4, client: 'Web Agency Pro',      type: 'note',  objet: 'Rappel pour renouvellement contrat',      date: '18/01/2026', heure: '11:00', statut: 'completed', note: "Contrat arrive à échéance le 31/01" },
  { id: 5, client: 'Cloud Masters',       type: 'phone', objet: 'Problème de facturation',                 date: '17/01/2026', heure: '16:45', statut: 'completed', note: 'Problème résolu, remboursement effectué' },
];

const typeConfig: Record<string, { icon: typeof Phone; label: string; badge: string; dot: string }> = {
  phone: { icon: Phone,    label: 'Appel',  badge: 'bg-blue-50   text-blue-700',  dot: 'border-blue-400'   },
  email: { icon: Mail,     label: 'Email',  badge: 'bg-slate-100 text-slate-700', dot: 'border-slate-400'  },
  visit: { icon: MapPin,   label: 'Visite', badge: 'bg-emerald-50 text-emerald-700', dot: 'border-emerald-400' },
  note:  { icon: FileText, label: 'Note',   badge: 'bg-amber-50  text-amber-700', dot: 'border-amber-400'  },
};

const statutStyle: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  pending:   'bg-amber-50   text-amber-700',
};
const statutLabel: Record<string, string> = { completed: 'Terminé', pending: 'En attente' };

export function ActivitesClients() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = mockActivites
    .filter(a => filterType === 'all' || a.type === filterType)
    .filter(a => !search || a.client.toLowerCase().includes(search.toLowerCase()) || a.objet.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Activités Clients</h1>
              <p className="text-sm text-slate-500">Consultez toutes les activités et interactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Exporter
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Nouvelle activité
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client ou objet..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <div className="flex gap-1">
            {[['all', 'Tous'], ['phone', 'Appels'], ['email', 'Emails'], ['visit', 'Visites'], ['note', 'Notes']].map(([v, l]) => (
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

      {/* Activities */}
      <div className="space-y-3">
        {filtered.map((a) => {
          const conf = typeConfig[a.type];
          const Icon = conf.icon;
          return (
            <div key={a.id} className={cn('bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4', conf.dot)}>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{a.client}</p>
                      <p className="text-sm text-slate-600 mt-0.5">{a.objet}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-medium text-slate-600">{a.date}</p>
                      <p className="text-xs text-slate-400">{a.heure}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', conf.badge)}>{conf.label}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[a.statut])}>{statutLabel[a.statut]}</span>
                  </div>
                  {a.note && (
                    <div className="mt-2 p-2.5 bg-slate-50 rounded-lg">
                      <p className="text-xs text-slate-600"><span className="font-medium">Note :</span> {a.note}</p>
                    </div>
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
