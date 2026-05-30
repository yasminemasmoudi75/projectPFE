import { ArrowLeftIcon, ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  action,
  backButton = false,
  backTo,
  breadcrumbs = [],
  badge,
}) => {
  const navigate = useNavigate();

  const iconPalette = {
    blue:    'from-[#0062AF] to-[#004a85]',
    emerald: 'from-emerald-500 to-emerald-600',
    amber:   'from-amber-500 to-amber-600',
    violet:  'from-violet-500 to-violet-600',
    rose:    'from-rose-500 to-rose-600',
    sky:     'from-sky-500 to-sky-600',
    teal:    'from-teal-500 to-teal-600',
  };

  const gradient = iconPalette[iconColor] || iconPalette.blue;

  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-4 flex-wrap">
          <HomeIcon className="h-3 w-3 flex-shrink-0" />
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-1">
              <ChevronRightIcon className="h-3 w-3 text-slate-300 flex-shrink-0" />
              {crumb.href ? (
                <button
                  onClick={() => navigate(crumb.href)}
                  className="hover:text-[#0062AF] font-medium transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-slate-600 font-semibold">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Back button */}
          {backButton && (
            <button
              onClick={() => backTo ? navigate(backTo) : navigate(-1)}
              className="h-9 w-9 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center shadow-sm flex-shrink-0"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>
          )}

          {/* Icon */}
          {Icon && (
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shadow-black/10 flex-shrink-0`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          )}

          {/* Text */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 leading-tight">{title}</h1>
              {badge && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#e0f0ff] text-[#0062AF] border border-blue-200/60">
                  {badge}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-sm text-slate-400 font-medium mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Action slot */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
