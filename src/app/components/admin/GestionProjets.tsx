import { useState } from 'react';
import { Search, Plus, Briefcase, Clock, CheckCircle, AlertTriangle, Eye, ChevronDown } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockProjets = [
  { id: 'PRO-001', nom: 'Migration Cloud Azure',         client: 'Tech Solutions SARL', commercial: 'Fatima Zahra', montant: 45000, debut: '10/01/2026', fin: '15/03/2026', avancement: 35,  statut: 'En cours',  priorite: 'Haute'   },
  { id: 'PRO-002', nom: 'Déploiement Infrastructure',    client: 'Digital Agency',       commercial: 'Karim Sales',  montant: 28000, debut: '05/01/2026', fin: '28/02/2026', avancement: 65,  statut: 'En cours',  priorite: 'Moyenne' },
  { id: 'PRO-003', nom: 'Installation ERP SAP',          client: 'Innovation Corp',      commercial: 'Fatima Zahra', montant: 75000, debut: '01/12/2025', fin: '30/04/2026', avancement: 45,  statut: 'En cours',  priorite: 'Haute'   },
  { id: 'PRO-004', nom: 'Refonte Site Web',              client: 'Web Solutions Pro',    commercial: 'Karim Sales',  montant: 12000, debut: '20/01/2026', fin: '20/02/2026', avancement: 10,  statut: 'En retard', priorite: 'Haute'   },
  { id: 'PRO-005', nom: 'Audit Sécurité',                client: 'Cloud Masters',        commercial: 'Fatima Zahra', montant: 8500,  debut: '15/11/2025', fin: '15/01/2026', avancement: 100, statut: 'Terminé',   priorite: 'Basse'   },
];

const statutStyle: Record<string, string> = {
  'En cours':  'bg-blue-50   text-blue-700',
  'En retard': 'bg-red-50    text-red-700',
  'Terminé':   'bg-emerald-50 text-emerald-700',
};
const prioriteStyle: Record<string, string> = {
  Haute:   'bg-red-50    text-red-700',
  Moyenne: 'bg-amber-50  text-amber-700',
  Basse:   'bg-slate-100 text-slate-600',
};

export function GestionProjets() {
  const [search, setSearch]       = useState('');
  const [filterStatut, setStatut] = useState('all');

  const filtered = mockProjets.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.nom.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)) &&
           (filterStatut === 'all' || p.statut === filterStatut);
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Projets</h1>
              <p className="text-sm text-slate-500">Suivez l'avancement de tous vos projets clients</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau projet
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'En cours',  value: mockProjets.filter(p => p.statut === 'En cours').length,  icon: Clock         },
          { label: 'En retard', value: mockProjets.filter(p => p.statut === 'En retard').length, icon: AlertTriangle },
          { label: 'Terminés',  value: mockProjets.filter(p => p.statut === 'Terminé').length,   icon: CheckCircle   },
          { label: 'Total',     value: mockProjets.length,                                        icon: Briefcase     },
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
            <input type="text" placeholder="Rechercher un projet, client…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="relative">
            <select value={filterStatut} onChange={e => setStatut(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none bg-white cursor-pointer">
              <option value="all">Tous les statuts</option>
              <option value="En cours">En cours</option>
              <option value="En retard">En retard</option>
              <option value="Terminé">Terminé</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Code', 'Projet', 'Client', 'Montant', 'Avancement', 'Priorité', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{p.id}</td>
                <td className="px-4 py-3 font-medium text-slate-800 max-w-[160px] truncate">{p.nom}</td>
                <td className="px-4 py-3 text-slate-500">{p.client}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.montant.toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3 min-w-[120px]">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className={cn('h-full rounded-full',
                        p.avancement === 100 ? 'bg-emerald-500' : p.statut === 'En retard' ? 'bg-red-400' : 'bg-blue-500')}
                        style={{ width: `${p.avancement}%` }} />
                    </div>
                    <span className="text-xs text-slate-500 w-8">{p.avancement}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', prioriteStyle[p.priorite])}>{p.priorite}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[p.statut] || 'bg-slate-100 text-slate-500')}>{p.statut}</span>
                </td>
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
