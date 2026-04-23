/**
 * documentHelper.js
 * Centralized logic for handling document master and detail data (Devis, BCV, BLV, FAV)
 */

/**
 * Helper function to parse dates for SQL Server through Sequelize
 */
const parseDateValue = (dateValue) => {
    if (!dateValue || dateValue === '' || dateValue === 'null' || dateValue === null || dateValue === undefined) {
        return null;
    }

    try {
        let date;
        if (dateValue instanceof Date) {
            date = dateValue;
        } else {
            // Remove timezone offset before parsing (SQL Server DATETIME doesn't support it)
            const cleaned = String(dateValue).replace(/([+-]\d{2}:\d{2}|Z)$/, '').trim();
            date = new Date(cleaned);
        }

        if (isNaN(date.getTime())) {
            console.warn('⚠️  Invalid date value received:', dateValue);
            return null;
        }

        return date;
    } catch (e) {
        console.warn('⚠️  Error parsing date:', dateValue, e.message);
        return null;
    }
};

/**
 * Helper function to sanitize master data for any document type
 */
const sanitizeMasterData = (masterData) => {
    const sanitized = { ...masterData };

    // Remove computed/virtual columns that shouldn't be sent to DB
    delete sanitized.NetHT;

    // Do not send audit dates through Sequelize for legacy DATETIME columns to avoid timezone issues.
    // They are usually handled by SQL Server defaults or explicit literal(GETDATE())
    // We only delete them if they are NOT Sequelize literals
    if (sanitized.DatUser && typeof sanitized.DatUser !== 'object') {
        delete sanitized.DatUser;
    }
    if (sanitized.DatCreateUser && typeof sanitized.DatCreateUser !== 'object') {
        delete sanitized.DatCreateUser;
    }

    // Parse and validate common date fields
    const dateFields = ['MDate', 'DatLiv', 'DatImp'];
    dateFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            const val = sanitized[field];
            if (!val || val === '' || val === 'null' || val === null) {
                sanitized[field] = null;
            } else {
                const parsed = parseDateValue(val);
                sanitized[field] = parsed || null;
            }
        }
    });

    // Ensure numeric fields are valid
    const numericFields = ['TotHT', 'TotTva', 'TotTTC', 'TotRem', 'Frais', 'Timbre', 'avanceforf', 'MntDebit', 'MntCredit'];
    numericFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            const num = parseFloat(sanitized[field]);
            sanitized[field] = isNaN(num) ? 0 : num;
        }
    });

    // Ensure boolean fields are valid
    const booleanFields = ['Valid', 'bTransf', 'bLivr', 'IsConverted'];
    booleanFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            sanitized[field] = !!sanitized[field];
        }
    });

    return sanitized;
};

/**
 * Helper function to sanitize detail data for any document type
 */
const sanitizeDetailData = (detail) => {
    const sanitized = { ...detail };

    // Remove auto-generated or computed columns
    delete sanitized.NoDetail;
    delete sanitized.Guid;

    // SQL Server often computes these, but if they are sent, they must be valid numbers
    const numericFields = ['Qt', 'PuHT', 'PuTTC', 'MntRem', 'MntTVA', 'MntHT', 'MntFodec'];
    numericFields.forEach(field => {
        if (sanitized.hasOwnProperty(field)) {
            const num = parseFloat(sanitized[field]);
            sanitized[field] = isNaN(num) ? 0 : num;
        }
    });

    return sanitized;
};

module.exports = {
    parseDateValue,
    sanitizeMasterData,
    sanitizeDetailData
};
