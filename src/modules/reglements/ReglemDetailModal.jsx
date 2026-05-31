import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon, DocumentTextIcon, UserIcon, CalendarIcon,
  BanknotesIcon, CreditCardIcon,
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatDate } from '../../utils/format';

const toDateOnly = (value) => {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmt = (n) =>
  (n || 0).toLocaleString('fr-TN', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' DT';

const STATUS_CFG = {
  'Payé':               { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200', bar: '#34d399' },
  'Presque payé':       { dot: 'bg-sky-400',     badge: 'bg-sky-50 text-sky-700 border border-sky-200',            bar: '#38bdf8' },
  'Partiellement payé': { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-700 border border-amber-200',      bar: '#fbbf24' },
  'Non payé':           { dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-600 border border-rose-200',         bar: '#fb7185' },
};
const getCfg = (s) =>
  STATUS_CFG[s] || { dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border border-slate-200', bar: '#e2e8f0' };

/* ── Section divider label ── */
const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-2 py-2 border-t border-slate-100">
    <Icon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
  </div>
);

/* ── Info field ── */
const Field = ({ label, value, mono = false }) => (
  <div>
    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={`text-sm font-semibold text-slate-800 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
  </div>
);

const ReglemDetailModal = ({ isOpen, onClose, reglementId }) => {
  const [reglement, setReglement] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const fetchDetail = useCallback(async () => {
    if (!reglementId) return;
    try {
      setLoading(true); setError('');
      const res = await axios.get(`/reglements/${reglementId}`);
      const data = res.data?.data || res.data;
      if (data?.id) setReglement(data);
      else setError('Données invalides reçues du serveur');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur de chargement');
    } finally { setLoading(false); }
  }, [reglementId]);

  useEffect(() => {
    if (isOpen && reglementId) fetchDetail();
    else { setReglement(null); setError(''); }
  }, [isOpen, reglementId, fetchDetail]);

  if (!isOpen) return null;

  const cfg = reglement ? getCfg(reglement.paymentStatus) : null;
  const pct = reglement && reglement.totalAmount > 0
    ? Math.min(100, Math.round((reglement.paidAmount / reglement.totalAmount) * 100)) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col"
            >
              {/* ── Header ── */}
              <div className="flex items-start justify-between px-5 pt-5 pb-4 flex-none">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <DocumentTextIcon className="h-4.5 w-4.5 text-slate-500" style={{ height: '1.1rem', width: '1.1rem' }} />
                  </div>
                  <div>
                    <h2 className="text-[15px] font-bold text-slate-900 leading-tight">Détails du Règlement</h2>
                    {reglement && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">#{reglement.id}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="h-7 w-7 flex items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex-shrink-0 mt-0.5"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* ── Content ── */}
              <div className="overflow-y-auto flex-1 px-5 pb-5">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="relative h-10 w-10">
                      <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
                      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#0062AF] animate-spin" />
                    </div>
                    <p className="text-xs text-slate-400">Chargement…</p>
                  </div>
                ) : error ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">{error}</div>
                ) : reglement ? (
                  <div className="space-y-4">

                    {/* ── Client info ── flat grid, no card ── */}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 pt-1">
                      <Field label="Nom client"     value={reglement.client} />
                      <Field label="Code client"    value={reglement.codTiers} mono />
                      <div>
                        <Field label="Date règlement" value={formatDate(toDateOnly(reglement.date))} />
                      </div>
                      <div className="flex items-end pb-0.5">
                        {cfg && (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${cfg.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {reglement.paymentStatus || (reglement.isPayed ? 'Payé' : 'Non payé')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Résumé financier ── */}
                    <SectionLabel icon={BanknotesIcon} label="Résumé financier" />

                    {/* 3 colored KPI boxes */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-base font-black text-slate-800 tabular-nums">{fmt(reglement.totalAmount)}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Payé</p>
                        <p className="text-base font-black text-emerald-600 tabular-nums">{fmt(reglement.paidAmount)}</p>
                      </div>
                      <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                        <p className="text-[9px] font-bold text-amber-500 uppercase tracking-widest mb-1">Restant</p>
                        <p className="text-base font-black text-amber-500 tabular-nums">{fmt(reglement.remainingAmount)}</p>
                      </div>
                    </div>

                    {/* Progression */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Progression</span>
                        <span className="text-[10px] font-bold text-slate-500 tabular-nums">{pct}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: cfg?.bar || '#34d399' }}
                        />
                      </div>
                    </div>

                    {/* ── Détails des paiements ── */}
                    {reglement.details && reglement.details.length > 0 && (
                      <>
                        <SectionLabel icon={CreditCardIcon} label="Détails des paiements" />
                        <div className="-mx-5 overflow-x-auto">
                          <table className="w-full text-sm min-w-[500px]">
                            <thead>
                              <tr className="border-b border-slate-100">
                                {[
                                  ['Référence',   'text-left'],
                                  ['Mode',        'text-left'],
                                  ['Banque',      'text-left'],
                                  ['Montant',     'text-right'],
                                  ['Crédit',      'text-right'],
                                  ['Date valeur', 'text-center'],
                                  ['Détail',      'text-left'],
                                ].map(([h, cls], i) => (
                                  <th key={i} className={`px-5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest ${cls}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {reglement.details.map((d, i) => (
                                <tr key={d.ID || i} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-5 py-3 text-xs font-mono text-slate-500">{d.NumPieceReg || '—'}</td>
                                  <td className="px-5 py-3">
                                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                      {d.ModReg || 'ESPECE'}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-xs text-slate-500">{d.Banque || '—'}</td>
                                  <td className="px-5 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">{fmt(d.Montant)}</td>
                                  <td className="px-5 py-3 text-right text-xs font-bold text-emerald-600 tabular-nums">{fmt(d.MntCredit)}</td>
                                  <td className="px-5 py-3 text-center text-xs text-slate-500">{formatDate(toDateOnly(d.DatValeur))}</td>
                                  <td className="px-5 py-3 text-xs text-slate-500">{d.DetPieceReg || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* ── Pièces liées ── */}
                    {reglement.pieces && reglement.pieces.length > 0 && (
                      <>
                        <SectionLabel icon={DocumentTextIcon} label="Pièces liées" />
                        <div className="-mx-5 overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100">
                                {[
                                  ['Numéro',  'text-left'],
                                  ['Type',    'text-left'],
                                  ['Montant', 'text-right'],
                                  ['Solde',   'text-right'],
                                ].map(([h, cls], i) => (
                                  <th key={i} className={`px-5 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest ${cls}`}>{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {reglement.pieces.map((p, i) => (
                                <tr key={p.ID || i} className="hover:bg-slate-50/60 transition-colors">
                                  <td className="px-5 py-3 text-xs font-semibold text-slate-800">{p.NumPiece}</td>
                                  <td className="px-5 py-3">
                                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                      {p.TypPiece}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">{fmt(p.MntPiece)}</td>
                                  <td className="px-5 py-3 text-right text-xs font-semibold text-slate-700 tabular-nums">{fmt(p.Solde)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {/* ── Footer meta ── */}
                    <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <UserIcon className="h-3.5 w-3.5" />
                        <span>Créé par</span>
                        <span className="font-semibold text-slate-600">{reglement.createdBy || '—'}</span>
                      </div>
                      <div className="h-3 w-px bg-slate-200" />
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span className="font-semibold text-slate-600">{formatDate(toDateOnly(reglement.createdDate))}</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <DocumentTextIcon className="h-6 w-6 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ReglemDetailModal;
