import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ 
  title, 
  subtitle, 
  icon: Icon, 
  action,
  backButton = false,
  backTo,
  breadcrumbs = []
}) => {
  const navigate = useNavigate();

  return (
    <div className="mb-8">
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
          {breadcrumbs.map((crumb, idx) => (
            <span key={idx} className="flex items-center gap-2">
              {idx > 0 && <span className="text-slate-300">/</span>}
              {crumb.href ? (
                <button 
                  onClick={() => navigate(crumb.href)}
                  className="hover:text-blue-600 transition-colors"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className="text-slate-700 font-medium">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {backButton && (
            <button
              onClick={() => backTo ? navigate(backTo) : navigate(-1)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Icon className="h-6 w-6 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
              {subtitle && (
                <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

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
