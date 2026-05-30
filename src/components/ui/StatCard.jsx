import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const PALETTE = {
  blue:    { accent: 'bg-blue-500',    icon: 'bg-blue-50 text-blue-600',    ring: 'ring-blue-100',    bar: 'bg-blue-500'    },
  brand:   { accent: 'bg-[#0062AF]',   icon: 'bg-[#e0f0ff] text-[#0062AF]', ring: 'ring-blue-100',    bar: 'bg-[#0062AF]'   },
  emerald: { accent: 'bg-emerald-500', icon: 'bg-emerald-50 text-emerald-600', ring: 'ring-emerald-100', bar: 'bg-emerald-500' },
  amber:   { accent: 'bg-amber-500',   icon: 'bg-amber-50 text-amber-600',   ring: 'ring-amber-100',   bar: 'bg-amber-500'   },
  rose:    { accent: 'bg-rose-500',    icon: 'bg-rose-50 text-rose-600',     ring: 'ring-rose-100',    bar: 'bg-rose-500'    },
  purple:  { accent: 'bg-violet-500',  icon: 'bg-violet-50 text-violet-600', ring: 'ring-violet-100',  bar: 'bg-violet-500'  },
  sky:     { accent: 'bg-sky-500',     icon: 'bg-sky-50 text-sky-600',       ring: 'ring-sky-100',     bar: 'bg-sky-500'     },
  teal:    { accent: 'bg-teal-500',    icon: 'bg-teal-50 text-teal-600',     ring: 'ring-teal-100',    bar: 'bg-teal-500'    },
  slate:   { accent: 'bg-slate-400',   icon: 'bg-slate-100 text-slate-600',  ring: 'ring-slate-200',   bar: 'bg-slate-400'   },
};

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'brand',
  trend = null,
  trendValue = null,
  onClick,
  progress = null,
}) => {
  const p = PALETTE[color] || PALETTE.brand;

  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : 'hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]'}`}
    >
      {/* Accent top bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${p.accent}`} />

      <div className="p-5 pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 truncate">{title}</p>
            <p className="text-2xl font-black text-slate-800 leading-none mb-1 tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-slate-400 font-medium mt-1 truncate">{subtitle}</p>}
            {trend !== null && (
              <div className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {trend >= 0
                  ? <ArrowTrendingUpIcon className="h-3 w-3" />
                  : <ArrowTrendingDownIcon className="h-3 w-3" />
                }
                <span>{trendValue || `${Math.abs(trend)}%`}</span>
              </div>
            )}
          </div>

          <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${p.icon} ${p.ring}`}>
            {Icon && <Icon className="h-5 w-5" />}
          </div>
        </div>

        {progress !== null && (
          <div className="mt-4">
            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${p.bar}`}
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
