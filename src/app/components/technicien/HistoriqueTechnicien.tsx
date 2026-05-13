import { useState } from 'react';
import { Search, Download, Eye, CheckCircle, Clock, Star, History } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockHistorique = [
  { id: 'INT-004', date: '17/01/2026', heure: '14:00 - 17:00', client: 'Cloud Masters',    type: 'Maintenance',     reclamation: 'REC-238', materiel: 'Serveur Cloud',       duree: '3h',      satisfaction: 5, notes: 'Maintenance préventive réalisée avec succès'          },
  { id: 'INT-003', date: '16/01/2026', heure: '09:00 - 14:00', client: 'Innovation Labs',  type: 'Installation',    reclamation: 'REC-221', materiel: 'Imprimante réseau',   duree: '5h',      satisfaction: 4, notes: 'Installation et configuration réseau réussie'         },
  { id: 'INT-002', date: '15/01/2026', heure: '10:30 - 13:30', client: 'Web Solutions',    type: 'Réparation',      reclamation: 'REC-215', materiel: 'PC portable Dell',   duree: '3h',      satisfaction: 5, notes: 'Remplacement disque dur et restauration système'      },
  { id: 'INT-001', date: '14/01/2026', heure: '15:00 - 17:30', client: 'Digital Agency',   type: 'Configuration',   reclamation: 'REC-208', materiel: 'Réseau WiFi',        duree: '2h 30min', satisfaction: 4, notes: "Configuration point d'accès et optimisation signal"  },
  { id: 'INT-005', date: '13/01/2026', heure: '09:00 - 11:00', client: 'Tech Start',       type: 'Support logiciel', reclamation: 'REC-201', materiel: 'Suite Office',      duree: '2h',      satisfaction: 5, notes: 'Résolution problème activation licence'               },
  { id: 'INT-006', date: '12/01/2026', heure: '14:00 - 18:00', client: 'Mega Corp',        type: 'Installation',    reclamation: 'REC-195', materiel: '3 PC Dell OptiPlex', duree: '4h',      satisfaction: 5, notes: 'Installation et configuration poste de travail'       },
  { id: 'INT-007', date: '11/01/2026', heure: '10:00 - 12:30', client: 'Business Pro',     type: 'Maintenance',     reclamation: 'REC-188', materiel: 'Serveur HP',         duree: '2h 30min', satisfaction: 4, notes: 'Maintenance préventive et nettoyage'                 },
  { id: 'INT-008', date: '10/01/2026', heure: '13:00 - 16:00', client: 'Smart Solutions',  type: 'Réparation',      reclamation: 'REC-182', materiel: 'Écran Samsung',      duree: '3h',      satisfaction: 5, notes: 'Remplacement dalle écran'                            },
];

const typeStyle: Record<string, string> = {
  'Réparation':      'bg-red-50    text-red-700',
  'Configuration':   'bg-blue-50   text-blue-700',
  'Installation':    'bg-slate-100 text-slate-600',
  'Maintenance':     'bg-emerald-50 text-emerald-700',
  'Support logiciel': 'bg-amber-50  text-amber-700',
};

export function HistoriqueTechnicien() {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filtered = mockHistorique.filter(h =>
    (filterType === 'all' || h.type === filterType) &&
    (!search || h.client.toLowerCase().includes(search.toLowerCase()) || h.id.toLowerCase().includes(search.toLowerCase()) || h.materiel.toLowerCase().includes(search.toLowerCase()))
  );

  const totalInterventions = filtered.length;
  const satisfactionMoy = totalInterventions > 0 ? (filtered.reduce((a, h) => a + h.satisfaction, 0) / totalInterventions).toFixed(1) : '0';

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <History className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Historique des Interventions</h1>
              <p className="text-sm text-slate-500">Consultez l'historique complet de vos interventions</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors">
            <Download className="w-4 h-4" /> Exporter
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: CheckCircle, value: totalInterventions.toString(),  label: 'Total interventions', color: 'text-blue-600'    },
          { icon: Star,        value: `${satisfactionMoy}/5`,         label: 'Satisfaction moyenne', color: 'text-amber-500'  },
          { icon: Clock,       value: '24h',                          label: 'Heures travaillées',  color: 'text-emerald-600' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className={cn('w-5 h-5', s.color)} /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par client, matériel..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
            />
          </div>
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white">
            <option value="all">Tous les types</option>
            {['Réparation','Configuration','Installation','Maintenance','Support logiciel'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-50"><History className="w-4 h-4 text-blue-600" /></div>
          <h2 className="text-sm font-semibold text-slate-800">Journal des interventions ({filtered.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['N° Intervention', 'Date & Heure', 'Client', 'Type', 'Matériel', 'Durée', 'Satisfaction', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{h.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-700">{h.date}</p>
                    <p className="text-xs text-slate-400">{h.heure}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">{h.client}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', typeStyle[h.type] || 'bg-slate-100 text-slate-600')}>{h.type}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-600">{h.materiel}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">{h.duree}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={cn('w-3.5 h-3.5', i < h.satisfaction ? 'fill-amber-400 text-amber-400' : 'text-slate-200')} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button className="flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                      <Eye className="w-3 h-3" /> Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
