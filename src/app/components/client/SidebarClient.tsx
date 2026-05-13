import { useState } from 'react';
import {
  LayoutDashboard, AlertCircle, History,
  FileText, LogOut, ChevronDown, Mail,
} from 'lucide-react';
import { cn } from '@/app/components/ui/utils';

interface SidebarClientProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const palette: Record<string, { pastel: string; text: string; solid: string }> = {
  sky:    { pastel: 'bg-sky-50',    text: 'text-sky-600',    solid: 'bg-sky-500'    },
  rose:   { pastel: 'bg-rose-50',   text: 'text-rose-600',   solid: 'bg-rose-500'   },
  teal:   { pastel: 'bg-teal-50',   text: 'text-teal-600',   solid: 'bg-teal-500'   },
  violet: { pastel: 'bg-violet-50', text: 'text-violet-600', solid: 'bg-violet-500' },
};

const groups = [
  {
    name: 'Dashboard',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, color: 'sky' },
    ],
  },
  {
    name: 'Mon espace',
    items: [
      { id: 'reclamations', label: 'Mes Réclamations', icon: AlertCircle, color: 'rose'   },
      { id: 'historique',   label: 'Historique',       icon: History,    color: 'teal'   },
      { id: 'messages',     label: 'Messages',          icon: Mail,       color: 'sky'    },
      { id: 'documents',    label: 'Mes Documents',    icon: FileText,   color: 'violet' },
    ],
  },
];

export function SidebarClient({ activeTab, onTabChange }: SidebarClientProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (name: string) => setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));

  return (
    <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 p-3 z-50">
      <div className="h-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden flex flex-col">

        {/* ── Logo ── */}
        <div className="border-b border-slate-200 px-5 py-5 bg-slate-50">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
              <img src="/images/logonexus.png" className="h-8 w-8 object-contain" alt="Nexus" onError={(e) => { (e.target as HTMLImageElement).style.display='none'; }} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-slate-900">NexusCRM</h1>
              <p className="text-xs text-slate-500 font-medium">Business Management</p>
            </div>
          </div>
        </div>

        {/* ── User Profile Card ── */}
        <div className="px-4 py-4 border-b border-slate-200">
          <div className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:border-blue-300 transition-all cursor-pointer group">
            <div className="relative">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
                SC
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-slate-900 truncate">Société Cliente</p>
              <p className="text-xs text-slate-500 truncate">Client</p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-1">
            {groups.map((group) => {
              const isOpen = collapsed[group.name] !== true;
              return (
                <div key={group.name} className="mb-4">
                  <button
                    onClick={() => toggle(group.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <span className="flex-1 text-left text-xs font-bold text-slate-600 uppercase tracking-widest">
                      {group.name}
                    </span>
                    <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isOpen ? 'rotate-180' : '')} />
                  </button>

                  {isOpen && (
                    <div className="py-1 space-y-0.5">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        const p = palette[item.color] || palette.sky;
                        return (
                          <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={cn(
                              'group relative w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-colors duration-200 text-left',
                              isActive ? p.pastel : 'hover:bg-slate-200/50'
                            )}
                          >
                            {isActive && (
                              <div className={cn('absolute left-0 inset-y-2 w-1 rounded-r-full', p.solid)} />
                            )}
                            <div className={cn(
                              'h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300',
                              isActive ? cn(p.solid, 'shadow-md') : cn(p.pastel, 'group-hover:scale-105')
                            )}>
                              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : p.text)} />
                            </div>
                            <span className={cn('text-sm font-semibold truncate', isActive ? p.text : 'text-slate-600 group-hover:text-slate-800')}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </nav>

        {/* ── Logout ── */}
        <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group">
            <div className="h-8 w-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
              <LogOut className="h-4 w-4 text-red-600" />
            </div>
            <span className="text-sm font-medium">Déconnexion</span>
          </button>
        </div>

      </div>
    </div>
  );
}
