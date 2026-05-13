import { useState } from 'react';
import { Building2, Phone, Mail, MapPin, Eye, Search, Briefcase } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockSocietes = [
  { id: 1, nom: 'Tech Solutions SARL', secteur: 'Informatique',      contact: 'Ahmed Benali',     email: 'contact@techsolutions.ma', telephone: '+212 5 22 XX XX XX', ville: 'Casablanca', projetsActifs: 3, statut: 'Actif'   },
  { id: 2, nom: 'Digital Services',    secteur: 'Marketing Digital',  contact: 'Fatima Zahra',     email: 'info@digitalservices.ma',  telephone: '+212 5 22 XX XX XX', ville: 'Rabat',      projetsActifs: 1, statut: 'Actif'   },
  { id: 3, nom: 'Innovation Corp',     secteur: 'Technologie',        contact: 'Youssef Alami',    email: 'contact@innovation.ma',    telephone: '+212 5 22 XX XX XX', ville: 'Marrakech',  projetsActifs: 2, statut: 'Actif'   },
  { id: 4, nom: 'Web Agency Pro',      secteur: 'Développement Web',  contact: 'Sarah Mokhtar',    email: 'hello@webagency.ma',       telephone: '+212 5 22 XX XX XX', ville: 'Tanger',     projetsActifs: 0, statut: 'Inactif' },
  { id: 5, nom: 'Cloud Masters',       secteur: 'Cloud Computing',    contact: 'Karim Benjelloun', email: 'support@cloudmasters.ma',  telephone: '+212 5 22 XX XX XX', ville: 'Casablanca', projetsActifs: 4, statut: 'Actif'   },
];

export function Societes() {
  const [search, setSearch] = useState('');

  const filtered = mockSocietes.filter(s =>
    !search ||
    s.nom.toLowerCase().includes(search.toLowerCase()) ||
    s.secteur.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sociétés clientes</h1>
            <p className="text-sm text-slate-500">Consultez les informations des sociétés et leurs projets</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher une société..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
          />
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(s => (
          <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-50">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{s.nom}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.secteur}</p>
                </div>
              </div>
              <span className={cn('text-xs font-medium px-2.5 py-1 rounded-full',
                s.statut === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                {s.statut}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{s.telephone}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">{s.email}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span>{s.ville}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-500">
                  Contact : <span className="font-medium text-slate-700">{s.contact}</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                  <Briefcase className="w-3 h-3" />{s.projetsActifs}
                </div>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                <Eye className="w-3.5 h-3.5" /> Détails
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
