import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Building2, MapPin, Mail, Phone, ChevronDown } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockSocietes = [
  { code: 'SOC001', nom: 'Tech Solutions SARL',  email: 'contact@techsolutions.ma', tel: '+212-522-111111', ville: 'Casablanca', secteur: 'IT',        statut: 'Actif'   },
  { code: 'SOC002', nom: 'Digital Agency',        email: 'info@digitalagency.ma',    tel: '+212-537-222222', ville: 'Rabat',       secteur: 'Marketing', statut: 'Actif'   },
  { code: 'SOC003', nom: 'Innovation Corp',       email: 'hello@innovation.ma',      tel: '+212-539-333333', ville: 'Tanger',      secteur: 'Industrie', statut: 'Actif'   },
  { code: 'SOC004', nom: 'Web Solutions Pro',     email: 'contact@websolutions.ma',  tel: '+212-524-444444', ville: 'Marrakech',   secteur: 'IT',        statut: 'Actif'   },
  { code: 'SOC005', nom: 'Cloud Masters',         email: 'info@cloudmasters.ma',     tel: '+212-522-555555', ville: 'Casablanca',  secteur: 'Cloud',     statut: 'Inactif' },
];

export function GestionSocietes() {
  const [search, setSearch] = useState('');
  const [filterSecteur, setSecteur] = useState('all');

  const filtered = mockSocietes.filter(s => {
    const q = search.toLowerCase();
    return (!q || s.nom.toLowerCase().includes(q) || s.code.toLowerCase().includes(q)) &&
           (filterSecteur === 'all' || s.secteur === filterSecteur);
  });

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Sociétés Clientes</h1>
              <p className="text-sm text-slate-500">Gérez votre portefeuille clients</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle société
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total sociétés', value: mockSocietes.length,                                  sub: 'clients enregistrés',  icon: Building2 },
          { label: 'Actives',        value: mockSocietes.filter(s => s.statut === 'Actif').length, sub: 'comptes actifs',        icon: Building2 },
          { label: 'Villes',         value: new Set(mockSocietes.map(s => s.ville)).size,         sub: 'présence nationale',    icon: MapPin    },
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Rechercher une société…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" />
          </div>
          <div className="relative">
            <select value={filterSecteur} onChange={e => setSecteur(e.target.value)}
              className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer">
              <option value="all">Tous les secteurs</option>
              <option value="IT">IT</option>
              <option value="Marketing">Marketing</option>
              <option value="Industrie">Industrie</option>
              <option value="Cloud">Cloud</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Code', 'Société', 'Secteur', 'Contact', 'Ville', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(s => (
              <tr key={s.code} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{s.code}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">{s.nom[0]}</div>
                    <span className="font-medium text-slate-800">{s.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{s.secteur}</span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5 mb-0.5"><Mail className="w-3 h-3 text-slate-300" />{s.email}</div>
                  <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-300" />{s.tel}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-300" />{s.ville}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                    s.statut === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                    {s.statut}
                  </span>
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
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          {filtered.length} résultat{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

    </div>
  );
}
