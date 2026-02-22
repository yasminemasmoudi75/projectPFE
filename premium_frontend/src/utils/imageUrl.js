/**
 * Construit l'URL complète d'une image stockée sur le serveur
 * @param {string} imagePath - Le chemin relatif ou URL complète de l'image
 * @returns {string|null} L'URL complète accessible ou null si pas d'image
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
        return null;
    }

    // Si c'est déjà une URL complète (commence par http), la retourner telle quelle
    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    // Récupérer la base URL du serveur depuis l'environnement
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    
    // Extraire le protocole et le domaine (enlever /api)
    const baseUrl = apiUrl.replace('/api', '');

    // Nettoyer le chemin de l'image (enlever les / en double)
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    return `${baseUrl}${cleanPath}`;
};
