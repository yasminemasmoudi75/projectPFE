import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useAuth from '../hooks/useAuth';
import { getProfile } from './authSlice';
import LoadingSpinner from '../components/feedback/LoadingSpinner';

/**
 * Composant pour protéger les routes nécessitant une authentification
 */
const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    // Si authentifié mais pas de données utilisateur, récupérer le profil
    if (isAuthenticated && !user && !loading) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, user, loading, dispatch]);

  // Afficher un loader pendant la vérification
  if (loading || (isAuthenticated && !user)) {
    return <LoadingSpinner fullScreen />;
  }

  // Rediriger vers login si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  // Afficher le contenu protégé
  return children;
};

export default ProtectedRoute;

