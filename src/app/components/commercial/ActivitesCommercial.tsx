import { useState } from 'react';
import { Phone, Mail, MapPin, FileText, Plus } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const mockActivites = [
  { id: '1', type: 'Appel',  client: 'Tech Solutions SARL', contact: 'Ahmed Benali',  sujet: 'Suivi projet migration',         date: '21/01/2026 10:30', statut: 'Terminé'   },
  { id: '2', type: 'Email',  client: 'Digital Agency',       contact: 'Salma Tazi',    sujet: 'Envoi proposition commerciale',  date: '21/01/2026 09:15', statut: 'Terminé'   },
  { id: '3', type: 'Visite', client: 'Innovation Corp',      contact: 'Karim Alami',   sujet: 'Démonstration solution',         date: '20/01/2026 14:00', statut: 'Terminé'   },
  { id: '4', type: 'Note',   client: 'Cloud Masters',        contact: '',              sujet: 'Idées pour proposition technique', date: '20/01/2026 11:00', statut: 'Brouillon' },
  { id: '5', type: 'Appel',  client: 'Web Solutions Pro',    contact: 'Fatima Idrissi', sujet: 'Relance devis',                date: '19/01/2026 16:30', statut: 'Planifié'  },
];

const typeConfig: Record<string, { icon: typeof Phone; label: string; badge: string; dot: string }> = {
  Appel:  { icon: Phone,    label: 'Appel',  badge: 'bg-blue-50   text-blue-700',   dot: 'border-blue-400'   },
  Email:  { icon: Mail,     label: 'Email',  badge: 'bg-slate-100 text-slate-700',  dot: 'border-slate-400'  },
  Visite: { icon: MapPin,   label: 'Visite', badge: 'bg-emerald-50 text-emerald-700', dot: 'border-emerald-400' },
  Note:   { icon: FileText, label: 'Note',   badge: 'bg-amber-50  text-amber-700',  dot: 'border-amber-400'  },
};

const statutStyle: Record<string, string> = {
  Terminé:   'bg-emerald-50 text-emerald-700',
  Planifié:  'bg-blue-50    text-blue-700',
  Brouillon: 'bg-slate-100  text-slate-500',
};

export function ActivitesCommercial() {
  const [filterType, setFilterType] = useState('all');

  const filtered = mockActivites.filter(a => filterType === 'all' || a.type === filterType);

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Phone className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mes Activités</h1>
              <p className="text-sm text-slate-500">Gérez vos appels, emails, visites et notes</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle activité
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex gap-1">
          {[['all', 'Tous'], ['Appel', 'Appels'], ['Email', 'Emails'], ['Visite', 'Visites'], ['Note', 'Notes']].map(([v, l]) => (
            <button key={v}
              onClick={() => setFilterType(v)}
              className={cn('px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                filterType === v ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-3">
        {filtered.map(a => {
          const conf = typeConfig[a.type] || typeConfig.Note;
          const Icon = conf.icon;
          return (
            <div key={a.id} className={cn('bg-white border border-slate-200 rounded-2xl p-4 shadow-sm border-l-4', conf.dot)}>
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-slate-50 flex-shrink-0">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{a.sujet}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {a.client}{a.contact ? ` · ${a.contact}` : ''}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 whitespace-nowrap flex-shrink-0">{a.date}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', conf.badge)}>{conf.label}</span>
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', statutStyle[a.statut] || 'bg-slate-100 text-slate-500')}>{a.statut}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
