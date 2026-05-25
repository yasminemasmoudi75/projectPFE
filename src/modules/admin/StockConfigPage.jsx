import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import { CheckIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const DEFAULT_CONFIG = {
  autoriserVenteHorsStock: false,
  stockMinimumAlerte: 5,
  notificationsRupture: true,
  decrementationSur: { blv: true, factureDirecte: true },
};

/* ── Blue toggle ── */
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    style={{ width: '3.25rem' }}
    className={`relative inline-flex h-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
      checked ? 'bg-blue-600' : 'bg-slate-200'
    }`}
  >
    <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
      checked ? 'translate-x-6' : 'translate-x-0'
    }`} />
  </button>
);

/* ── Checkbox row ── */
const CheckRow = ({ checked, onChange, label, sublabel }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className="flex items-start gap-3 text-left w-full group"
  >
    <div className={`mt-0.5 h-5 w-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-colors ${
      checked ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300 group-hover:border-blue-400'
    }`}>
      {checked && <CheckIcon className="h-3 w-3 text-white stroke-[3]" />}
    </div>
    <div>
      <p className={`text-sm font-semibold ${checked ? 'text-slate-800' : 'text-slate-500'}`}>{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>}
    </div>
  </button>
);

export default function StockConfigPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/config/stock')
      .then(res => { if (res?.data) setConfig({ ...DEFAULT_CONFIG, ...res.data }); })
      .catch(() => toast.error('Impossible de charger la configuration stock'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put('/config/stock', config);
      toast.success('Paramètres stock enregistrés');
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally { setSaving(false); }
  };

  const set = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const setDecr = (key, value) =>
    setConfig(prev => ({ ...prev, decrementationSur: { ...prev.decrementationSur, [key]: value } }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="h-8 w-8 rounded-full border-[3px] border-blue-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-16">

      {/* ── Page title ── */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800">Configuration → Stock</h2>
        <p className="text-sm text-slate-500 mt-1">
          Ces paramètres s'appliquent à tous les documents (BLV, Factures) qui impactent le stock.
        </p>
      </div>

      <div className="space-y-4">

        {/* ── 1. Vente hors stock ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">Autoriser la vente hors stock</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Valider un BLV ou une facture même si le stock est insuffisant (stock devient négatif)
              </p>
            </div>
            {/* OUI / NON */}
            <div className="flex items-center gap-1 flex-shrink-0 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => set('autoriserVenteHorsStock', true)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  config.autoriserVenteHorsStock
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >OUI</button>
              <button
                type="button"
                onClick={() => set('autoriserVenteHorsStock', false)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                  !config.autoriserVenteHorsStock
                    ? 'bg-white text-slate-700 shadow-sm border border-slate-200'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >NON</button>
            </div>
          </div>

          {/* Info contextuelle */}
          {config.autoriserVenteHorsStock ? (
            <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs text-amber-700 leading-relaxed">
                <strong>Cas 2 activé :</strong> le stock peut devenir négatif. Badge « Rupture de stock » affiché + notification admin déclenchée.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong>Cas 1 activé :</strong> la validation est bloquée si le stock est insuffisant. Aucun stock négatif possible.
              </p>
            </div>
          )}
        </div>

        {/* ── 2. Stock minimum d'alerte ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-800">Stock minimum d'alerte</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">
            Seuil en dessous duquel une alerte « Critique » est déclenchée
          </p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={config.stockMinimumAlerte}
              onChange={e => set('stockMinimumAlerte', Math.max(0, Number(e.target.value)))}
              onFocus={e => e.target.select()}
              className="w-28 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
            <span className="text-sm text-slate-400">unités</span>
          </div>
        </div>

        {/* ── 3. Notifications ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Notifications de rupture {config.notificationsRupture ? 'activées' : 'désactivées'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Badge rouge + alerte dashboard lorsque le stock est épuisé ou négatif
              </p>
            </div>
            <Toggle
              checked={config.notificationsRupture}
              onChange={val => set('notificationsRupture', val)}
            />
          </div>
        </div>

        {/* ── 4. Décrémentation ── */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <p className="text-sm font-bold text-slate-800">Décrémentation du stock sur</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-5">
            Choisissez à quel moment le stock est diminué
          </p>
          <div className="space-y-4">
            <CheckRow
              checked={config.decrementationSur.blv}
              onChange={val => setDecr('blv', val)}
              label="Validation du Bon de Livraison (BLV)"
              sublabel="Recommandé — stock déduit à la livraison physique"
            />
            <CheckRow
              checked={config.decrementationSur.factureDirecte}
              onChange={val => setDecr('factureDirecte', val)}
              label="Validation de la Facture directe (FV sans BLV)"
              sublabel="Pour les factures créées sans BLV préalable"
            />
          </div>
        </div>

        {/* ── Save ── */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-7 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors"
        >
          {saving && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
          {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>

      </div>
    </div>
  );
}
