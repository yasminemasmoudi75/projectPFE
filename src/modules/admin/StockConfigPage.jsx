import { useState, useEffect } from 'react';
import axios from '../../app/axios';
import toast from 'react-hot-toast';
import {
  CheckIcon, ArrowPathIcon, CubeIcon,
  ExclamationTriangleIcon, BellIcon, TruckIcon, ShieldExclamationIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_CONFIG = {
  autoriserVenteHorsStock: false,
  stockMinimumAlerte: 5,
  notificationsRupture: true,
  decrementationSur: { blv: true, factureDirecte: true },
};

const Toggle = ({ checked, onChange }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? 'bg-[#0062AF]' : 'bg-slate-200'}`}>
    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
  </button>
);

const CheckRow = ({ checked, onChange, label, sublabel }) => (
  <button type="button" onClick={() => onChange(!checked)}
    className="flex items-start gap-3 text-left w-full group py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors">
    <div className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-colors ${checked ? 'bg-[#0062AF] border-[#0062AF]' : 'bg-white border-slate-300 group-hover:border-[#0062AF]/50'}`}>
      {checked && <CheckIcon className="h-3 w-3 text-white stroke-[3]" />}
    </div>
    <div className="min-w-0 flex-1">
      <p className={`text-sm font-semibold ${checked ? 'text-slate-800' : 'text-slate-600'}`}>{label}</p>
      {sublabel && <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{sublabel}</p>}
    </div>
    {checked && (
      <span className="flex-shrink-0 text-[10px] font-bold text-[#0062AF] bg-[#e8f1f9] border border-blue-200 px-2 py-0.5 rounded-full mt-0.5">Actif</span>
    )}
  </button>
);

const Section = ({ icon: Icon, title, subtitle, badge, children }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
      <div className="h-8 w-8 rounded-xl bg-[#0062AF] flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-800">{title}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {badge}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

export default function StockConfigPage() {
  const [config, setConfig]   = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

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

  const set     = (key, val) => setConfig(p => ({ ...p, [key]: val }));
  const setDecr = (key, val) => setConfig(p => ({ ...p, decrementationSur: { ...p.decrementationSur, [key]: val } }));

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="relative h-10 w-10">
        <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
        <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0062AF] animate-spin" />
      </div>
      <p className="text-sm text-slate-400">Chargement…</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto pb-16 space-y-5">

      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#0062AF] flex items-center justify-center flex-shrink-0">
            <CubeIcon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900">Configuration du Stock</h1>
            <p className="text-xs text-slate-400 mt-0.5">Paramètres appliqués aux BLV et factures</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#e8f1f9] text-[#0062AF] border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0062AF]" />
          Admin
        </span>
      </div>

      {/* 1. Vente hors stock */}
      <Section
        icon={ShieldExclamationIcon}
        title="Vente hors stock"
        subtitle="Comportement lorsque le stock est insuffisant"
        badge={
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${
            config.autoriserVenteHorsStock
              ? 'bg-amber-50 text-amber-700 border-amber-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
          }`}>
            {config.autoriserVenteHorsStock ? 'Autorisée' : 'Bloquée'}
          </span>
        }
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700">Autoriser la vente hors stock</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Valider un BLV ou une facture même si le stock est insuffisant — le stock devient négatif.
            </p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 bg-slate-100 p-1 rounded-xl">
            <button type="button" onClick={() => set('autoriserVenteHorsStock', true)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${config.autoriserVenteHorsStock ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              OUI
            </button>
            <button type="button" onClick={() => set('autoriserVenteHorsStock', false)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${!config.autoriserVenteHorsStock ? 'bg-white text-[#0062AF] shadow-sm border border-blue-200' : 'text-slate-400 hover:text-slate-600'}`}>
              NON
            </button>
          </div>
        </div>
        <div className={`mt-4 rounded-xl px-4 py-3 flex items-start gap-3 ${config.autoriserVenteHorsStock ? 'bg-amber-50 border border-amber-200' : 'bg-slate-50 border border-slate-200'}`}>
          <ExclamationTriangleIcon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${config.autoriserVenteHorsStock ? 'text-amber-500' : 'text-slate-400'}`} />
          <p className={`text-xs leading-relaxed ${config.autoriserVenteHorsStock ? 'text-amber-700' : 'text-slate-500'}`}>
            {config.autoriserVenteHorsStock
              ? <><strong>Cas 2 activé :</strong> le stock peut devenir négatif. Badge « Rupture » affiché + notification admin déclenchée.</>
              : <><strong>Cas 1 activé :</strong> la validation est bloquée si le stock est insuffisant. Aucun stock négatif possible.</>}
          </p>
        </div>
      </Section>

      {/* 2. Seuil d'alerte */}
      <Section
        icon={ExclamationTriangleIcon}
        title="Seuil d'alerte critique"
        subtitle="En dessous de ce seuil, une alerte est déclenchée sur le dashboard"
      >
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Quantité minimale</p>
            <div className="flex items-center gap-2">
              <input type="number" min={0}
                value={config.stockMinimumAlerte}
                onChange={e => set('stockMinimumAlerte', Math.max(0, Number(e.target.value)))}
                onFocus={e => e.target.select()}
                className="w-24 px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0062AF] focus:ring-2 focus:ring-[#0062AF]/10 transition-all text-center"
              />
              <span className="text-sm font-medium text-slate-400">unités</span>
            </div>
          </div>
          <div className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500 leading-relaxed">
              Tout produit avec un stock ≤ <strong className="text-slate-700">{config.stockMinimumAlerte}</strong> unité{config.stockMinimumAlerte !== 1 ? 's' : ''} déclenchera une alerte <strong className="text-rose-600">Critique</strong>.
            </p>
          </div>
        </div>
      </Section>

      {/* 3. Notifications */}
      <Section
        icon={BellIcon}
        title="Notifications de rupture"
        subtitle="Badge rouge + alerte dashboard lorsque le stock est épuisé"
        badge={<Toggle checked={config.notificationsRupture} onChange={val => set('notificationsRupture', val)} />}
      >
        <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${config.notificationsRupture ? 'bg-[#e8f1f9] border border-blue-200' : 'bg-slate-50 border border-slate-200'}`}>
          <BellIcon className={`h-4 w-4 flex-shrink-0 ${config.notificationsRupture ? 'text-[#0062AF]' : 'text-slate-300'}`} />
          <p className={`text-xs ${config.notificationsRupture ? 'text-[#0062AF]' : 'text-slate-400'}`}>
            {config.notificationsRupture ? 'Notifications activées.' : 'Notifications désactivées.'}
          </p>
        </div>
      </Section>

      {/* 4. Décrémentation */}
      <Section
        icon={TruckIcon}
        title="Décrémentation du stock"
        subtitle="Choisissez à quel moment le stock est diminué"
      >
        <div className="divide-y divide-slate-100 -mx-1">
          <CheckRow
            checked={config.decrementationSur.blv}
            onChange={val => setDecr('blv', val)}
            label="Validation du Bon de Livraison (BLV)"
            sublabel="Recommandé — stock déduit à la livraison physique"
          />
          <CheckRow
            checked={config.decrementationSur.factureDirecte}
            onChange={val => setDecr('factureDirecte', val)}
            label="Validation de la Facture directe (sans BLV)"
            sublabel="Pour les factures créées sans bon de livraison préalable"
          />
        </div>
      </Section>

      {/* Save */}
      <div className="flex justify-end">
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-2 h-9 px-6 bg-[#0062AF] hover:bg-[#004a85] disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-sm shadow-[#0062AF]/20 transition-all">
          {saving
            ? <><ArrowPathIcon className="h-4 w-4 animate-spin" /> Enregistrement…</>
            : <><CheckIcon className="h-4 w-4" /> Enregistrer</>}
        </button>
      </div>

    </div>
  );
}
