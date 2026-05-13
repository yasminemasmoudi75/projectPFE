import { useState } from 'react';
import { Search, AlertTriangle, Clock, CheckCircle, Wrench, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockReclamations = [
  { id: 'REC-001', client: 'Tech Solutions SARL', sujet: 'Serveur ne démarre plus',   priorite: 'Critique', statut: 'Ouverte',   technicien: null,              date: '19/01/2026 09:30' },
  { id: 'REC-002', client: 'Digital Agency',       sujet: 'Problème réseau',            priorite: 'Haute',    statut: 'Affectée',  technicien: 'Mohamed Tech',    date: '18/01/2026 14:20' },
  { id: 'REC-003', client: 'Innovation Corp',      sujet: 'Imprimante bloquée',         priorite: 'Moyenne',  statut: 'Affectée',  technicien: 'Youssef Support', date: '18/01/2026 10:15' },
  { id: 'REC-004', client: 'Web Solutions Pro',    sujet: 'Mise à jour logiciel',       priorite: 'Basse',    statut: 'Résolue',   technicien: 'Mohamed Tech',    date: '17/01/2026 08:00' },
  { id: 'REC-005', client: 'Cloud Masters',        sujet: 'Accès VPN impossible',       priorite: 'Haute',    statut: 'Ouverte',   technicien: null,              date: '19/01/2026 11:00' },
];

const prioriteStyle: Record<string, string> = {
  Critique: 'bg-red-50    text-red-700',
  Haute:    'bg-amber-50  text-amber-700',
  Moyenne:  'bg-yellow-50 text-yellow-700',
  Basse:    'bg-slate-100 text-slate-600',
};
const statutStyle: Record<string, string> = {
  'Ouverte':  'bg-red-50    text-red-700',
  'Affectée': 'bg-blue-50   text-blue-700',
  'Résolue':  'bg-emerald-50 text-emerald-700',
};

export function GestionSAV() {
  const [search, setSearch]       = useState('');
  const [filterStatut, setStatut] = useState('all');

  const filtered = mockReclamations.filter(r => {
    const q = search.toLowerCase();
    return (!q || r.sujet.toLowerCase().includes(q) || r.client.toLowerCase().includes(q) || r.id.toLowerCase().includes(q)) &&
           (filterStatut === 'all' || r.statut === filterStatut);
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Wrench className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Service Après-Vente</h1>
            <p className="text-sm text-slate-500">Gérez les réclamations et affectez les techniciens</p>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Ouvertes',  value: mockReclamations.filter(r => r.statut === 'Ouverte').length,   icon: AlertTriangle },
          { label: 'Affectées', value: mockReclamations.filter(r => r.statut === 'Affectée').length,  icon: Clock         },
          { label: 'Résolues',  value: mockReclamations.filter(r => r.statut === 'Résolue').length,   icon: CheckCircle   },
          { label: 'Critiques', value: mockReclamations.filter(r => r.priorite === 'Critique').length, icon: AlertTriangle },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher une réclamation…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="relative">
            <select value={filterStatut} onChange={e => setStatut(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none bg-white cursor-pointer">
              <option value="all">Tous les statuts</option>
              <option value="Ouverte">Ouverte</option>
              <option value="Affectée">Affectée</option>
              <option value="Résolue">Résolue</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['N° REC', 'Client', 'Sujet', 'Priorité', 'Statut', 'Technicien', 'Date', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{r.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{r.client}</td>
                <td className="px-4 py-3 text-slate-600 max-w-[180px] truncate">{r.sujet}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[r.priorite])}>{r.priorite}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[r.statut] || 'bg-slate-100 text-slate-500')}>{r.statut}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {r.technicien ?? <span className="text-red-500 font-medium">Non affecté</span>}
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-3">
                  <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
