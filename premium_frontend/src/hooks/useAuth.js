import { useSelector } from 'react-redux';
import { USER_ROLES } from '../utils/constants';

/**
 * Hook personnalisé pour accéder aux informations d'authentification
 * @returns {Object} Informations d'authentification
 */
const useAuth = () => {
  const { user, accessToken, refreshToken, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    loading,
    isAdmin: user?.UserRole === USER_ROLES.ADMIN,
    isCommercial: user?.UserRole === USER_ROLES.COMMERCIAL,
    isAgent: user?.UserRole === USER_ROLES.AGENT,
    isTechnicien: user?.UserRole === USER_ROLES.TECHNICIEN,
    isClient: user?.UserRole === USER_ROLES.CLIENT,
  };
};

export default useAuth;

