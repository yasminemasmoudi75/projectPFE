import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setAccessToken, getProfile } from './authSlice';
import LoadingSpinner from '../components/feedback/LoadingSpinner';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      // 1. Stocker le token
      dispatch(setAccessToken(token));
      
      // 2. Charger le profil pour confirmer l'authentification
      dispatch(getProfile())
        .unwrap()
        .then(() => {
          toast.success('Connexion Google réussie !');
          navigate('/dashboard', { replace: true });
        })
        .catch((err) => {
          console.error('❌ Erreur lors du chargement du profil Google:', err);
          toast.error('Session invalide ou expirée');
          navigate('/auth/login', { replace: true });
        });
    } else {
      toast.error('Token manquant dans la redirection');
      navigate('/auth/login', { replace: true });
    }
  }, [location, dispatch, navigate]);

  return <LoadingSpinner fullScreen />;
};

export default AuthCallback;
