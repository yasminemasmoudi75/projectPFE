/**
 * Construit l'URL complète d'une image stockée sur le serveur
 * @param {string} imagePath - Le chemin relatif ou URL complète de l'image
 * @returns {string|null} L'URL complète accessible ou null si pas d'image
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath || typeof imagePath !== 'string' || imagePath.trim() === '') {
        return null;
    }

    if (imagePath.startsWith('http')) {
        return imagePath;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3066/api';
    const baseUrl = apiUrl.replace('/api', '');

    // Normalise les backslashes Windows et extrait la partie /uploads/...
    let normalized = imagePath.replace(/\\/g, '/');

    // Si c'est un chemin absolu Windows (ex: C:/...uploads/products/file.jpg)
    const uploadsIdx = normalized.indexOf('/uploads/');
    if (uploadsIdx > 0) {
        normalized = normalized.slice(uploadsIdx);
    }

    const cleanPath = normalized.startsWith('/') ? normalized : `/${normalized}`;

    return `${baseUrl}${cleanPath}`;
};
