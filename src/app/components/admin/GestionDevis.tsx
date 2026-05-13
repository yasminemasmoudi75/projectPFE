import { useState } from 'react';
import { FileText, ShoppingCart, Eye, Download, Plus } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockDevis = [
  { id: 'DEV-001', client: 'Tech Solutions',  montant: 15500, date: '15/01/2026', statut: 'En attente', items: 5 },
  { id: 'DEV-002', client: 'Digital Agency',  montant: 8900,  date: '16/01/2026', statut: 'Accepté',    items: 3 },
  { id: 'DEV-003', client: 'Innovation Corp', montant: 22000, date: '18/01/2026', statut: 'En attente', items: 8 },
  { id: 'DEV-004', client: 'Web Solutions',   montant: 6700,  date: '19/01/2026', statut: 'Refusé',     items: 2 },
];

const mockCommandes = [
  { id: 'CMD-001', client: 'Cloud Masters',  montant: 18700, date: '10/01/2026', statut: 'Livrée',    source: 'DEV-045' },
  { id: 'CMD-002', client: 'Web Solutions',  montant: 12300, date: '12/01/2026', statut: 'En cours',  source: 'DEV-048' },
  { id: 'CMD-003', client: 'Tech Start',     montant: 9800,  date: '14/01/2026', statut: 'En cours',  source: 'DEV-051' },
];

const devisStatut: Record<string, string> = {
  'En attente': 'bg-amber-50 text-amber-700',
  'Accepté':    'bg-emerald-50 text-emerald-700',
  'Refusé':     'bg-red-50 text-red-700',
};
const cmdStatut: Record<string, string> = {
  'Livrée':   'bg-emerald-50 text-emerald-700',
  'En cours': 'bg-blue-50 text-blue-700',
};

export function GestionDevis() {
  const [tab, setTab] = useState<'devis' | 'commandes'>('devis');

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Devis & Commandes</h1>
              <p className="text-sm text-slate-500">Gérez vos devis et transformez-les en commandes</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau devis
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'En attente', value: mockDevis.filter(d => d.statut === 'En attente').length, icon: FileText },
          { label: 'Acceptés',   value: mockDevis.filter(d => d.statut === 'Accepté').length,    icon: FileText },
          { label: 'CA Devis',   value: `${mockDevis.reduce((a,d)=>a+d.montant,0).toLocaleString('fr-FR')} €`, icon: FileText },
          { label: 'CA Commandes',value: `${mockCommandes.reduce((a,c)=>a+c.montant,0).toLocaleString('fr-FR')} €`, icon: ShoppingCart },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className="w-4 h-4 text-blue-600" /></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Tabs + Table ── */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 p-3 border-b border-slate-100 bg-slate-50">
          {(['devis', 'commandes'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                tab === t ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600')}>
              {t === 'devis' ? <FileText className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {t === 'devis' ? 'Devis' : 'Commandes'}
            </button>
          ))}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {(tab === 'devis'
                ? ['N° Devis', 'Client', 'Montant HT', 'Date', 'Articles', 'Statut', '']
                : ['N° Commande', 'Client', 'Montant HT', 'Date', 'Devis source', 'Statut', '']
              ).map(h => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tab === 'devis'
              ? mockDevis.map(d => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{d.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.client}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{d.montant.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-slate-500">{d.date}</td>
                  <td className="px-4 py-3 text-slate-500">{d.items} articles</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', devisStatut[d.statut] || 'bg-slate-100 text-slate-500')}>{d.statut}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Download className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))
              : mockCommandes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-500">{c.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.client}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{c.montant.toLocaleString('fr-FR')} €</td>
                  <td className="px-4 py-3 text-slate-500">{c.date}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{c.source}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cmdStatut[c.statut] || 'bg-slate-100 text-slate-500')}>{c.statut}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>

    </div>
  );
}
