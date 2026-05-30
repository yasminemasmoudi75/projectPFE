/**
 * NexusCRM — Shared Design Utilities
 * Centralises Framer Motion variants, badge configs, and color maps
 * so every page stays visually consistent without code duplication.
 */

// ─── Framer Motion variants ───────────────────────────────────────────────────

/** Page-level container: fades in children one after another */
export const pageVariants = {
  hidden:  { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.04 },
  },
};

/** Standard fade-up for cards, tables, headers */
export const fadeUp = {
  hidden:  { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 340, damping: 28 },
  },
};

/** Subtle fade-right for table rows */
export const rowVariants = {
  hidden:  { opacity: 0, x: -10 },
  visible: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.035, type: 'spring', stiffness: 300, damping: 26 },
  }),
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.12 } },
};

/** Modal / drawer entry */
export const modalVariants = {
  hidden:  { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1,    y: 0, transition: { type: 'spring', stiffness: 380, damping: 30 } },
  exit:    { opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.14 } },
};

/** Slide-in from right (detail panel) */
export const slideInRight = {
  hidden:  { opacity: 0, x: 32 },
  visible: { opacity: 1, x: 0,  transition: { type: 'spring', stiffness: 320, damping: 30 } },
  exit:    { opacity: 0, x: 32, transition: { duration: 0.14 } },
};

// ─── Role badge config ────────────────────────────────────────────────────────

export const ROLE_BADGE = {
  Admin:      'bg-violet-100 text-violet-700 border border-violet-200',
  Commercial: 'bg-sky-100    text-sky-700    border border-sky-200',
  Agent:      'bg-emerald-100 text-emerald-700 border border-emerald-200',
  Technicien: 'bg-amber-100  text-amber-700  border border-amber-200',
  Client:     'bg-rose-100   text-rose-700   border border-rose-200',
};

export const ROLE_LABEL = {
  Admin:      'Administrateur',
  Commercial: 'Commercial',
  Agent:      'Agent',
  Technicien: 'Technicien',
  Client:     'Client',
};

export const normalizeRole = (role) => {
  const r = String(role || '').trim().toLowerCase();
  if (['admin', 'administrateur'].includes(r))        return 'Admin';
  if (['commercial', 'commerciale'].includes(r))      return 'Commercial';
  if (['agent'].includes(r))                          return 'Agent';
  if (['technicien', 'technicien sav'].includes(r))   return 'Technicien';
  if (['client'].includes(r))                         return 'Client';
  return String(role || '').trim() || 'Non défini';
};

// ─── Status badge config ──────────────────────────────────────────────────────

/** Generic status → Tailwind badge classes */
export const STATUS_BADGE = {
  // boolean active/inactive
  Actif:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Inactif:     'bg-slate-100  text-slate-500   border border-slate-200',

  // document statuses
  draft:       'bg-amber-50   text-amber-700   border border-amber-200',
  valid:       'bg-blue-50    text-blue-700    border border-blue-200',
  converted:   'bg-emerald-50 text-emerald-700 border border-emerald-200',
  validated:   'bg-emerald-50 text-emerald-700 border border-emerald-200',

  // claim / project statuses
  Ouvert:       'bg-blue-50   text-blue-700    border border-blue-200',
  'En cours':   'bg-amber-50  text-amber-700   border border-amber-200',
  Résolu:       'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Fermé:        'bg-slate-100  text-slate-500   border border-slate-200',
  Annulé:       'bg-rose-50    text-rose-700    border border-rose-200',

  // project-specific
  'En retard':  'bg-rose-50   text-rose-700    border border-rose-200',
  Terminé:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
  Planifié:     'bg-sky-50    text-sky-700     border border-sky-200',
};

export const STATUS_DOT = {
  Actif:      'bg-emerald-500',
  Inactif:    'bg-slate-400',
  Ouvert:     'bg-blue-500',
  'En cours': 'bg-amber-500',
  Résolu:     'bg-emerald-500',
  Fermé:      'bg-slate-400',
  Annulé:     'bg-rose-500',
  'En retard':'bg-rose-500',
  Terminé:    'bg-emerald-500',
};

// ─── Priority badge config ────────────────────────────────────────────────────

export const PRIORITY_BADGE = {
  Urgente: 'bg-rose-50  text-rose-700  border border-rose-200',
  Haute:   'bg-amber-50 text-amber-700 border border-amber-200',
  Normale: 'bg-slate-100 text-slate-600 border border-slate-200',
  Basse:   'bg-slate-50  text-slate-500 border border-slate-200',
};

export const PRIORITY_DOT = {
  Urgente: 'bg-rose-400',
  Haute:   'bg-amber-400',
  Normale: 'bg-slate-400',
  Basse:   'bg-slate-300',
};

// ─── KPI color presets ────────────────────────────────────────────────────────
// Usage: <StatCard {...KPI_COLORS.blue} />

export const KPI_COLORS = {
  blue:    { accent: 'bg-blue-500',    iconBg: 'bg-blue-50',    valueColor: 'text-blue-600'    },
  emerald: { accent: 'bg-emerald-500', iconBg: 'bg-emerald-50', valueColor: 'text-emerald-600' },
  amber:   { accent: 'bg-amber-400',   iconBg: 'bg-amber-50',   valueColor: 'text-amber-600'   },
  rose:    { accent: 'bg-rose-500',    iconBg: 'bg-rose-50',    valueColor: 'text-rose-600'    },
  violet:  { accent: 'bg-violet-500',  iconBg: 'bg-violet-50',  valueColor: 'text-violet-600'  },
  sky:     { accent: 'bg-sky-500',     iconBg: 'bg-sky-50',     valueColor: 'text-sky-600'     },
  teal:    { accent: 'bg-teal-500',    iconBg: 'bg-teal-50',    valueColor: 'text-teal-600'    },
  slate:   { accent: 'bg-slate-400',   iconBg: 'bg-slate-100',  valueColor: 'text-slate-600'   },
};

