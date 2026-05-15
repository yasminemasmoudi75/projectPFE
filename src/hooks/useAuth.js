import { useSelector, useDispatch } from 'react-redux';
import { USER_ROLES } from '../utils/constants';
import { logout } from '../auth/authSlice';

const normalizeRole = (role) => (role || '').toString().trim().toLowerCase();

/**
 * Hook personnalisé pour accéder aux informations d'authentification
 * @returns {Object} Informations d'authentification
 */
const useAuth = () => {
  const { user, accessToken, refreshToken, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    loading,
    logout: handleLogout,
    isAdmin: ['admin', 'administrateur'].includes(normalizeRole(user?.UserRole)),
    isCommercial: ['commercial', 'commerciale'].includes(normalizeRole(user?.UserRole)),
    isAgent: ['agent'].includes(normalizeRole(user?.UserRole)),
    isTechnicien: normalizeRole(user?.UserRole) === normalizeRole(USER_ROLES.TECHNICIEN),
    isClient: normalizeRole(user?.UserRole) === normalizeRole(USER_ROLES.CLIENT),
  };
};

export default useAuth;

