import { useState } from 'react';
import { Search, Plus, Edit2, Trash2, Shield, Users, CheckCircle, Mail, Phone, ChevronDown } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockUsers = [
  { id: 'U001', nom: 'Ahmed Benali',    role: 'Administrateur', email: 'ahmed@nexuscrm.com',   tel: '+212-600-111111', statut: 'Actif'   },
  { id: 'U002', nom: 'Fatima Zahra',    role: 'Commercial',     email: 'fatima@nexuscrm.com',   tel: '+212-600-222222', statut: 'Actif'   },
  { id: 'U003', nom: 'Mohamed Tech',    role: 'Technicien',     email: 'mohamed@nexuscrm.com',  tel: '+212-600-333333', statut: 'Actif'   },
  { id: 'U004', nom: 'Sarah Agent',     role: 'Agent',          email: 'sarah@nexuscrm.com',    tel: '+212-600-444444', statut: 'Actif'   },
  { id: 'U005', nom: 'Karim Sales',     role: 'Commercial',     email: 'karim@nexuscrm.com',    tel: '+212-600-555555', statut: 'Inactif' },
  { id: 'U006', nom: 'Youssef Support', role: 'Agent',          email: 'youssef@nexuscrm.com',  tel: '+212-600-666666', statut: 'Actif'   },
  { id: 'U007', nom: 'Nadia Manager',   role: 'Administrateur', email: 'nadia@nexuscrm.com',    tel: '+212-600-777777', statut: 'Actif'   },
];

const roleStyle: Record<string, string> = {
  Administrateur: 'bg-slate-100 text-slate-700',
  Commercial:     'bg-slate-100 text-slate-700',
  Technicien:     'bg-slate-100 text-slate-700',
  Agent:          'bg-slate-100 text-slate-700',
};

export function GestionUtilisateurs() {
  const [search, setSearch]       = useState('');
  const [filterRole, setRole]     = useState('all');
  const [filterStatut, setStatut] = useState('all');

  const filtered = mockUsers.filter(u => {
    const q = search.toLowerCase();
    const matchSearch  = !q || u.nom.toLowerCase().includes(q) || u.id.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole    = filterRole === 'all'   || u.role   === filterRole;
    const matchStatut  = filterStatut === 'all' || u.statut === filterStatut;
    return matchSearch && matchRole && matchStatut;
  });

  const stats = {
    total:  mockUsers.length,
    actifs: mockUsers.filter(u => u.statut === 'Actif').length,
    admins: mockUsers.filter(u => u.role === 'Administrateur').length,
  };

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Utilisateurs</h1>
              <p className="text-sm text-slate-500">Gérez les comptes et les rôles</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',          value: stats.total,  icon: Users,        sub: 'enregistrés' },
          { label: 'Actifs',         value: stats.actifs, icon: CheckCircle,  sub: 'comptes actifs' },
          { label: 'Administrateurs',value: stats.admins, icon: Shield,       sub: 'accès complet' },
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
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-slate-100">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, code, email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select value={filterRole} onChange={e => setRole(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer">
                <option value="all">Tous les rôles</option>
                <option value="Administrateur">Administrateur</option>
                <option value="Commercial">Commercial</option>
                <option value="Agent">Agent</option>
                <option value="Technicien">Technicien</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={filterStatut} onChange={e => setStatut(e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:border-blue-500 bg-white cursor-pointer">
                <option value="all">Tous les statuts</option>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {['Code', 'Nom', 'Rôle', 'Email', 'Téléphone', 'Statut', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{user.id}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold flex-shrink-0">
                      {user.nom.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <span className="font-medium text-slate-800">{user.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-md', roleStyle[user.role] || 'bg-slate-100 text-slate-600')}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-slate-300" />{user.email}</div>
                </td>
                <td className="px-4 py-3 text-slate-500 text-xs">
                  <div className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-slate-300" />{user.tel}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
                    user.statut === 'Actif' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                    {user.statut}
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
