import { useState } from 'react';
import { ShieldCheck, Users, Check, X, Edit2, Plus, Save } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

/* ── Data ─────────────────────────────────────────── */
const roles = [
  { id: 'admin',      label: 'Administrateur', color: 'bg-blue-600',    count: 2  },
  { id: 'agent',      label: 'Agent',          color: 'bg-sky-500',     count: 8  },
  { id: 'commercial', label: 'Commercial',     color: 'bg-violet-500',  count: 5  },
  { id: 'technicien', label: 'Technicien',     color: 'bg-amber-500',   count: 12 },
  { id: 'client',     label: 'Client',         color: 'bg-slate-500',   count: 34 },
];

const permissionGroups = [
  {
    group: 'Utilisateurs',
    perms: [
      { id: 'users_view',   label: 'Voir les utilisateurs'       },
      { id: 'users_create', label: 'Créer un utilisateur'        },
      { id: 'users_edit',   label: 'Modifier un utilisateur'     },
      { id: 'users_delete', label: 'Supprimer un utilisateur'    },
    ],
  },
  {
    group: 'Sociétés & Clients',
    perms: [
      { id: 'soc_view',   label: 'Voir les sociétés'           },
      { id: 'soc_create', label: 'Créer une société'           },
      { id: 'soc_edit',   label: 'Modifier une société'        },
      { id: 'soc_delete', label: 'Supprimer une société'       },
    ],
  },
  {
    group: 'Réclamations & SAV',
    perms: [
      { id: 'rec_view',   label: 'Voir les réclamations'       },
      { id: 'rec_create', label: 'Créer une réclamation'       },
      { id: 'rec_assign', label: 'Assigner une réclamation'    },
      { id: 'rec_close',  label: 'Clôturer une réclamation'    },
    ],
  },
  {
    group: 'Devis & Commandes',
    perms: [
      { id: 'devis_view',   label: 'Voir les devis'            },
      { id: 'devis_create', label: 'Créer un devis'            },
      { id: 'devis_valid',  label: 'Valider un devis'          },
    ],
  },
  {
    group: 'Rapports & Stats',
    perms: [
      { id: 'stats_view',   label: 'Voir les statistiques'     },
      { id: 'export',       label: 'Exporter les données'      },
      { id: 'journal',      label: 'Voir le journal connexions' },
    ],
  },
];

// Initial permission matrix: which roles have which permissions
const initMatrix: Record<string, Record<string, boolean>> = {
  users_view:   { admin: true,  agent: true,  commercial: false, technicien: false, client: false },
  users_create: { admin: true,  agent: false, commercial: false, technicien: false, client: false },
  users_edit:   { admin: true,  agent: false, commercial: false, technicien: false, client: false },
  users_delete: { admin: true,  agent: false, commercial: false, technicien: false, client: false },
  soc_view:     { admin: true,  agent: true,  commercial: true,  technicien: true,  client: true  },
  soc_create:   { admin: true,  agent: true,  commercial: true,  technicien: false, client: false },
  soc_edit:     { admin: true,  agent: true,  commercial: true,  technicien: false, client: false },
  soc_delete:   { admin: true,  agent: false, commercial: false, technicien: false, client: false },
  rec_view:     { admin: true,  agent: true,  commercial: true,  technicien: true,  client: true  },
  rec_create:   { admin: true,  agent: true,  commercial: false, technicien: false, client: true  },
  rec_assign:   { admin: true,  agent: true,  commercial: false, technicien: false, client: false },
  rec_close:    { admin: true,  agent: true,  commercial: false, technicien: true,  client: false },
  devis_view:   { admin: true,  agent: false, commercial: true,  technicien: false, client: true  },
  devis_create: { admin: true,  agent: false, commercial: true,  technicien: false, client: false },
  devis_valid:  { admin: true,  agent: false, commercial: false, technicien: false, client: false },
  stats_view:   { admin: true,  agent: true,  commercial: true,  technicien: false, client: false },
  export:       { admin: true,  agent: false, commercial: true,  technicien: false, client: false },
  journal:      { admin: true,  agent: false, commercial: false, technicien: false, client: false },
};

const mockUsers = [
  { id: 1, nom: 'Admin Principal',    email: 'admin@nexuscrm.ma',      role: 'admin'      },
  { id: 2, nom: 'Sarah Agent',        email: 'sarah@nexuscrm.ma',      role: 'agent'      },
  { id: 3, nom: 'Karim Commercial',   email: 'karim@nexuscrm.ma',      role: 'commercial' },
  { id: 4, nom: 'Mohamed Tech',       email: 'motech@nexuscrm.ma',     role: 'technicien' },
  { id: 5, nom: 'Tech Solutions SARL',email: 'client1@nexuscrm.ma',    role: 'client'     },
  { id: 6, nom: 'Youssef Support',    email: 'youssef@nexuscrm.ma',    role: 'technicien' },
  { id: 7, nom: 'Fatima Agent',       email: 'fatima@nexuscrm.ma',     role: 'agent'      },
];

/* ── Component ────────────────────────────────────── */
export function GestionRolesPermissions() {
  const [matrix, setMatrix]       = useState(initMatrix);
  const [editMode, setEditMode]   = useState(false);
  const [users, setUsers]         = useState(mockUsers);
  const [savedBanner, setSavedBanner] = useState(false);
  const [editUserId, setEditUserId]   = useState<number | null>(null);
  const [editRole, setEditRole]       = useState('');

  const togglePerm = (permId: string, roleId: string) => {
    if (!editMode) return;
    setMatrix(prev => ({
      ...prev,
      [permId]: { ...prev[permId], [roleId]: !prev[permId][roleId] },
    }));
  };

  const handleSave = () => {
    setEditMode(false);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const startEditUser = (u: typeof mockUsers[0]) => {
    setEditUserId(u.id);
    setEditRole(u.role);
  };

  const confirmEditUser = (id: number) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: editRole } : u));
    setEditUserId(null);
  };

  const totalPerms = Object.values(matrix).reduce((acc, roleMap) =>
    acc + Object.values(roleMap).filter(Boolean).length, 0);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Gestion des Rôles & Permissions</h1>
              <p className="text-sm text-slate-500">Définissez les accès de chaque rôle dans le système</p>
            </div>
          </div>
          <div className="flex gap-2">
            {editMode ? (
              <>
                <button onClick={() => setEditMode(false)}
                  className="px-4 py-2 text-xs font-medium border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors">
                  Annuler
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                  <Save className="w-3.5 h-3.5" /> Enregistrer
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors">
                <Edit2 className="w-3.5 h-3.5" /> Modifier les permissions
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save banner */}
      {savedBanner && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm font-medium text-emerald-700 flex items-center gap-2">
          <Check className="w-4 h-4" /> Permissions enregistrées avec succès.
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Rôles définis',          value: roles.length.toString(),    icon: ShieldCheck, color: 'text-blue-600'    },
          { label: 'Utilisateurs total',      value: users.length.toString(),    icon: Users,       color: 'text-blue-600'    },
          { label: 'Permissions actives',     value: totalPerms.toString(),      icon: Check,       color: 'text-emerald-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="p-2.5 rounded-xl bg-slate-50 w-fit mb-3"><Icon className={cn('w-5 h-5', s.color)} /></div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {roles.map(r => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-center">
            <div className={cn('h-10 w-10 rounded-xl mx-auto mb-2 flex items-center justify-center', r.color)}>
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <p className="text-xs font-bold text-slate-800">{r.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{r.count} utilisateurs</p>
          </div>
        ))}
      </div>

      {/* Permissions matrix */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="p-2 rounded-lg bg-white border border-slate-200"><ShieldCheck className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Matrice des permissions</h2>
          {editMode && (
            <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
              Mode édition actif — cliquez sur les cases pour modifier
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[220px]">
                  Permission
                </th>
                {roles.map(r => (
                  <th key={r.id} className="px-3 py-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <div className={cn('h-6 w-6 rounded-lg flex items-center justify-center', r.color)}>
                        <ShieldCheck className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 whitespace-nowrap">{r.label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionGroups.map(pg => (
                <>
                  <tr key={pg.group} className="bg-slate-50/60">
                    <td colSpan={roles.length + 1} className="px-5 py-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{pg.group}</span>
                    </td>
                  </tr>
                  {pg.perms.map(perm => (
                    <tr key={perm.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-2.5 text-xs text-slate-700 font-medium">{perm.label}</td>
                      {roles.map(r => {
                        const has = matrix[perm.id]?.[r.id] ?? false;
                        return (
                          <td key={r.id} className="px-3 py-2.5 text-center">
                            <button
                              onClick={() => togglePerm(perm.id, r.id)}
                              disabled={!editMode}
                              className={cn(
                                'h-6 w-6 rounded-md flex items-center justify-center mx-auto transition-all',
                                has
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 text-slate-300',
                                editMode && 'hover:scale-110 cursor-pointer',
                                !editMode && 'cursor-default'
                              )}
                            >
                              {has ? <Check className="w-3.5 h-3.5" /> : <X className="w-3 h-3" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User role assignment */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200"><Users className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Attribution des rôles par utilisateur</h2>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <Plus className="w-3.5 h-3.5" /> Ajouter
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Utilisateur', 'Email', 'Rôle actuel', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(u => {
                const roleConf = roles.find(r => r.id === u.role);
                const isEditing = editUserId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-white">
                            {u.nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-slate-800">{u.nom}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-500">{u.email}</td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <select
                          value={editRole}
                          onChange={e => setEditRole(e.target.value)}
                          className="px-2 py-1 text-xs border border-blue-300 rounded-lg focus:outline-none bg-white">
                          {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                        </select>
                      ) : (
                        <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full text-white', roleConf?.color || 'bg-slate-500')}>
                          {roleConf?.label || u.role}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => confirmEditUser(u.id)}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            Confirmer
                          </button>
                          <button onClick={() => setEditUserId(null)}
                            className="px-2.5 py-1 text-[10px] font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                            Annuler
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEditUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                          <Edit2 className="w-3 h-3" /> Modifier le rôle
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
