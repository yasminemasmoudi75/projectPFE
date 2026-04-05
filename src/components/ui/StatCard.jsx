import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'blue', 
  trend = null, 
  trendValue = null,
  onClick 
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 bg-blue-50 text-blue-700',
    emerald: 'from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-700',
    amber: 'from-amber-500 to-amber-600 bg-amber-50 text-amber-700',
    rose: 'from-rose-500 to-rose-600 bg-rose-50 text-rose-700',
    purple: 'from-purple-500 to-purple-600 bg-purple-50 text-purple-700',
    slate: 'from-slate-500 to-slate-600 bg-slate-50 text-slate-700'
  };

  const gradientClass = colorClasses[color]?.split(' ')[0] + ' ' + colorClasses[color]?.split(' ')[1];
  const bgClass = colorClasses[color]?.split(' ')[2];
  const textClass = colorClasses[color]?.split(' ')[3];

  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-800">{value}</h3>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
          {trend !== null && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {trend >= 0 ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              <span>{trendValue || `${Math.abs(trend)}%`}</span>
            </div>
          )}
        </div>
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
