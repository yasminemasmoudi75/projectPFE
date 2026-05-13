import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Package, Tag } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockItems = [
  { ref: 'PRD-001', nom: 'Serveur HP ProLiant DL380 Gen10',  categorie: 'Matériel',      type: 'Produit',  prix: 12500, statut: 'Disponible' },
  { ref: 'PRD-002', nom: 'Switch Cisco Catalyst 24 ports',   categorie: 'Matériel',      type: 'Produit',  prix: 850,   statut: 'Disponible' },
  { ref: 'PRD-003', nom: 'PC Dell OptiPlex 7090',            categorie: 'Matériel',      type: 'Produit',  prix: 1200,  statut: 'Disponible' },
  { ref: 'PRD-004', nom: 'Imprimante HP LaserJet Pro',       categorie: 'Matériel',      type: 'Produit',  prix: 450,   statut: 'Disponible' },
  { ref: 'SRV-001', nom: 'Installation & Config Serveur',    categorie: 'Infrastructure',type: 'Service',  prix: 500,   statut: 'Actif'      },
  { ref: 'SRV-002', nom: 'Maintenance Préventive Mensuelle', categorie: 'Maintenance',   type: 'Service',  prix: 300,   statut: 'Actif'      },
  { ref: 'SRV-003', nom: 'Formation Utilisateurs (Par jour)',categorie: 'Formation',     type: 'Service',  prix: 800,   statut: 'Actif'      },
  { ref: 'SRV-004', nom: 'Support Technique 24/7',           categorie: 'Support',       type: 'Service',  prix: 1500,  statut: 'Actif'      },
  { ref: 'SRV-005', nom: 'Audit Sécurité Informatique',      categorie: 'Sécurité',      type: 'Service',  prix: 2000,  statut: 'Actif'      },
];

export function GestionProduits() {
  const [search, setSearch]   = useState('');
  const [typeFilter, setType] = useState('all');

  const filtered = mockItems.filter(p => {
    const q = search.toLowerCase();
    return (!q || p.nom.toLowerCase().includes(q) || p.ref.toLowerCase().includes(q)) &&
           (typeFilter === 'all' || p.type === typeFilter);
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Produits & Services</h1>
              <p className="text-sm text-slate-500">Gérez votre catalogue de produits et prestations</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau produit
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Produits',    value: mockItems.filter(p => p.type === 'Produit').length, sub: 'articles matériels',  icon: Package },
          { label: 'Services',    value: mockItems.filter(p => p.type === 'Service').length, sub: 'prestations actives', icon: Tag     },
          { label: 'Prix moyen',  value: `${Math.round(mockItems.reduce((a, p) => a + p.prix, 0) / mockItems.length).toLocaleString('fr-FR')} €`, sub: 'par article', icon: Package },
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
            <input type="text" placeholder="Rechercher un produit ou service…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {[['all', 'Tous'], ['Produit', 'Produits'], ['Service', 'Services']].map(([val, label]) => (
              <button key={val} onClick={() => setType(val)}
                className={cn('px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                  typeFilter === val ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700')}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Référence', 'Nom', 'Catégorie', 'Type', 'Prix HT', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(p => (
              <tr key={p.ref} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{p.ref}</td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.nom}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{p.categorie}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md',
                    p.type === 'Produit' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600')}>
                    {p.type}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">{p.prix.toLocaleString('fr-FR')} €</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">{p.statut}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
