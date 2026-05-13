import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Phone, MapPin, Wrench, Briefcase, FileText } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const evenements = [
  { id: '1',  type: 'Appel',        titre: 'Suivi Tech Solutions',   societe: 'Tech Solutions SARL', responsable: 'Fatima Zahra', heure: '09:00', date: 6  },
  { id: '2',  type: 'Visite',       titre: 'Démonstration produit',  societe: 'Digital Agency',       responsable: 'Karim Sales',  heure: '10:30', date: 6  },
  { id: '3',  type: 'Intervention', titre: 'Réparation serveur',      societe: 'Innovation Corp',      responsable: 'Mohamed Tech', heure: '14:00', date: 8  },
  { id: '4',  type: 'Réunion',      titre: 'Réunion commerciale',     societe: 'Bureau Central',       responsable: 'Admin',        heure: '16:00', date: 10 },
  { id: '5',  type: 'Projet',       titre: 'Kick-off Migration',      societe: 'Cloud Masters',        responsable: 'Fatima',       heure: '09:30', date: 13 },
  { id: '6',  type: 'Intervention', titre: 'Installation ERP',        societe: 'Web Solutions Pro',    responsable: 'Youssef',      heure: '11:00', date: 15 },
  { id: '7',  type: 'Appel',        titre: 'Relance devis',           societe: 'Tech Start SARL',      responsable: 'Karim',        heure: '15:00', date: 17 },
  { id: '8',  type: 'Visite',       titre: 'Audit sécurité',          societe: 'Smart Systems',        responsable: 'Mohamed',      heure: '10:00', date: 20 },
  { id: '9',  type: 'Réunion',      titre: 'Comité direction',        societe: 'Bureau Central',       responsable: 'Admin',        heure: '14:00', date: 21 },
  { id: '10', type: 'Intervention', titre: 'Maintenance réseau',      societe: 'Digital Agency',       responsable: 'Mohamed',      heure: '09:00', date: 22 },
  { id: '11', type: 'Appel',        titre: 'Support client',          societe: 'Tech Solutions SARL',  responsable: 'Sarah',        heure: '11:30', date: 24 },
  { id: '12', type: 'Projet',       titre: 'Livraison ERP',           societe: 'Innovation Corp',      responsable: 'Fatima',       heure: '14:00', date: 27 },
];

const typeStyle: Record<string, { dot: string; badge: string; icon: typeof Phone }> = {
  Appel:        { dot: 'bg-blue-500',    badge: 'bg-blue-50   text-blue-700',   icon: Phone    },
  Visite:       { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', icon: MapPin  },
  Intervention: { dot: 'bg-amber-500',   badge: 'bg-amber-50  text-amber-700',  icon: Wrench   },
  Réunion:      { dot: 'bg-slate-500',   badge: 'bg-slate-100 text-slate-700',  icon: FileText },
  Projet:       { dot: 'bg-violet-500',  badge: 'bg-violet-50 text-violet-700', icon: Briefcase},
};

const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
// Janvier 2026 commence un jeudi (index 3)
const cellules = [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, null];

export function CalendrierGlobal() {
  const [selectedDay, setSelectedDay] = useState<number | null>(21);

  const eventsForDay = (day: number | null) => !day ? [] : evenements.filter(e => e.date === day);
  const selectedEvents = eventsForDay(selectedDay);

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Calendrier Global</h1>
              <p className="text-sm text-slate-500">Vue d'ensemble des activités et interventions</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvel événement
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Grille calendrier ── */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-sm font-semibold text-slate-800">Janvier 2026</span>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {jours.map(j => (
                <div key={j} className="text-center text-[11px] font-semibold text-slate-400 uppercase py-1">{j}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cellules.map((day, i) => {
                const evts = eventsForDay(day);
                const isToday = day === 21;
                const isSelected = day === selectedDay;
                return (
                  <div key={i}
                    onClick={() => day && setSelectedDay(day)}
                    className={cn(
                      'min-h-[60px] p-1.5 rounded-lg cursor-pointer transition-colors',
                      !day ? 'cursor-default' : '',
                      isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : day ? 'hover:bg-slate-50' : ''
                    )}>
                    {day && (
                      <>
                        <div className={cn('w-6 h-6 flex items-center justify-center rounded-full text-xs font-semibold mb-1',
                          isToday ? 'bg-blue-600 text-white' : 'text-slate-600')}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {evts.slice(0, 2).map(e => (
                            <div key={e.id} className={cn('w-full h-1.5 rounded-full', typeStyle[e.type]?.dot || 'bg-slate-400')} />
                          ))}
                          {evts.length > 2 && (
                            <div className="text-[9px] text-slate-400 font-medium">+{evts.length - 2}</div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Événements du jour ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              {selectedDay ? `Événements — ${selectedDay} janvier 2026` : 'Sélectionnez un jour'}
            </p>
            {selectedEvents.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{selectedEvents.length} événement{selectedEvents.length > 1 ? 's' : ''}</p>
            )}
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[420px]">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucun événement ce jour</p>
              </div>
            ) : (
              selectedEvents.map(e => {
                const conf = typeStyle[e.type];
                const Icon = conf?.icon || FileText;
                return (
                  <div key={e.id} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', conf?.dot || 'bg-slate-400')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-md', conf?.badge)}>
                          <Icon className="w-2.5 h-2.5" />{e.type}
                        </span>
                        <span className="text-xs text-slate-400">{e.heure}</span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{e.titre}</p>
                      <p className="text-xs text-slate-500">{e.societe}</p>
                      <p className="text-xs text-slate-400">{e.responsable}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
