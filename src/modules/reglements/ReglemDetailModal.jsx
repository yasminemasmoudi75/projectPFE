import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon, DocumentTextIcon, UserIcon, CalendarIcon,
  BanknotesIcon, CheckCircleIcon, ClockIcon, CreditCardIcon,
} from '@heroicons/react/24/outline';
import axios from '../../app/axios';
import { formatDate, formatCurrency } from '../../utils/format';

const toDateOnly = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const STATUS_CFG = {
  'Payé':               { dot: 'bg-emerald-400', badge: 'bg-emerald-50 text-emerald-600 border border-emerald-200', bar: '#34d399' },
  'Presque payé':       { dot: 'bg-slate-400',   badge: 'bg-slate-100 text-slate-600 border border-slate-200',     bar: '#94a3b8' },
  'Partiellement payé': { dot: 'bg-amber-400',   badge: 'bg-amber-50 text-amber-600 border border-amber-200',      bar: '#fbbf24' },
  'Non payé':           { dot: 'bg-rose-400',    badge: 'bg-rose-50 text-rose-500 border border-rose-200',         bar: '#fb7185' },
};
const getCfg = (s) => STATUS_CFG[s] || { dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 border border-slate-200', bar: '#e2e8f0' };

/* ── Info cell ── */
const InfoCell = ({ label, value, mono = false }) => (
  <div>
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
    <p className={`text-sm font-semibold text-slate-700 ${mono ? 'font-mono' : ''}`}>{value || '—'}</p>
  </div>
);

const ReglemDetailModal = ({ isOpen, onClose, reglementId }) => {
  const [reglement, setReglement] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const fetchReglemDetail = useCallback(async () => {
    if (!reglementId) return;
    try {
      setLoading(true); setError('');
      const response = await axios.get(`/reglements/${reglementId}`);
      const data = response.data?.data || response.data;
      if (data?.id) setReglement(data);
      else setError('Structure de données invalide reçue du serveur');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur lors du chargement des détails');
    } finally { setLoading(false); }
  }, [reglementId]);

  useEffect(() => {
    if (isOpen && reglementId) fetchReglemDetail();
    else { setReglement(null); setError(''); }
  }, [isOpen, reglementId, fetchReglemDetail]);

  if (!isOpen) return null;

  const cfg = reglement ? getCfg(reglement.paymentStatus) : null;
  const pct = reglement && reglement.totalAmount > 0
    ? Math.min(100, Math.round((reglement.paidAmount / reglement.totalAmount) * 100)) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 16 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-none">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    <DocumentTextIcon className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">Détails du Règlement</h2>
                    {reglement && (
                      <p className="text-[11px] text-slate-400 font-mono">#{reglement.id}</p>
                    )}
                  </div>
                </div>
                <button onClick={onClose}
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* ── Content ── */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="relative h-10 w-10">
                      <div className="absolute inset-0 rounded-full border-[3px] border-slate-100" />
                      <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-400 animate-spin" />
                    </div>
                    <p className="text-sm text-slate-400">Chargement…</p>
                  </div>
                ) : error ? (
                  <div className="p-6">
                    <div className="bg-rose-50 border border-rose-200 text-rose-600 px-4 py-3 rounded-xl text-sm">{error}</div>
                  </div>
                ) : reglement ? (
                  <div className="p-6 space-y-5">

                    {/* Client + Date */}
                    <div className="bg-slate-50/60 border border-slate-100 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Client</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <InfoCell label="Nom client"  value={reglement.client} />
                        <InfoCell label="Code client" value={reglement.codTiers} mono />
                        <InfoCell label="Date règlement" value={formatDate(toDateOnly(reglement.date))} />
                        <div className="flex items-end">
                          {cfg && (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${cfg.badge}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                              {reglement.paymentStatus || (reglement.isPayed ? 'Payé' : 'Non payé')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Financial summary */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <div className="bg-slate-50/60 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                        <BanknotesIcon className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Résumé financier</span>
                      </div>
                      <div className="p-4 space-y-3">
                        {[
                          { label: 'Total à recevoir', value: formatCurrency(reglement.totalAmount),    valueClass: 'text-slate-700' },
                          { label: 'Montant payé',     value: formatCurrency(reglement.paidAmount),     valueClass: 'text-emerald-600' },
                          { label: 'Restant',          value: formatCurrency(reglement.remainingAmount), valueClass: 'text-amber-600' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">{row.label}</span>
                            <span className={`text-base font-bold tabular-nums ${row.valueClass}`}>{row.value}</span>
                          </div>
                        ))}
                        {/* Progress */}
                        <div className="pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Progression</span>
                            <span className="text-xs font-bold text-slate-600 tabular-nums">{pct}%</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 1, ease: 'easeOut' }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: cfg?.bar || '#34d399' }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment details table */}
                    {reglement.details && reglement.details.length > 0 && (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="bg-slate-50/60 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                          <CreditCardIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Détails des paiements</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                {['Référence', 'Mode', 'Banque', 'Montant', 'Crédit', 'Date valeur', 'Détail'].map((h, i) => (
                                  <th key={i}
                                    className={`px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${[3, 4].includes(i) ? 'text-right' : i === 5 ? 'text-center' : 'text-left'}`}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {reglement.details.map(d => (
                                <tr key={d.ID} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-3 py-2.5 text-xs font-mono text-slate-600">{d.NumPieceReg || '—'}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="inline-flex px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                      {d.ModReg || 'ESPECE'}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-xs text-slate-500">{d.Banque || '—'}</td>
                                  <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 tabular-nums">{formatCurrency(d.Montant)}</td>
                                  <td className="px-3 py-2.5 text-right text-xs font-semibold text-emerald-600 tabular-nums">{formatCurrency(d.MntCredit)}</td>
                                  <td className="px-3 py-2.5 text-center text-xs text-slate-500">{formatDate(toDateOnly(d.DatValeur))}</td>
                                  <td className="px-3 py-2.5 text-xs text-slate-500">{d.DetPieceReg || '—'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Linked pieces */}
                    {reglement.pieces && reglement.pieces.length > 0 && (
                      <div className="border border-slate-200 rounded-2xl overflow-hidden">
                        <div className="bg-slate-50/60 px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                          <DocumentTextIcon className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Pièces liées</span>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100">
                                {['Numéro', 'Type', 'Montant', 'Solde'].map((h, i) => (
                                  <th key={i}
                                    className={`px-3 py-2.5 text-[10px] font-semibold text-slate-400 uppercase tracking-widest ${i >= 2 ? 'text-right' : 'text-left'}`}>
                                    {h}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {reglement.pieces.map(p => (
                                <tr key={p.ID} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">{p.NumPiece}</td>
                                  <td className="px-3 py-2.5">
                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">{p.TypPiece}</span>
                                  </td>
                                  <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 tabular-nums">{formatCurrency(p.MntPiece)}</td>
                                  <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-600 tabular-nums">{formatCurrency(p.Solde)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-4 pt-1 pb-1">
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <UserIcon className="h-3 w-3" />
                        Créé par <span className="font-semibold text-slate-500">{reglement.createdBy || '—'}</span>
                      </div>
                      <div className="h-3 w-px bg-slate-200" />
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <CalendarIcon className="h-3 w-3" />
                        <span className="font-semibold text-slate-500">{formatDate(toDateOnly(reglement.createdDate))}</span>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="h-14 w-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                      <DocumentTextIcon className="h-7 w-7 text-slate-300" />
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
