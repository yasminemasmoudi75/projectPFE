import { useEffect, useState } from 'react';
import axios from '../../app/axios';

const GmailConnectButton = ({ isConnected, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectGmail = async () => {
    setLoading(true);
    setError(null);
    try {
      // Appeler l'endpoint pour obtenir l'URL d'autorisation
      const response = await axios.get('/auth/gmail/authorize-url');
      
      console.log('📧 Réponse complète du serveur:', response.data);
      
      // Essayer différents niveaux de structure de réponse
      const authUrl = response.data?.data?.authUrl 
        || response.data?.authUrl 
        || response.data;

      console.log('📧 URL d\'autorisation reçue:', authUrl);

      if (!authUrl || typeof authUrl !== 'string' || !authUrl.startsWith('https')) {
        throw new Error(`URL invalide: ${authUrl}`);
      }

      // Rediriger vers Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Erreur lors de la connexion à Gmail';
      setError(errorMsg);
      console.error('Error connecting to Gmail:', err);
      setLoading(false);
    }
  };

  const handleDisconnectGmail = async () => {
    if (!confirm('Êtes-vous sûr que vous voulez déconnecter Gmail?')) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await axios.post('/auth/gmail/revoke');
      onStatusChange(false);
      alert('Gmail déconnecté ✅');
    } catch (err) {
      setError('Erreur lors de la déconnexion');
      console.error('Error disconnecting Gmail:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-2 text-xs text-red-600" onClick={() => setError(null)}>
          {error}
        </div>
      )}
      {isConnected ? (
        <button
          onClick={handleDisconnectGmail}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-red-100 px-4 py-2.5 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-200 transition-colors disabled:opacity-50"
        >
          📧 Gmail connecté
          {loading && <span className="inline-block animate-spin">⟳</span>}
        </button>
      ) : (
        <button
          onClick={handleConnectGmail}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          📧 Connecter Gmail
          {loading && <span className="inline-block animate-spin">⟳</span>}
        </button>
      )}
    </div>
  );
};

export default GmailConnectButton;
