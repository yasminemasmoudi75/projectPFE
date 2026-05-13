import { useState } from 'react';
import { Search, Plus, Download, Star, Eye, Users } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockContacts = [
  { id: '1', code: '9448', nom: 'Ismail Mohamed Ali',  societe: 'Ma societe sur al nahda',           email: 'contact@example.com', telephone: '98226940', ville: 'Manouba',   categorie: 'Privé',    type: 'Consultant',  domaine: 'Agroalimentaire', dateCreation: '01/01/2026', dateDernier: '19/01/2026', favoris: true  },
  { id: '2', code: '9449', nom: 'Ahmed Khalil',         societe: 'La societe rrt a sal nahda',        email: 'contact@example.com', telephone: '29435964', ville: 'Tunis',     categorie: 'Privé',    type: 'Privé',       domaine: 'Enseignement',    dateCreation: '01/01/2026', dateDernier: '19/01/2026', favoris: false },
  { id: '3', code: '9448', nom: 'Megdich Fatma',        societe: 'Hôpital Militaire Université Sfax', email: 'contact@example.com', telephone: '',         ville: '',          categorie: 'Étatique', type: 'Médecin',     domaine: 'Matériaux',       dateCreation: '22/12/2025', dateDernier: '23/12/2025', favoris: false },
  { id: '4', code: '9447', nom: 'Lassouied Souad',      societe: 'Societe El Mthisasa',               email: 'contact@example.com', telephone: '',         ville: 'Bar-Anou',  categorie: 'Privé',    type: 'Autre',       domaine: 'Matériaux',       dateCreation: '',           dateDernier: '',           favoris: false },
  { id: '5', code: '9448', nom: 'Lamil Maria',          societe: 'Personne physique',                 email: 'contact@example.com', telephone: '98484903', ville: 'Tunis',     categorie: 'Privé',    type: 'Médecin',     domaine: 'Biologie',        dateCreation: '',           dateDernier: '',           favoris: false },
  { id: '6', code: '9448', nom: 'Ben-Feteb-Omar',       societe: 'Mycelium Innovations',              email: 'contact@example.com', telephone: '25654850', ville: 'Tunis',     categorie: 'Privé',    type: 'Production',  domaine: 'Biologie',        dateCreation: '',           dateDernier: '',           favoris: false },
];

const catStyle: Record<string, string> = {
  'Privé':    'bg-slate-100 text-slate-600',
  'Étatique': 'bg-blue-50   text-blue-700',
};

export function ContactsList() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const filtered = mockContacts.filter(c =>
    !search ||
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.societe.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Liste des Contacts</h1>
              <p className="text-sm text-slate-500">Gérez et consultez tous vos contacts clients</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
              <Download className="w-4 h-4" /> Exporter CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Ajouter un contact
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
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
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-semibold text-blue-600">{mockContacts.length}</span> contacts
            {selected.length > 0 && (
              <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{selected.length} sélectionné(s)</span>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300" />
                </th>
                <th className="w-8 px-2 py-3"></th>
                {['Code', 'Nom', 'Société', 'Email', 'Tél', 'Ville', 'Catégorie', 'Type', 'Domaine', 'Créé le', 'Dernier', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c, i) => (
                <tr key={c.id} className={cn('hover:bg-slate-50 transition-colors', i % 2 === 0 ? '' : 'bg-slate-50/40')}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggle(c.id)} className="w-4 h-4 rounded border-slate-300" />
                  </td>
                  <td className="px-2 py-3">
                    {c.favoris && <Star className="w-4 h-4 fill-amber-400 text-amber-400" />}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{c.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{c.nom}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{c.societe}</td>
                  <td className="px-4 py-3 text-blue-600 text-xs">{c.email}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.telephone}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{c.ville}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', catStyle[c.categorie] || 'bg-slate-100 text-slate-600')}>
                      {c.categorie}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{c.type}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.domaine}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.dateCreation}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.dateDernier}</td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors">
                      <Eye className="w-3 h-3" /> Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-1 px-4 py-3 border-t border-slate-100">
          <button className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">◄</button>
          {[1,2,3,4,5].map(p => (
            <button key={p} className={cn('px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              p === 1 ? 'bg-blue-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600')}>
              {p}
            </button>
          ))}
          <button className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">►</button>
        </div>
      </div>

    </div>
  );
}
