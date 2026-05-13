import { useState } from 'react';
import { Search, Activity, Phone, Mail, MapPin, FileText, ChevronDown } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockActivites = [
  { id: 'ACT-001', type: 'Appel',  utilisateur: 'Fatima Zahra',  client: 'Tech Solutions',  sujet: 'Suivi projet migration',     date: '19/01/2026 14:30', duree: '25 min', statut: 'Terminé' },
  { id: 'ACT-002', type: 'Email',  utilisateur: 'Karim Sales',   client: 'Digital Agency',  sujet: 'Proposition commerciale',    date: '19/01/2026 10:15', duree: '—',      statut: 'Envoyé'  },
  { id: 'ACT-003', type: 'Visite', utilisateur: 'Fatima Zahra',  client: 'Innovation Corp', sujet: 'Démonstration produit',      date: '18/01/2026 15:00', duree: '2 h',    statut: 'Terminé' },
  { id: 'ACT-004', type: 'Appel',  utilisateur: 'Sarah Agent',   client: 'Web Solutions',   sujet: 'Réclamation technique',      date: '18/01/2026 11:20', duree: '15 min', statut: 'Terminé' },
  { id: 'ACT-005', type: 'Email',  utilisateur: 'Karim Sales',   client: 'Cloud Masters',   sujet: 'Relance devis',              date: '18/01/2026 09:00', duree: '—',      statut: 'Envoyé'  },
  { id: 'ACT-006', type: 'Visite', utilisateur: 'Mohamed Tech',  client: 'Business Corp',   sujet: 'Installation matériel',      date: '17/01/2026 14:00', duree: '3 h',    statut: 'Terminé' },
  { id: 'ACT-007', type: 'Note',   utilisateur: 'Sarah Agent',   client: 'Smart Agency',    sujet: 'Compte-rendu réunion',       date: '17/01/2026 16:30', duree: '—',      statut: 'Archivé' },
];

const typeIcon: Record<string, typeof Phone> = { Appel: Phone, Email: Mail, Visite: MapPin, Note: FileText };
const typeStyle: Record<string, string> = {
  Appel:  'bg-blue-50  text-blue-700',
  Email:  'bg-slate-100 text-slate-700',
  Visite: 'bg-emerald-50 text-emerald-700',
  Note:   'bg-amber-50 text-amber-700',
};
const statutStyle: Record<string, string> = {
  Terminé: 'bg-emerald-50 text-emerald-700',
  Envoyé:  'bg-blue-50   text-blue-700',
  Archivé: 'bg-slate-100 text-slate-500',
};

export function GestionActivites() {
  const [search, setSearch]     = useState('');
  const [filterType, setType]   = useState('all');

  const filtered = mockActivites.filter(a => {
    const q = search.toLowerCase();
    return (!q || a.sujet.toLowerCase().includes(q) || a.client.toLowerCase().includes(q) || a.utilisateur.toLowerCase().includes(q)) &&
           (filterType === 'all' || a.type === filterType);
  });

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Activités CRM</h1>
            <p className="text-sm text-slate-500">Historique de toutes les interactions clients</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Appels',  value: mockActivites.filter(a => a.type === 'Appel').length,  icon: Phone    },
          { label: 'Emails',  value: mockActivites.filter(a => a.type === 'Email').length,  icon: Mail     },
          { label: 'Visites', value: mockActivites.filter(a => a.type === 'Visite').length, icon: MapPin   },
          { label: 'Notes',   value: mockActivites.filter(a => a.type === 'Note').length,   icon: FileText },
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

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher par sujet, client, utilisateur…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="relative">
            <select value={filterType} onChange={e => setType(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none bg-white cursor-pointer">
              <option value="all">Tous les types</option>
              <option value="Appel">Appel</option>
              <option value="Email">Email</option>
              <option value="Visite">Visite</option>
              <option value="Note">Note</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['ID', 'Type', 'Utilisateur', 'Client', 'Sujet', 'Durée', 'Date', 'Statut'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => {
              const Icon = typeIcon[a.type] || FileText;
              return (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{a.id}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md', typeStyle[a.type])}>
                      <Icon className="w-3 h-3" />{a.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.utilisateur}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{a.client}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{a.sujet}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{a.duree}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{a.date}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[a.statut] || 'bg-slate-100 text-slate-500')}>{a.statut}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
