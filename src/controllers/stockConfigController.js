const path = require('path');
const fs = require('fs').promises;

const CONFIG_FILE = path.join(__dirname, '../../data/stockConfig.json');

const DEFAULT_CONFIG = {
    autoriserVenteHorsStock: false,
    stockMinimumAlerte: 5,
    notificationsRupture: true,
    decrementationSur: { blv: true, factureDirecte: true },
};

async function ensureConfigFile() {
    try {
        await fs.access(CONFIG_FILE);
    } catch {
        await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
        await fs.writeFile(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
    }
}

exports.getConfig = async (req, res, next) => {
    try {
        await ensureConfigFile();
        const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
        const config = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
        return res.status(200).json({ status: 'success', data: config });
    } catch (error) {
        console.error('❌ getConfig error:', error);
        next(error);
    }
};

exports.updateConfig = async (req, res, next) => {
    try {
        await ensureConfigFile();
        const raw = await fs.readFile(CONFIG_FILE, 'utf-8');
        const current = { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
        const updated = {
            ...current,
            ...req.body,
            decrementationSur: {
                ...current.decrementationSur,
                ...(req.body.decrementationSur || {}),
            },
        };
        await fs.writeFile(CONFIG_FILE, JSON.stringify(updated, null, 2), 'utf-8');
        return res.status(200).json({ status: 'success', data: updated });
    } catch (error) {
        console.error('❌ updateConfig error:', error);
        next(error);
    }
};
