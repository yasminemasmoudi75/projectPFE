import { useState } from 'react';
import { Briefcase, Plus, Eye, Edit2, Search } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockProjets = [
  { id: 'PROJ-001', nom: 'Migration Cloud Solutions', client: 'Tech Solutions SARL', domaine: 'Chimie',                    montant: '125 000 €', statut: 'En cours',  progression: 65, dateDebut: '10/01/2026', dateEcheance: '15/03/2026' },
  { id: 'PROJ-002', nom: 'ERP Implementation',         client: 'Digital Agency',       domaine: 'Automobile',               montant: '89 000 €',  statut: 'En cours',  progression: 40, dateDebut: '15/01/2026', dateEcheance: '01/04/2026' },
  { id: 'PROJ-003', nom: 'Infrastructure réseau',       client: 'Innovation Corp',      domaine: 'Enseignement',             montant: '156 000 €', statut: 'Planifié',  progression: 15, dateDebut: '01/02/2026', dateEcheance: '30/05/2026' },
  { id: 'PROJ-004', nom: 'Audit sécurité IT',           client: 'Cloud Masters',        domaine: 'Biologie',                 montant: '42 000 €',  statut: 'Terminé',   progression: 100, dateDebut: '05/01/2026', dateEcheance: '20/01/2026' },
];

const statutStyle: Record<string, string> = {
  'En cours': 'bg-blue-50   text-blue-700',
  'Planifié': 'bg-slate-100 text-slate-600',
  'Terminé':  'bg-emerald-50 text-emerald-700',
};

export function ProjetsCommercial() {
  const [search, setSearch] = useState('');

  const filtered = mockProjets.filter(p =>
    !search || p.nom.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mes Projets</h1>
              <p className="text-sm text-slate-500">Gérez et suivez vos projets commerciaux</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau projet
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un projet..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><Briefcase className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Liste des projets ({filtered.length})</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Code', 'Nom du projet', 'Client', 'Domaine', 'Montant', 'Statut', 'Progression', 'Échéance', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{p.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.nom}</td>
                <td className="px-4 py-3 text-slate-600">{p.client}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{p.domaine}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{p.montant}</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[p.statut])}>{p.statut}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden w-20">
                      <div className={cn('h-full rounded-full',
                        p.progression === 100 ? 'bg-emerald-500' : p.progression >= 50 ? 'bg-blue-500' : 'bg-amber-400')}
                        style={{ width: `${p.progression}%` }} />
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{p.progression}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{p.dateEcheance}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                      <Eye className="w-3 h-3" /> Voir
                    </button>
                    <button className="flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-blue-600 transition-colors">
                      <Edit2 className="w-3 h-3" /> Modifier
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
