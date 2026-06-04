const path = require('path');
const fs = require('fs').promises;

const CONFIG_FILE = path.join(__dirname, '../../data/stockConfig.json');

/**
 * Retourne true si le stock doit être contrôlé (création bloquée si insuffisant).
 * Lit uniquement stockConfig.json.
 *
 * autoriserVenteHorsStock = false → bloquer TOUT LE MONDE (admin inclus) → retourne true
 * autoriserVenteHorsStock = true  → autoriser (stock peut devenir négatif)  → retourne false
 */
async function getStockControlForRole(userRole) {
    try {
        const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
        const config = JSON.parse(raw);
        const autorise = typeof config.autoriserVenteHorsStock === 'boolean'
            ? config.autoriserVenteHorsStock
            : false;
        // false = NON = bloquer tout le monde, admin compris
        return !autorise;
    } catch {
        return true; // par défaut : bloquer si fichier illisible
    }
}

module.exports = { getStockControlForRole };
