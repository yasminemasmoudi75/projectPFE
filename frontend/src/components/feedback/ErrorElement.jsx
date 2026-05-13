import { useRouteError, useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, ArrowPathIcon, HomeIcon } from '@heroicons/react/24/outline';

const ErrorElement = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  
  console.error('Route Error:', error);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ExclamationTriangleIcon className="h-10 w-10 text-rose-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Oups ! Quelque chose s'est mal passé
        </h1>
        
        <p className="text-slate-600 mb-8">
          {error?.statusText || error?.message || "Une erreur inattendue s'est produite lors du chargement de la page."}
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            Réessayer
          </button>
          
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-900 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
          >
            <HomeIcon className="h-5 w-5" />
            Tableau de bord
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && error?.stack && (
          <div className="mt-8 text-left">
            <details className="cursor-pointer">
              <summary className="text-xs text-slate-400 hover:text-slate-600">
                Détails de l'erreur (Dev uniquement)
              </summary>
              <pre className="mt-2 p-4 bg-slate-100 rounded-lg text-[10px] text-slate-700 overflow-auto max-h-40">
                {error.stack}
              </pre>
            </details>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorElement;
