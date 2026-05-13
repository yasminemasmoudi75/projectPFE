import { useState } from 'react';
import { Search, AlertTriangle, Package, Boxes, TrendingDown, Plus } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockStocks = [
  { ref: 'PRD-001', nom: 'Serveur HP ProLiant DL380',  categorie: 'Serveurs',      stock: 2,  seuil: 5,  prix: 12500, statut: 'critique' },
  { ref: 'PRD-002', nom: 'Switch Cisco 24 ports',       categorie: 'Réseau',        stock: 4,  seuil: 10, prix: 850,   statut: 'faible'   },
  { ref: 'PRD-003', nom: 'Licence Microsoft 365',       categorie: 'Logiciels',     stock: 8,  seuil: 20, prix: 120,   statut: 'faible'   },
  { ref: 'PRD-004', nom: 'PC Dell OptiPlex 7090',       categorie: 'PC',            stock: 15, seuil: 10, prix: 1200,  statut: 'normal'   },
  { ref: 'PRD-005', nom: 'Imprimante HP LaserJet',      categorie: 'Périphériques', stock: 25, seuil: 15, prix: 450,   statut: 'normal'   },
  { ref: 'PRD-006', nom: 'Câble Cat6 (Rouleau 100m)',   categorie: 'Accessoires',   stock: 1,  seuil: 5,  prix: 180,   statut: 'critique' },
  { ref: 'PRD-007', nom: 'Disque SSD Samsung 1TB',      categorie: 'Stockage',      stock: 12, seuil: 15, prix: 95,    statut: 'normal'   },
  { ref: 'PRD-008', nom: 'Écran Dell 27" 4K',           categorie: 'Périphériques', stock: 6,  seuil: 8,  prix: 550,   statut: 'faible'   },
];

export function GestionStocks() {
  const [search, setSearch] = useState('');
  const [filterStatut, setStatut] = useState('all');

  const filtered = mockStocks.filter(s =>
    (s.nom.toLowerCase().includes(search.toLowerCase()) || s.ref.toLowerCase().includes(search.toLowerCase())) &&
    (filterStatut === 'all' || s.statut === filterStatut)
  );

  const valeurTotale = mockStocks.reduce((acc, s) => acc + s.stock * s.prix, 0);

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Boxes className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gestion des Stocks</h1>
              <p className="text-sm text-slate-500">Suivi des niveaux et alertes de réapprovisionnement</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Entrée stock
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Alertes critiques', value: mockStocks.filter(s => s.statut === 'critique').length, sub: 'stock épuisé bientôt',  icon: AlertTriangle },
          { label: 'Stocks faibles',    value: mockStocks.filter(s => s.statut === 'faible').length,   sub: 'sous le seuil minimum', icon: TrendingDown  },
          { label: 'Valeur en stock',   value: `${valeurTotale.toLocaleString('fr-FR')} €`,             sub: 'valeur totale',          icon: Package       },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher un produit…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="relative">
            <select value={filterStatut} onChange={e => setStatut(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none bg-white cursor-pointer">
              <option value="all">Tous</option>
              <option value="critique">Critique</option>
              <option value="faible">Faible</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Référence', 'Produit', 'Catégorie', 'Stock', 'Seuil', 'Valeur', 'Statut'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(item => (
              <tr key={item.ref} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{item.ref}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{item.nom}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{item.categorie}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-sm font-bold',
                    item.statut === 'critique' ? 'text-red-600' :
                    item.statut === 'faible'   ? 'text-amber-600' : 'text-slate-800')}>
                    {item.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-400 text-sm">{item.seuil}</td>
                <td className="px-4 py-3 text-slate-700 text-sm font-medium">{(item.stock * item.prix).toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                    item.statut === 'critique' ? 'bg-red-50 text-red-700' :
                    item.statut === 'faible'   ? 'bg-amber-50 text-amber-700' :
                                                 'bg-emerald-50 text-emerald-700')}>
                    {item.statut === 'critique' ? 'Critique' : item.statut === 'faible' ? 'Faible' : 'Normal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
