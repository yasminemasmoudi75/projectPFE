import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ===========================
// FORMATAGE DES DATES
// ===========================

/**
 * Formate une date au format français
 * @param {string|Date} date - Date à formater
 * @param {string} formatStr - Format de sortie (défaut: 'dd/MM/yyyy')
 * @returns {string} Date formatée
 */
export const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr, { locale: fr });
  } catch (error) {
    console.error('Erreur formatage date:', error);
    return '-';
  }
};

/**
 * Formate une date et heure
 * @param {string|Date} date - Date à formater
 * @returns {string} Date et heure formatées
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Formate une heure
 * @param {string|Date} date - Date à formater
 * @returns {string} Heure formatée
 */
export const formatTime = (date) => {
  return formatDate(date, 'HH:mm');
};

/**
 * Formate une date relative (il y a X jours)
 * @param {string|Date} date - Date à formater
 * @returns {string} Date relative
 */
export const formatRelativeDate = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
  } catch (error) {
    console.error('Erreur formatage date relative:', error);
    return '-';
  }
};

// ===========================
// FORMATAGE DES MONTANTS
// ===========================

/**
 * Formate un montant en devise
 * @param {number} amount - Montant à formater
 * @param {string} currency - Code devise (défaut: 'TND')
 * @returns {string} Montant formaté
 */
export const formatCurrency = (amount, currency = 'TND') => {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(amount);
};

/**
 * Formate un nombre
 * @param {number} number - Nombre à formater
 * @param {number} decimals - Nombre de décimales (défaut: 2)
 * @returns {string} Nombre formaté
 */
export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined) return '-';
  
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur à formater (0-100)
 * @param {number} decimals - Nombre de décimales (défaut: 0)
 * @returns {string} Pourcentage formaté
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '-';
  
  return `${formatNumber(value, decimals)} %`;
};

// ===========================
// FORMATAGE DES NOMS
// ===========================

/**
 * Capitalise la première lettre
 * @param {string} str - Chaîne à capitaliser
 * @returns {string} Chaîne capitalisée
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formate un nom complet
 * @param {string} firstName - Prénom
 * @param {string} lastName - Nom
 * @returns {string} Nom complet formaté
 */
export const formatFullName = (firstName, lastName) => {
  const parts = [];
  if (firstName) parts.push(capitalize(firstName));
  if (lastName) parts.push(lastName.toUpperCase());
  return parts.join(' ') || '-';
};

/**
 * Obtient les initiales d'un nom
 * @param {string} name - Nom complet
 * @returns {string} Initiales (max 2 lettres)
 */
export const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

// ===========================
// FORMATAGE DES FICHIERS
// ===========================

/**
 * Formate une taille de fichier
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// ===========================
// FORMATAGE DES TÉLÉPHONES
// ===========================

/**
 * Formate un numéro de téléphone tunisien
 * @param {string} phone - Numéro de téléphone
 * @returns {string} Numéro formaté
 */
export const formatPhone = (phone) => {
  if (!phone) return '-';
  
  // Supprimer tous les caractères non numériques
  const cleaned = phone.replace(/\D/g, '');
  
  // Format: XX XXX XXX
  if (cleaned.length === 8) {
    return cleaned.replace(/(\d{2})(\d{3})(\d{3})/, '$1 $2 $3');
  }
  
  // Format avec indicatif: +216 XX XXX XXX
  if (cleaned.length === 11 && cleaned.startsWith('216')) {
    return cleaned.replace(/(\d{3})(\d{2})(\d{3})(\d{3})/, '+$1 $2 $3 $4');
  }
  
  return phone;
};

