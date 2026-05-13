import { useState } from 'react';
import { FileText, ShoppingCart, Plus, Eye, Send, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mesDevis = [
  { id: 'DEV-234', client: 'Tech Solutions SARL', montant: 45000, date: '10/01/2026', statut: 'En attente', validite: '10/02/2026', items: 8  },
  { id: 'DEV-241', client: 'Digital Agency',       montant: 89000, date: '12/01/2026', statut: 'Accepté',   validite: '12/02/2026', items: 12 },
  { id: 'DEV-245', client: 'Innovation Corp',      montant: 32000, date: '15/01/2026', statut: 'En attente', validite: '15/02/2026', items: 5  },
  { id: 'DEV-248', client: 'Cloud Masters',        montant: 67000, date: '18/01/2026', statut: 'Refusé',    validite: '18/02/2026', items: 10 },
];

const mesCommandes = [
  { id: 'CMD-156', client: 'Web Solutions Pro', montant: 78000, date: '08/01/2026', statut: 'En cours', devisSource: 'DEV-230', livraison: '08/02/2026' },
  { id: 'CMD-162', client: 'Smart Systems',     montant: 54000, date: '14/01/2026', statut: 'Livrée',   devisSource: 'DEV-238', livraison: '20/01/2026' },
  { id: 'CMD-165', client: 'Tech Start SARL',   montant: 41000, date: '19/01/2026', statut: 'En cours', devisSource: 'DEV-241', livraison: '19/02/2026' },
];

const devisStatutStyle: Record<string, string> = {
  'En attente': 'bg-amber-50   text-amber-700',
  'Accepté':    'bg-emerald-50 text-emerald-700',
  'Refusé':     'bg-red-50     text-red-700',
};
const cmdStatutStyle: Record<string, string> = {
  'En cours': 'bg-blue-50    text-blue-700',
  'Livrée':   'bg-emerald-50 text-emerald-700',
};

export function DevisCommercial() {
  const [activeTab, setActiveTab] = useState('devis');

  const enAttente = mesDevis.filter(d => d.statut === 'En attente').length;
  const acceptes  = mesDevis.filter(d => d.statut === 'Accepté').length;
  const cmdEnCours = mesCommandes.filter(c => c.statut === 'En cours').length;
  const totalCA   = mesCommandes.reduce((a, c) => a + c.montant, 0);

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mes Devis & Commandes</h1>
              <p className="text-sm text-slate-500">Gérez vos devis et suivez vos commandes</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau devis
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Devis en attente',   value: enAttente,                          icon: Clock,        color: 'text-amber-600'   },
          { label: 'Devis acceptés',     value: acceptes,                           icon: CheckCircle,  color: 'text-emerald-600' },
          { label: 'Commandes actives',  value: cmdEnCours,                         icon: ShoppingCart, color: 'text-blue-600'    },
          { label: 'CA total',           value: `${(totalCA / 1000).toFixed(0)}K€`, icon: DollarSign,   color: 'text-blue-600'    },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className={cn('w-5 h-5', s.color)} /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {[['devis', 'Mes Devis', FileText], ['commandes', 'Mes Commandes', ShoppingCart]].map(([v, l, Icon]) => (
          <button key={v as string}
            onClick={() => setActiveTab(v as string)}
            className={cn('flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-lg transition-colors',
              activeTab === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
            {l}
          </button>
        ))}
      </div>

      {/* Devis table */}
      {activeTab === 'devis' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><FileText className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Liste de mes devis</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['N° Devis', 'Client', 'Date', 'Validité', 'Montant', 'Articles', 'Statut', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mesDevis.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.client}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{d.date}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{d.validite}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{d.montant.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-slate-600">{d.items} articles</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', devisStatutStyle[d.statut])}>{d.statut}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button className="flex items-center gap-1 px-2 py-1 text-xs border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600 transition-colors">
                        <Eye className="w-3 h-3" /> Voir
                      </button>
                      {d.statut === 'En attente' && (
                        <button className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                          <Send className="w-3 h-3" /> Relancer
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Commandes table */}
      {activeTab === 'commandes' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
            <div className="p-2 rounded-lg bg-slate-50"><ShoppingCart className="w-4 h-4 text-blue-600" /></div>
            <h2 className="text-sm font-semibold text-slate-800">Liste de mes commandes</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['N° Commande', 'Client', 'Date', 'Livraison', 'Montant', 'Devis source', 'Statut', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mesCommandes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-emerald-600">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.client}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.date}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{c.livraison}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{c.montant.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 font-mono text-xs text-blue-600">{c.devisSource}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cmdStatutStyle[c.statut])}>{c.statut}</span>
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
      )}

    </div>
  );
}
