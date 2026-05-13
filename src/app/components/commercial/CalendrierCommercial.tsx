import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Plus, Phone, MapPin, Building2, Clock } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

const rendezvous = [
  { id: '1', type: 'Visite', societe: 'Tech Solutions SARL', contact: 'M. Ahmed Bennani',  date: 6,  heure: '09:00', duree: '2h',     adresse: 'Casablanca, Zone industrielle' },
  { id: '2', type: 'Appel',  societe: 'Digital Agency',       contact: 'Mme. Fatima Alaoui', date: 8,  heure: '14:00', duree: '30min',  adresse: 'Téléphone'                     },
  { id: '3', type: 'Visite', societe: 'Innovation Corp',      contact: 'M. Youssef Tazi',    date: 13, heure: '10:30', duree: '3h',     adresse: 'Rabat, Hay Riad'               },
  { id: '4', type: 'Appel',  societe: 'Cloud Masters',        contact: 'M. Karim El Fassi',  date: 15, heure: '11:00', duree: '45min',  adresse: 'Téléphone'                     },
  { id: '5', type: 'Visite', societe: 'Web Solutions Pro',    contact: 'Mme. Sara Bennis',   date: 20, heure: '15:00', duree: '2h',     adresse: 'Marrakech, Guéliz'             },
  { id: '6', type: 'Appel',  societe: 'Tech Start SARL',      contact: 'M. Omar Lahlou',     date: 22, heure: '09:30', duree: '20min',  adresse: 'Téléphone'                     },
  { id: '7', type: 'Visite', societe: 'Smart Systems',        contact: 'M. Hassan Idrissi',  date: 27, heure: '14:00', duree: '4h',     adresse: 'Tanger, Zone franche'          },
];

const typeConfig: Record<string, { dot: string; badge: string; icon: typeof Phone }> = {
  Appel:  { dot: 'bg-blue-500',    badge: 'bg-blue-50   text-blue-700',   icon: Phone  },
  Visite: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', icon: MapPin },
};

const jours = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const cellules = [null, null, null, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, null];

export function CalendrierCommercial() {
  const [selectedDay, setSelectedDay] = useState<number | null>(21);

  const eventsForDay = (day: number | null) => !day ? [] : rendezvous.filter(r => r.date === day);
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
              <h1 className="text-xl font-bold text-slate-900">Mon Calendrier</h1>
              <p className="text-sm text-slate-500">Gérez vos rendez-vous et appels clients</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouveau rendez-vous
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Phone,    value: rendezvous.filter(r => r.type === 'Appel').length.toString(),  label: 'Appels',    color: 'text-blue-600'    },
          { icon: MapPin,   value: rendezvous.filter(r => r.type === 'Visite').length.toString(), label: 'Visites',   color: 'text-emerald-600' },
          { icon: Building2, value: '12',                                                         label: 'Sociétés',  color: 'text-blue-600'    },
          { icon: Clock,    value: '24h',                                                         label: 'Ce mois',   color: 'text-blue-600'    },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 inline-flex mb-2">
                <Icon className={cn('w-5 h-5', s.color)} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Grille calendrier */}
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
                            <div key={e.id} className={cn('w-full h-1.5 rounded-full', typeConfig[e.type]?.dot || 'bg-slate-400')} />
                          ))}
                          {evts.length > 2 && <div className="text-[9px] text-slate-400 font-medium">+{evts.length - 2}</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Événements du jour */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-800">
              {selectedDay ? `Rendez-vous — ${selectedDay} janvier 2026` : 'Sélectionnez un jour'}
            </p>
            {selectedEvents.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{selectedEvents.length} rendez-vous</p>
            )}
          </div>
          <div className="p-4 space-y-3 overflow-y-auto max-h-[420px]">
            {selectedEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucun rendez-vous ce jour</p>
              </div>
            ) : (
              selectedEvents.map(e => {
                const conf = typeConfig[e.type];
                const Icon = conf?.icon || Phone;
                return (
                  <div key={e.id} className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', conf?.dot || 'bg-slate-400')} />
                      <span className={cn('text-[10px] font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-1', conf?.badge)}>
                        <Icon className="w-2.5 h-2.5" />{e.type}
                      </span>
                      <span className="text-xs text-slate-400">{e.heure}</span>
                      <span className="text-xs text-slate-400">· {e.duree}</span>
                    </div>
                    <div className="flex items-center gap-1 mb-0.5">
                      <Building2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-800 truncate">{e.societe}</p>
                    </div>
                    <p className="text-xs text-slate-500">{e.contact}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <p className="text-xs text-slate-400 truncate">{e.adresse}</p>
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
