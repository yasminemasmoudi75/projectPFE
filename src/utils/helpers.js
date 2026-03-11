// Helper functions

/**
 * Format a date specifically for SQL Server DATETIME (no timezone)
 * Returns: YYYY-MM-DD HH:mm:ss.SSS
 */
const formatDateForMSSQL = (date) => {
    if (!date) return null;
    const d = (date instanceof Date) ? date : new Date(date);
    if (isNaN(d.getTime())) return null;

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
};

/**
 * Sanitize date values and return formatted string for MSSQL
 */
const sanitizeDate = (dateValue) => {
    if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === 'undefined') {
        return null;
    }
    return formatDateForMSSQL(dateValue);
};

module.exports = {
    formatDateForMSSQL,
    sanitizeDate
};

