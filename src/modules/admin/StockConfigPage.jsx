import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  BellAlertIcon,
  TruckIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckIcon,
  XMarkIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_CONFIG = {
  autoriserVenteHorsStock: false,
  stockMinimumAlerte: 5,
  notificationsRupture: true,
  decrementationSur: { blv: true, factureDirecte: true },
};

const Toggle = ({ checked, onChange, colorOn = 'emerald' }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-13 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      checked
        ? colorOn === 'rose' ? 'bg-rose-500 focus:ring-rose-400' : 'bg-emerald-500 focus:ring-emerald-400'
        : 'bg-slate-200 focus:ring-slate-300'
    }`}
    style={{ width: '3.25rem' }}
  >
    <span
      className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

export default function StockConfigPage() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get('/config/stock')
      .then(res => {
        if (res?.data) setConfig({ ...DEFAULT_CONFIG, ...res.data });
      })
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
    } finally {
      setSaving(false);
    }
  };

  const set = (key, value) => setConfig(prev => ({ ...prev, [key]: value }));
  const setDecr = (key, value) =>
    setConfig(prev => ({ ...prev, decrementationSur: { ...prev.decrementationSur, [key]: value } }));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="h-10 w-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
        <p className="text-sm text-slate-400">Chargement de la configuration…</p>
      </div>
    );
  }

  const statusCards = [
    {
      label: 'Vente hors stock',
      value: config.autoriserVenteHorsStock ? 'Autorisée' : 'Bloquée',
      ok: !config.autoriserVenteHorsStock,
      icon: config.autoriserVenteHorsStock ? ExclamationTriangleIcon : ShieldCheckIcon,
    },
    {
      label: 'Seuil d\'alerte',
      value: `${config.stockMinimumAlerte} unités`,
      ok: config.stockMinimumAlerte > 0,
      icon: BellAlertIcon,
    },
    {
      label: 'Notifications',
      value: config.notificationsRupture ? 'Activées' : 'Désactivées',
      ok: config.notificationsRupture,
      icon: BellAlertIcon,
    },
    {
      label: 'Décrémentation',
      value: [
        config.decrementationSur?.blv && 'BLV',
        config.decrementationSur?.factureDirecte && 'FAV directe',
      ].filter(Boolean).join(' + ') || 'Aucune',
      ok: config.decrementationSur?.blv || config.decrementationSur?.factureDirecte,
      icon: TruckIcon,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 pb-16">

      {/* ── Hero Header ── */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200/60 flex-shrink-0">
              <CubeIcon className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Administration</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900">Paramètres du Stock</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Règles de gestion des ruptures, alertes et décrémentation automatique
              </p>
            </div>
          </div>

          {/* Status summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            {statusCards.map(card => (
              <div key={card.label} className={`rounded-xl px-4 py-3 border flex items-center gap-3 ${
                card.ok
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-amber-50 border-amber-100'
              }`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  card.ok ? 'bg-emerald-100' : 'bg-amber-100'
                }`}>
                  <card.icon className={`h-4 w-4 ${card.ok ? 'text-emerald-600' : 'text-amber-600'}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">{card.label}</p>
                  <p className={`text-xs font-bold truncate ${card.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{card.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 pt-8 space-y-5">

        {/* ── Carte 1 : Vente hors stock ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-amber-50/70 to-orange-50/30 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 flex items-center justify-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Autoriser la vente hors stock</h3>
              <p className="text-[11px] text-slate-500">Comportement lorsque la quantité demandée dépasse le stock disponible</p>
            </div>
          </div>
          <div className="px-6 py-6">
            {/* Toggle options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                {
                  val: false,
                  label: 'Bloquer la validation',
                  sublabel: 'Vente refusée si stock insuffisant',
                  icon: XMarkIcon,
                  activeClass: 'bg-slate-800 border-slate-800 text-white',
                  iconClass: 'text-white bg-slate-600',
                },
                {
                  val: true,
                  label: 'Autoriser (stock négatif)',
                  sublabel: 'Vente acceptée même si stock = 0',
                  icon: CheckIcon,
                  activeClass: 'bg-amber-500 border-amber-500 text-white',
                  iconClass: 'text-white bg-amber-400',
                },
              ].map(opt => {
                const active = config.autoriserVenteHorsStock === opt.val;
                return (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => set('autoriserVenteHorsStock', opt.val)}
                    className={`relative flex items-center gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                      active
                        ? opt.activeClass
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      active ? opt.iconClass : 'bg-slate-100'
                    }`}>
                      <opt.icon className={`h-5 w-5 ${active ? '' : 'text-slate-400'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className={`text-[11px] mt-0.5 ${active ? 'opacity-80' : 'text-slate-400'}`}>{opt.sublabel}</p>
                    </div>
                    {active && (
                      <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckIcon className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info contextuelle */}
            <div className={`rounded-xl p-4 flex gap-3 text-sm border ${
              config.autoriserVenteHorsStock
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}>
              <InformationCircleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1.5">
                {config.autoriserVenteHorsStock ? (
                  <>
                    <p className="font-bold text-amber-900">Vente hors stock activée</p>
                    <p className="text-[12px]">Le stock peut devenir négatif. Un badge <strong>Rupture de stock</strong> sera affiché sur le produit.</p>
                    <code className="block text-[11px] font-mono bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg">
                      Exemple : Stock = 2 · Vente = 5 → Stock après = −3
                    </code>
                  </>
                ) : (
                  <>
                    <p className="font-bold text-slate-700">Validation bloquée si stock insuffisant</p>
                    <p className="text-[12px]">Si la quantité dépasse le stock disponible, la création du BLV ou de la facture sera refusée.</p>
                    <code className="block text-[11px] font-mono bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                      Exemple : Stock = 2 · Demande = 5 → Création refusée
                    </code>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* ── Carte 2 : Stock minimum d'alerte ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/60 to-indigo-50/20 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center">
                <BellAlertIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Seuil d'alerte stock</h3>
                <p className="text-[11px] text-slate-500">Déclencher une alerte "Stock faible"</p>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center gap-3 mb-4">
                <button type="button"
                  onClick={() => set('stockMinimumAlerte', Math.max(0, config.stockMinimumAlerte - 1))}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold text-lg transition-all">
                  −
                </button>
                <input
                  type="number" min={0}
                  value={config.stockMinimumAlerte}
                  onChange={e => set('stockMinimumAlerte', Math.max(0, Number(e.target.value)))}
                  onFocus={e => e.target.select()}
                  className="w-20 h-10 text-center border-2 border-slate-200 rounded-xl text-base font-black text-blue-600 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button type="button"
                  onClick={() => set('stockMinimumAlerte', config.stockMinimumAlerte + 1)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-bold text-lg transition-all">
                  +
                </button>
                <span className="text-sm text-slate-500 font-medium">unités</span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 flex-shrink-0" />
                  <span>Alerte si <code className="bg-slate-100 px-1 rounded">Qte &lt; {config.stockMinimumAlerte}</code></span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                  <span>Rupture si <code className="bg-slate-100 px-1 rounded">Qte ≤ 0</code></span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Carte 3 : Notifications ── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/60 to-pink-50/20 flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-rose-100 flex items-center justify-center">
                <BellAlertIcon className="h-5 w-5 text-rose-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Notifications de rupture</h3>
                <p className="text-[11px] text-slate-500">Alertes dashboard & badge rouge</p>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {config.notificationsRupture ? 'Notifications activées' : 'Notifications désactivées'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {config.notificationsRupture
                      ? 'Badge rouge affiché à chaque rupture de stock'
                      : 'Aucune alerte visuelle pour les ruptures'}
                  </p>
                </div>
                <Toggle
                  checked={config.notificationsRupture}
                  onChange={val => set('notificationsRupture', val)}
                  colorOn="emerald"
                />
              </div>
              <div className={`rounded-xl px-4 py-3 flex items-center gap-3 border transition-colors ${
                config.notificationsRupture
                  ? 'bg-emerald-50 border-emerald-100'
                  : 'bg-slate-50 border-slate-100'
              }`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  config.notificationsRupture ? 'bg-emerald-100' : 'bg-slate-100'
                }`}>
                  {config.notificationsRupture
                    ? <CheckCircleIcon className="h-4 w-4 text-emerald-600" />
                    : <XMarkIcon className="h-4 w-4 text-slate-400" />
                  }
                </div>
                <p className={`text-[11px] font-semibold ${config.notificationsRupture ? 'text-emerald-700' : 'text-slate-400'}`}>
                  {config.notificationsRupture
                    ? 'Les administrateurs sont alertés en temps réel'
                    : 'Mode silencieux — aucune alerte'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Carte 4 : Décrémentation ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/60 to-teal-50/20 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <TruckIcon className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Décrémentation automatique du stock</h3>
              <p className="text-[11px] text-slate-500">Sur quel type de document le stock est-il diminué ?</p>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                {
                  key: 'blv',
                  label: 'Bon de Livraison (BLV)',
                  desc: 'Recommandé — déduit à la livraison physique. La facture générée depuis ce BLV ne décrémente pas une 2e fois.',
                  Icon: TruckIcon,
                  color: 'emerald',
                },
                {
                  key: 'factureDirecte',
                  label: 'Facture directe (sans BLV)',
                  desc: 'Pour les factures créées sans bon de livraison préalable.',
                  Icon: DocumentTextIcon,
                  color: 'blue',
                },
              ].map(opt => {
                const active = config.decrementationSur[opt.key];
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setDecr(opt.key, !active)}
                    className={`relative flex items-start gap-4 px-5 py-4 rounded-xl border-2 text-left transition-all ${
                      active
                        ? opt.color === 'emerald'
                          ? 'bg-emerald-50 border-emerald-400'
                          : 'bg-blue-50 border-blue-400'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      active
                        ? opt.color === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100'
                        : 'bg-slate-100'
                    }`}>
                      <opt.Icon className={`h-5 w-5 ${
                        active
                          ? opt.color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'
                          : 'text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${active ? (opt.color === 'emerald' ? 'text-emerald-800' : 'text-blue-800') : 'text-slate-700'}`}>
                          {opt.label}
                        </p>
                        {active && (
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            opt.color === 'emerald'
                              ? 'bg-emerald-200 text-emerald-700'
                              : 'bg-blue-200 text-blue-700'
                          }`}>Actif</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{opt.desc}</p>
                    </div>
                    <div className={`absolute top-3 right-3 h-5 w-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      active
                        ? opt.color === 'emerald' ? 'bg-emerald-500 border-emerald-500' : 'bg-blue-500 border-blue-500'
                        : 'bg-white border-slate-300'
                    }`}>
                      {active && <CheckIcon className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>
        </div>

        {/* ── Bouton Enregistrer ── */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <p className="text-xs text-slate-400">
            Les modifications s'appliquent immédiatement à tous les nouveaux documents.
          </p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200/50 transition-all"
          >
            {saving ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircleIcon className="h-4 w-4" />
            )}
            {saving ? 'Enregistrement…' : 'Enregistrer les paramètres'}
          </button>
        </div>

      </div>
    </div>
  );
}
