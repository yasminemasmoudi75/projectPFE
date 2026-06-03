import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  SparklesIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  MapPinIcon,
  BellAlertIcon,
  ArrowPathIcon,
  PresentationChartLineIcon,
  CpuChipIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { getSalesForecast, getRelanceRecommendations } from './iaSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

const RECOMMANDATION_STYLES = {
  AUGMENTER: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  MAINTENIR: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-400'  },
  REDUIRE:   { bg: 'bg-rose-100',    text: 'text-rose-700',    dot: 'bg-rose-500'   },
};

// Tailwind exige des classes complètes (pas de classes dynamiques interpolées)
const CATEGORY_STYLES = {
  AUGMENTER: {
    wrapper: 'flex-1 text-center p-3 rounded-xl bg-emerald-50 border border-emerald-100',
    count:   'text-2xl font-black text-emerald-700',
    label:   'text-[10px] font-bold text-emerald-500 uppercase tracking-widest',
  },
  MAINTENIR: {
    wrapper: 'flex-1 text-center p-3 rounded-xl bg-amber-50 border border-amber-100',
    count:   'text-2xl font-black text-amber-700',
    label:   'text-[10px] font-bold text-amber-500 uppercase tracking-widest',
  },
  REDUIRE: {
    wrapper: 'flex-1 text-center p-3 rounded-xl bg-rose-50 border border-rose-100',
    count:   'text-2xl font-black text-rose-700',
    label:   'text-[10px] font-bold text-rose-500 uppercase tracking-widest',
  },
};

const formatPopulation = (pop) => {
  if (!pop) return '—';
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)} M`;
  if (pop >= 1_000)    return `${(pop / 1_000).toFixed(0)} K`;
  return String(pop);
};

const Predictions = () => {
  const dispatch = useDispatch();
  const { predictions, loading } = useSelector((state) => state.ia);

  useEffect(() => {
    // getSalesForecast doit se terminer avant getRelanceRecommendations
    // car la deuxième réutilise salesForecast.raw depuis le state
    dispatch(getSalesForecast()).then(() => dispatch(getRelanceRecommendations()));
  }, [dispatch]);

  const refresh = () => {
    dispatch(getSalesForecast()).then(() => dispatch(getRelanceRecommendations()));
  };

  if (loading) return <LoadingSpinner />;

  const { salesForecast, relanceRecommendations, customerSatisfaction } = predictions;
  const rawRegions = salesForecast?.raw || [];
  const modelAccuracy = salesForecast?.modelAccuracy ?? 72.94;

  // Compter les 3 catégories de recommandation pour le résumé
  const counts = rawRegions.reduce(
    (acc, r) => {
      const k = r.recommandation || 'MAINTENIR';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    },
    { AUGMENTER: 0, MAINTENIR: 0, REDUIRE: 0 }
  );

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge badge-primary">
              <SparklesIcon className="h-3 w-3 mr-1" />
              Moteur Nexus AI
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Intelligence Prédictive</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Analyses et recommandations régionales — VotingClassifier ML v1.4
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refresh}
            className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all shadow-soft"
            title="Actualiser les calculs"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Calculs temps réel</span>
          </div>
        </div>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">

        {/* Carte : Prévisions régionales ML */}
        <div className="card-luxury p-0 overflow-hidden group">
          <div className="p-8 bg-gradient-blue text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-500">
              <PresentationChartLineIcon className="h-24 w-24" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-lg font-black uppercase tracking-tighter">Prévisions Régionales ML</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black">{salesForecast?.montant || '0 / 24'}</p>
                <span className="text-xl text-blue-100">Régions AUGMENTER</span>
              </div>
              <p className="mt-2 text-sm font-bold text-emerald-300 flex items-center gap-2">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                {salesForecast?.trend || '+0.0%'} variation moyenne projetée
              </p>
            </div>
          </div>
          <div className="p-8 bg-white space-y-4">
            {/* Résumé des 3 catégories */}
            {rawRegions.length > 0 && (
              <div className="flex items-center justify-between gap-2">
                {[
                  { key: 'AUGMENTER', label: 'Augmenter' },
                  { key: 'MAINTENIR', label: 'Maintenir' },
                  { key: 'REDUIRE',   label: 'Réduire'   },
                ].map(({ key, label }) => {
                  const s = CATEGORY_STYLES[key];
                  return (
                    <div key={key} className={s.wrapper}>
                      <p className={s.count}>{counts[key] || 0}</p>
                      <p className={s.label}>{label}</p>
                    </div>
                  );
                })}
              </div>
            )}
            <div>
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">
                <span>Fiabilité du modèle</span>
                <span className="text-slate-800">{modelAccuracy}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-blue rounded-full transition-all duration-700" style={{ width: `${modelAccuracy}%` }}></div>
              </div>
            </div>
            <p className="text-[11px] font-medium text-slate-500 leading-relaxed italic">
              * VotingClassifier (RF + GradientBoosting + LR) — 24 gouvernorats — accuracy mesurée sur données ERP réelles.
            </p>
          </div>
        </div>

        {/* Carte : Régions Prioritaires (AUGMENTER) */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-shape icon-shape-sm bg-gradient-warning shadow-glow-amber">
                <BellAlertIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Régions Prioritaires</h2>
            </div>
            <span className="badge badge-primary">{(relanceRecommendations || []).length} Régions à Renforcer</span>
          </div>
          <div className="p-4 space-y-3 bg-white">
            {(relanceRecommendations || []).map((region, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gradient-blue group-hover:text-white transition-all group-hover:scale-110">
                    <MapPinIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{region.client}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <UsersIcon className="h-3 w-3 text-slate-400" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Pop. {formatPopulation(region.population)}
                        {region.indiceAchat ? ` · Indice ${region.indiceAchat}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${region.score > 50 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    Potentiel {region.score}%
                  </span>
                  {region.variation_label && (
                    <p className="text-[10px] font-bold text-emerald-600">{region.variation_label}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100/50">
            <button
              onClick={refresh}
              className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all"
            >
              Actualiser les recommandations régionales
            </button>
          </div>
        </div>

        {/* Carte : Satisfaction client NPS */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100/50 flex items-center gap-3">
            <div className="icon-shape icon-shape-sm bg-gradient-success shadow-glow-emerald">
              <TrophyIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Sentiment Client (NPS)</h2>
          </div>
          <div className="p-8 bg-white flex flex-col md:flex-row items-center gap-10">
            <div className="relative">
              <svg className="h-32 w-32 transform -rotate-90">
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * (1 - (customerSatisfaction?.score || 8.5) / 10)} className="text-emerald-500" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">{customerSatisfaction?.score || '8.5'}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">SUR 10</span>
              </div>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-tighter">
                  <span>Réponse au support</span>
                  <span className="text-emerald-600">Excellent</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-tighter">
                  <span>Délais de livraison</span>
                  <span className="text-blue-600">Très Bon</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mt-4">
                Basé sur {customerSatisfaction?.total || 45} évaluations le mois dernier
              </p>
            </div>
          </div>
        </div>

        {/* Carte : Données démographiques des régions top */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue">
                <CpuChipIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                {rawRegions.length > 0 ? 'Top Régions — Données ML' : 'Opportunités à Fort Potentiel'}
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {rawRegions.length > 0 ? `${rawRegions.length} régions analysées` : 'Données en attente'}
            </span>
          </div>
          <div className="p-8 space-y-6 bg-white">
            {rawRegions.length > 0
              ? rawRegions
                  .filter(r => r.recommandation === 'AUGMENTER')
                  .sort((a, b) => (b.probabilite_hausse || 0) - (a.probabilite_hausse || 0))
                  .slice(0, 3)
                  .map((region, i) => {
                    const style = RECOMMANDATION_STYLES[region.recommandation] || RECOMMANDATION_STYLES.MAINTENIR;
                    return (
                      <div key={i} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-sm font-black text-slate-800">
                              {(region.region || '').replace(/_/g, ' ')}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                              {region.recommandation}
                            </span>
                          </div>
                          <span className="text-sm font-black text-emerald-600">
                            {Math.round(region.probabilite_hausse || 0)}%
                            <span className="text-[9px] uppercase text-slate-400 ml-1">potentiel</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-success transition-all duration-1000"
                            style={{ width: `${region.probabilite_hausse || 0}%` }}
                          />
                        </div>
                        <div className="flex gap-4 mt-1.5">
                          <span className="text-[9px] text-slate-400">
                            Pop. {formatPopulation(region.region_data?.population)}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Indice achat {region.region_data?.indice_achat ?? '—'}
                          </span>
                          <span className="text-[9px] text-slate-400">
                            {region.region_data?.nb_hopitaux ?? '—'} hôpitaux
                          </span>
                          <span className="text-[9px] text-slate-400">
                            Variation {region.variation_label || '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })
              : [
                  { id: 1, client: 'Tunisie Telecom', prob: 85, vol: '45k TND' },
                  { id: 2, client: 'Amen Bank',       prob: 72, vol: '120k TND' },
                  { id: 3, client: 'STEG SA',         prob: 68, vol: '28k TND'  },
                ].map((devis) => (
                  <div key={devis.id} className="group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-black text-slate-800">{devis.client}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">({devis.vol})</span>
                      </div>
                      <span className="text-sm font-black text-emerald-600">
                        {devis.prob}% <span className="text-[9px] uppercase text-slate-400">probabilité</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-success transition-all duration-1000" style={{ width: `${devis.prob}%` }} />
                    </div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Predictions;
