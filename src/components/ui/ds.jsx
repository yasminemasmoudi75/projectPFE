/**
 * Unified Design System
 * Import from this file to keep all pages visually consistent.
 */
import { motion } from 'framer-motion';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

/* ── Motion variants ─────────────────────────────────────── */
export const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.04 } },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
};

/* ── Common class strings ────────────────────────────────── */
export const inputCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 ' +
  'placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

export const selectCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 ' +
  'focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';

export const textareaCls =
  'w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 ' +
  'placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ' +
  'transition-all resize-none';

export const labelCls = 'block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5';

export const btnPrimary =
  'inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl ' +
  'font-semibold text-sm shadow-md shadow-blue-200/50 transition-all active:scale-[0.98]';

export const btnSecondary =
  'inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl ' +
  'font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]';

export const btnDanger =
  'inline-flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl ' +
  'font-medium text-sm hover:bg-rose-100 transition-all active:scale-[0.98]';

/* ── Page wrapper ────────────────────────────────────────── */
export const PageWrapper = ({ children, className = '' }) => (
  <motion.div
    variants={pageVariants}
    initial="hidden"
    animate="visible"
    className={`space-y-6 pb-12 ${className}`}
  >
    {children}
  </motion.div>
);

/* ── KPI Card ────────────────────────────────────────────── */
export const KpiCard = ({ label, value, sub, icon: Icon, accent = 'bg-blue-500', iconBg = 'bg-blue-50', valueColor = 'text-blue-600' }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400 } }}
    className="relative bg-white rounded-2xl border border-slate-200/70 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
  >
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
    <div className="p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">{label}</p>
        <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${valueColor}`} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueColor} leading-none mb-1`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

/* ── Section Card (generic white card) ──────────────────── */
export const SectionCard = ({ children, className = '', accent }) => (
  <motion.div
    variants={fadeUp}
    className={`relative bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden ${className}`}
  >
    {accent && <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />}
    {children}
  </motion.div>
);

/* ── Form Section (card with colored header) ─────────────── */
export const FormSection = ({ title, icon: Icon, iconBg = 'bg-blue-50', iconColor = 'text-blue-600', children, accent = 'bg-blue-500' }) => (
  <motion.div
    variants={fadeUp}
    className="relative bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden"
  >
    <div className={`absolute top-0 left-0 right-0 h-0.5 ${accent}`} />
    {(title || Icon) && (
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 bg-slate-50/40">
        {Icon && (
          <div className={`h-8 w-8 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        )}
        {title && <h3 className="text-sm font-bold text-slate-700">{title}</h3>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </motion.div>
);

/* ── Page Header (list pages) ────────────────────────────── */
export const ListPageHeader = ({
  icon: Icon,
  iconBg = 'bg-blue-600',
  iconShadow = 'shadow-blue-200',
  blobColor1 = 'bg-blue-50',
  blobColor2 = 'bg-indigo-50',
  title,
  subtitle,
  chips = [],
  actions,
}) => (
  <motion.div variants={fadeUp} className="relative bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
    <div className={`absolute top-0 right-0 w-64 h-64 ${blobColor1} rounded-full -translate-y-32 translate-x-32 opacity-50 pointer-events-none`} />
    <div className={`absolute bottom-0 left-0 w-48 h-48 ${blobColor2} rounded-full translate-y-24 -translate-x-24 opacity-40 pointer-events-none`} />
    <div className="relative p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
      <div className="flex items-center gap-4">
        <div className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0`}>
          {Icon && <Icon className="h-6 w-6 text-white" />}
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Live
            </span>
          </div>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
          {chips.length > 0 && (
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {chips.map((chip, i) => (
                <span key={i} className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${chip.cls || 'text-slate-500 bg-slate-100'}`}>
                  {chip.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
    </div>
  </motion.div>
);

/* ── Detail Page Header ───────────────────────────────────── */
export const DetailPageHeader = ({
  backTo,
  icon: Icon,
  iconBg = 'bg-blue-600',
  iconShadow = 'shadow-blue-200',
  blobColor1 = 'bg-blue-50',
  blobColor2 = 'bg-indigo-50',
  title,
  subtitle,
  meta,
  badges = [],
  actions,
}) => {
  const navigate = useNavigate();
  return (
    <motion.div variants={fadeUp} className="relative bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <div className={`absolute top-0 right-0 w-64 h-64 ${blobColor1} rounded-full -translate-y-32 translate-x-32 opacity-50 pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-48 h-48 ${blobColor2} rounded-full translate-y-24 -translate-x-24 opacity-40 pointer-events-none`} />
      <div className="relative p-7">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <button
              onClick={() => backTo ? navigate(backTo) : navigate(-1)}
              className="mt-1 p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex-shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
            <div className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0`}>
              {Icon && <Icon className="h-6 w-6 text-white" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">{title}</h1>
                {badges.map((b, i) => (
                  <span key={i} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${b.cls}`}>
                    {b.dot && <span className={`h-1.5 w-1.5 rounded-full ${b.dot} inline-block`} />}
                    {b.label}
                  </span>
                ))}
              </div>
              {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
              {meta && <p className="text-xs text-slate-400 mt-1 font-medium">{meta}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">{actions}</div>}
        </div>
      </div>
    </motion.div>
  );
};

/* ── Form Page Header ────────────────────────────────────── */
export const FormPageHeader = ({
  backTo,
  icon: Icon,
  iconBg = 'bg-blue-600',
  iconShadow = 'shadow-blue-200',
  blobColor1 = 'bg-blue-50',
  blobColor2 = 'bg-indigo-50',
  title,
  subtitle,
  actions,
}) => {
  const navigate = useNavigate();
  return (
    <motion.div variants={fadeUp} className="relative bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
      <div className={`absolute top-0 right-0 w-64 h-64 ${blobColor1} rounded-full -translate-y-32 translate-x-32 opacity-50 pointer-events-none`} />
      <div className={`absolute bottom-0 left-0 w-48 h-48 ${blobColor2} rounded-full translate-y-24 -translate-x-24 opacity-40 pointer-events-none`} />
      <div className="relative p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => backTo ? navigate(backTo) : navigate(-1)}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all flex-shrink-0"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </button>
          <div className={`h-12 w-12 rounded-2xl ${iconBg} flex items-center justify-center shadow-lg ${iconShadow} flex-shrink-0`}>
            {Icon && <Icon className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h1>
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-3 flex-shrink-0">{actions}</div>}
      </div>
    </motion.div>
  );
};

/* ── Field wrapper ───────────────────────────────────────── */
export const Field = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className={labelCls}>
        {label} {required && <span className="text-rose-400 normal-case">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
  </div>
);

/* ── Info row (for detail pages) ─────────────────────────── */
export const InfoRow = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
    {Icon && (
      <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="h-3.5 w-3.5 text-slate-500" />
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-700 break-words">{value || <span className="text-slate-400 font-normal italic">Non renseigné</span>}</p>
    </div>
  </div>
);

/* ── Status badge ────────────────────────────────────────── */
export const StatusBadge = ({ label, variant = 'default', dot = true }) => {
  const variants = {
    success:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning:  'bg-amber-50 text-amber-700 border border-amber-200',
    danger:   'bg-rose-50 text-rose-700 border border-rose-200',
    info:     'bg-blue-50 text-blue-700 border border-blue-200',
    default:  'bg-slate-100 text-slate-600 border border-slate-200',
  };
  const dots = {
    success: 'bg-emerald-500', warning: 'bg-amber-400', danger: 'bg-rose-400',
    info: 'bg-blue-400', default: 'bg-slate-400',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${variants[variant]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dots[variant]} flex-shrink-0`} />}
      {label}
    </span>
  );
};

/* ── Empty state ────────────────────────────────────────── */
export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
      {Icon && <Icon className="h-8 w-8" />}
    </div>
    <p className="text-sm font-semibold text-slate-600 mb-1">{title}</p>
    {description && <p className="text-xs text-slate-400 mb-4">{description}</p>}
    {action}
  </div>
);

/* ── Section divider title ───────────────────────────────── */
export const SectionTitle = ({ children }) => (
  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">{children}</h3>
);
