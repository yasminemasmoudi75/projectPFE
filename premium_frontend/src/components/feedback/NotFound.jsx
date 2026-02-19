import { Link } from 'react-router-dom';
import { HomeIcon } from '@heroicons/react/24/outline';

/**
 * Page 404 - Page non trouvée
 */
const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-600">404</h1>
        <h2 className="mt-4 text-3xl font-semibold text-slate-800">Page non trouvée</h2>
        <p className="mt-2 text-gray-600">
          Désolé, la page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link
          to="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-white transition-colors hover:bg-primary-700"
        >
          <HomeIcon className="h-5 w-5" />
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

