import { useState } from 'react';
import { Search, Download, ClipboardList, CheckCircle, XCircle, Clock, Shield, LogIn, LogOut, RefreshCw } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

/* ── Data ─────────────────────────────────────────── */
const mockLogs = [
  { id: 1,  date: '19/01/2026', heure: '09:42:11', utilisateur: 'Admin Principal',    email: 'admin@nexuscrm.ma',      role: 'admin',      ip: '192.168.1.10', action: 'connexion',    statut: 'succes',  duree: '3h 12min', navigateur: 'Chrome 121 / Windows' },
  { id: 2,  date: '19/01/2026', heure: '09:15:03', utilisateur: 'Sarah Agent',        email: 'sarah@nexuscrm.ma',      role: 'agent',      ip: '192.168.1.24', action: 'connexion',    statut: 'succes',  duree: '2h 45min', navigateur: 'Firefox 122 / Windows' },
  { id: 3,  date: '19/01/2026', heure: '08:57:44', utilisateur: 'Inconnu',            email: 'hack@test.com',          role: '-',          ip: '41.248.5.90',  action: 'connexion',    statut: 'echec',   duree: '-',        navigateur: 'Chrome 118 / Linux' },
  { id: 4,  date: '19/01/2026', heure: '08:30:22', utilisateur: 'Karim Commercial',   email: 'karim@nexuscrm.ma',      role: 'commercial', ip: '192.168.1.31', action: 'connexion',    statut: 'succes',  duree: '4h 02min', navigateur: 'Edge 121 / Windows' },
  { id: 5,  date: '19/01/2026', heure: '08:25:50', utilisateur: 'Mohamed Tech',       email: 'motech@nexuscrm.ma',     role: 'technicien', ip: '192.168.1.45', action: 'connexion',    statut: 'succes',  duree: '1h 58min', navigateur: 'Chrome 121 / Android' },
  { id: 6,  date: '19/01/2026', heure: '07:55:10', utilisateur: 'Inconnu',            email: 'admin@nexuscrm.ma',      role: '-',          ip: '41.248.5.90',  action: 'connexion',    statut: 'echec',   duree: '-',        navigateur: 'Unknown' },
  { id: 7,  date: '18/01/2026', heure: '18:22:41', utilisateur: 'Fatima Agent',       email: 'fatima@nexuscrm.ma',     role: 'agent',      ip: '192.168.1.29', action: 'deconnexion',  statut: 'succes',  duree: '6h 40min', navigateur: 'Chrome 121 / MacOS' },
  { id: 8,  date: '18/01/2026', heure: '17:45:09', utilisateur: 'Youssef Support',    email: 'youssef@nexuscrm.ma',    role: 'technicien', ip: '192.168.1.52', action: 'expiration',   statut: 'warning', duree: '8h 00min', navigateur: 'Firefox 122 / Windows' },
  { id: 9,  date: '18/01/2026', heure: '16:30:55', utilisateur: 'Tech Solutions SARL',email: 'client1@nexuscrm.ma',   role: 'client',     ip: '105.71.20.3',  action: 'connexion',    statut: 'succes',  duree: '25min',    navigateur: 'Safari 17 / iOS' },
  { id: 10, date: '18/01/2026', heure: '14:11:30', utilisateur: 'Admin Principal',    email: 'admin@nexuscrm.ma',      role: 'admin',      ip: '192.168.1.10', action: 'deconnexion',  statut: 'succes',  duree: '5h 20min', navigateur: 'Chrome 121 / Windows' },
  { id: 11, date: '18/01/2026', heure: '09:15:00', utilisateur: 'Inconnu',            email: 'root@hack.io',           role: '-',          ip: '82.66.101.4',  action: 'connexion',    statut: 'echec',   duree: '-',        navigateur: 'curl/7.68' },
  { id: 12, date: '17/01/2026', heure: '11:04:18', utilisateur: 'Karim Commercial',   email: 'karim@nexuscrm.ma',      role: 'commercial', ip: '192.168.1.31', action: 'deconnexion',  statut: 'succes',  duree: '3h 15min', navigateur: 'Edge 121 / Windows' },
];

const roleStyle: Record<string, string> = {
  admin:      'bg-blue-50   text-blue-700',
  agent:      'bg-sky-50    text-sky-700',
  commercial: 'bg-violet-50 text-violet-700',
  technicien: 'bg-amber-50  text-amber-700',
  client:     'bg-slate-100 text-slate-600',
  '-':        'bg-red-50    text-red-600',
};

const statutConf: Record<string, { badge: string; icon: typeof CheckCircle; label: string }> = {
  succes:  { badge: 'bg-emerald-50 text-emerald-700', icon: CheckCircle, label: 'Succès'    },
  echec:   { badge: 'bg-red-50     text-red-700',     icon: XCircle,     label: 'Échec'     },
  warning: { badge: 'bg-amber-50   text-amber-700',   icon: Clock,       label: 'Expirée'   },
};

const actionConf: Record<string, { icon: typeof LogIn; label: string; color: string }> = {
  connexion:   { icon: LogIn,       label: 'Connexion',    color: 'text-blue-600'    },
  deconnexion: { icon: LogOut,      label: 'Déconnexion',  color: 'text-slate-500'   },
  expiration:  { icon: RefreshCw,   label: 'Expiration',   color: 'text-amber-600'   },
};

/* ── Component ────────────────────────────────────── */
export function JournalConnexions() {
  const [search, setSearch]           = useState('');
  const [filterStatut, setFilterStatut] = useState('all');
  const [filterRole, setFilterRole]   = useState('all');
  const [filterAction, setFilterAction] = useState('all');

  const filtered = mockLogs.filter(l =>
    (filterStatut === 'all' || l.statut === filterStatut) &&
    (filterRole   === 'all' || l.role   === filterRole)   &&
    (filterAction === 'all' || l.action === filterAction) &&
    (!search || l.utilisateur.toLowerCase().includes(search.toLowerCase()) ||
     l.email.toLowerCase().includes(search.toLowerCase()) ||
     l.ip.includes(search))
  );

  const today       = mockLogs.filter(l => l.date === '19/01/2026').length;
  const echecLogs   = mockLogs.filter(l => l.statut === 'echec');
  const echecs      = echecLogs.length;
  const externalIPs = [...new Set(echecLogs.filter(l => !l.ip.startsWith('192.168.')).map(l => l.ip))];
  const actives     = mockLogs.filter(l => l.action === 'connexion' && l.statut === 'succes' && l.date === '19/01/2026').length;
  const uniqueUsers = new Set(mockLogs.filter(l => l.statut === 'succes').map(l => l.email)).size;

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <ClipboardList className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Journal des Connexions</h1>
              <p className="text-sm text-slate-500">Historique complet des accès et tentatives de connexion</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Exporter CSV
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Connexions aujourd'hui",  value: today.toString(),        icon: LogIn,       color: 'text-blue-600'    },
          { label: 'Sessions actives',         value: actives.toString(),      icon: CheckCircle, color: 'text-emerald-600' },
          { label: 'Tentatives échouées',      value: echecs.toString(),       icon: XCircle,     color: 'text-red-600'     },
          { label: 'Utilisateurs uniques',     value: uniqueUsers.toString(),  icon: Shield,      color: 'text-blue-600'    },
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

      {/* Alert for failed attempts */}
      {echecs > 0 && (
        <div className={cn(
          'border rounded-2xl px-5 py-3 flex items-start gap-3',
          echecs >= 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
        )}>
          <XCircle className={cn('w-4 h-4 flex-shrink-0 mt-0.5', echecs >= 3 ? 'text-red-600' : 'text-amber-600')} />
          <div className="flex-1 min-w-0">
            <p className={cn('text-sm font-semibold', echecs >= 3 ? 'text-red-800' : 'text-amber-800')}>
              {echecs} tentative{echecs > 1 ? 's' : ''} de connexion échouée{echecs > 1 ? 's' : ''} détectée{echecs > 1 ? 's' : ''}
            </p>
            <p className={cn('text-xs mt-0.5', echecs >= 3 ? 'text-red-600' : 'text-amber-600')}>
              {externalIPs.length > 0
                ? `${externalIPs.length} IP${externalIPs.length > 1 ? 's' : ''} externe${externalIPs.length > 1 ? 's' : ''} non reconnue${externalIPs.length > 1 ? 's' : ''} : ${externalIPs.join(', ')}. Vérifiez les entrées marquées "Échec".`
                : 'Vérifiez les entrées marquées "Échec" dans le journal ci-dessous.'
              }
            </p>
          </div>
          <button
            onClick={() => setFilterStatut('echec')}
            className={cn(
              'text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors',
              echecs >= 3
                ? 'bg-red-100 hover:bg-red-200 text-red-700'
                : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
            )}>
            Voir les échecs
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par utilisateur, email ou IP…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
            <option value="all">Toutes les actions</option>
            <option value="connexion">Connexion</option>
            <option value="deconnexion">Déconnexion</option>
            <option value="expiration">Expiration</option>
          </select>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
            <option value="all">Tous les statuts</option>
            <option value="succes">Succès</option>
            <option value="echec">Échec</option>
            <option value="warning">Expirée</option>
          </select>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none bg-white">
            <option value="all">Tous les rôles</option>
            <option value="admin">Admin</option>
            <option value="agent">Agent</option>
            <option value="commercial">Commercial</option>
            <option value="technicien">Technicien</option>
            <option value="client">Client</option>
            <option value="-">Inconnu</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="p-2 rounded-lg bg-white border border-slate-200"><ClipboardList className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Entrées du journal ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Date & Heure', 'Utilisateur', 'Rôle', 'Adresse IP', 'Action', 'Statut', 'Durée session', 'Navigateur'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(l => {
                const statConf   = statutConf[l.statut];
                const actConf    = actionConf[l.action];
                const StatutIcon = statConf.icon;
                const ActionIcon = actConf.icon;
                return (
                  <tr key={l.id} className={cn(
                    'hover:bg-slate-50 transition-colors',
                    l.statut === 'echec' && 'bg-red-50/30'
                  )}>
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-slate-700">{l.date}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{l.heure}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-slate-800 whitespace-nowrap">{l.utilisateur}</p>
                      <p className="text-[10px] text-slate-400">{l.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', roleStyle[l.role])}>
                        {l.role === '-' ? 'Inconnu' : l.role.charAt(0).toUpperCase() + l.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">{l.ip}</td>
                    <td className="px-4 py-3">
                      <span className={cn('flex items-center gap-1 text-xs font-medium', actConf.color)}>
                        <ActionIcon className="w-3.5 h-3.5" />{actConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full', statConf.badge)}>
                        <StatutIcon className="w-3 h-3" />{statConf.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {l.duree}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-400 whitespace-nowrap">{l.navigateur}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            Aucune entrée ne correspond aux filtres sélectionnés.
          </div>
        )}
      </div>

    </div>
  );
}
