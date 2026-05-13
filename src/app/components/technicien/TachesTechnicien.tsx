import { useState } from 'react';
import { CheckSquare, Clock, AlertCircle, Plus, Calendar } from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface Tache {
  id: string;
  titre: string;
  description: string;
  priorite: 'Haute' | 'Moyenne' | 'Basse';
  statut: 'todo' | 'in_progress' | 'done';
  deadline: string;
  intervention?: string;
  completed: boolean;
}

const mockTaches: Tache[] = [
  { id: 'T-001', titre: 'Préparer matériel pour intervention Tech Solutions', description: 'Vérifier et préparer les pièces de rechange pour serveur HP',             priorite: 'Haute',   statut: 'todo',        deadline: '19/01/2026 08:00', intervention: 'INT-001', completed: false },
  { id: 'T-002', titre: 'Commander câbles réseau',                            description: 'Commander 50m de câbles Cat6 pour intervention Digital Services',          priorite: 'Haute',   statut: 'in_progress', deadline: '19/01/2026 12:00', intervention: 'INT-002', completed: false },
  { id: 'T-003', titre: 'Mettre à jour documentation intervention',           description: 'Documenter la procédure de maintenance Cloud Masters',                      priorite: 'Moyenne', statut: 'in_progress', deadline: '19/01/2026 17:00', intervention: 'INT-004', completed: false },
  { id: 'T-004', titre: 'Vérifier stock pièces détachées',                    description: 'Inventaire mensuel du stock de pièces',                                    priorite: 'Basse',   statut: 'todo',        deadline: '20/01/2026 10:00', intervention: undefined, completed: false },
  { id: 'T-005', titre: 'Formation nouveau logiciel diagnostic',              description: 'Compléter la formation en ligne sur le nouveau logiciel',                   priorite: 'Moyenne', statut: 'todo',        deadline: '21/01/2026 16:00', intervention: undefined, completed: false },
  { id: 'T-006', titre: 'Rapport intervention Cloud Masters',                 description: "Rédiger le rapport détaillé de l'intervention terminée",                   priorite: 'Haute',   statut: 'done',        deadline: '17/01/2026 18:00', intervention: 'INT-004', completed: true  },
];

const prioriteStyle: Record<string, string> = {
  Haute:   'bg-red-50    text-red-700',
  Moyenne: 'bg-amber-50  text-amber-700',
  Basse:   'bg-slate-100 text-slate-600',
};

const columns: Array<{ key: 'todo' | 'in_progress' | 'done'; label: string; icon: typeof AlertCircle; color: string }> = [
  { key: 'todo',        label: 'À faire',   icon: AlertCircle, color: 'text-amber-600'   },
  { key: 'in_progress', label: 'En cours',  icon: Clock,       color: 'text-blue-600'    },
  { key: 'done',        label: 'Terminées', icon: CheckSquare, color: 'text-emerald-600' },
];

export function TachesTechnicien() {
  const [taches, setTaches] = useState(mockTaches);

  const toggle = (id: string) => {
    setTaches(prev => prev.map(t =>
      t.id === id ? { ...t, completed: !t.completed, statut: !t.completed ? 'done' : 'todo' } : t
    ));
  };

  const byStatut = (key: string) => taches.filter(t => t.statut === key);

  return (
    <div className="space-y-5">

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
              <CheckSquare className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Mes Tâches</h1>
              <p className="text-sm text-slate-500">Organisez et suivez vos tâches quotidiennes</p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Nouvelle tâche
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {columns.map(col => {
          const Icon = col.icon;
          return (
            <div key={col.key} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="p-2.5 rounded-xl bg-slate-50"><Icon className={cn('w-5 h-5', col.color)} /></div>
              </div>
              <p className="text-2xl font-bold text-slate-900">{byStatut(col.key).length}</p>
              <p className="text-xs text-slate-400 mt-0.5">{col.label}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {columns.map(col => {
          const Icon = col.icon;
          const tasks = byStatut(col.key);
          return (
            <div key={col.key} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50">
                <Icon className={cn('w-4 h-4', col.color)} />
                <span className="text-sm font-semibold text-slate-700">{col.label}</span>
                <span className="ml-auto text-xs font-semibold text-slate-400">{tasks.length}</span>
              </div>
              <div className="p-3 space-y-2 min-h-[320px]">
                {tasks.map(t => (
                  <div key={t.id} className={cn('border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors', t.completed ? 'opacity-60' : '')}>
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={t.completed}
                        onChange={() => toggle(t.id)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <p className={cn('text-xs font-semibold text-slate-800', t.completed && 'line-through text-slate-400')}>
                            {t.titre}
                          </p>
                          <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0', prioriteStyle[t.priorite])}>
                            {t.priorite}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">{t.description}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Calendar className="w-3 h-3" />{t.deadline}
                          </div>
                          {t.intervention && (
                            <span className="text-[10px] font-medium font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              {t.intervention}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
