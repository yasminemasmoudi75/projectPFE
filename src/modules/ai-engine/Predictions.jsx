import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  SparklesIcon,
  ChartBarIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  BellAlertIcon,
  ArrowPathIcon,
  PresentationChartLineIcon,
  CpuChipIcon,
  DocumentMagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { getSalesForecast, getRelanceRecommendations } from './iaSlice';
import LoadingSpinner from '../../components/feedback/LoadingSpinner';

const Predictions = () => {
  const dispatch = useDispatch();
  const { predictions, loading } = useSelector((state) => state.ia);

  useEffect(() => {
    dispatch(getSalesForecast());
    dispatch(getRelanceRecommendations());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      {/* Header Section */}
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
            Analyses et recommandations basées sur l'apprentissage automatique
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              dispatch(getSalesForecast());
              dispatch(getRelanceRecommendations());
            }}
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

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Prévisions de ventes */}
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
                <h2 className="text-lg font-black uppercase tracking-tighter">Prévisions de Chiffre d'Affaires</h2>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-black">{predictions.salesForecast?.montant || '150 000'} <span className="text-xl">TND</span></p>
              </div>
              <p className="mt-2 text-sm font-bold text-blue-100 flex items-center gap-2 text-emerald-300">
                <ArrowTrendingUpIcon className="h-4 w-4" />
                +15.4% de croissance projetée pour le mois prochain
              </p>
            </div>
          </div>
          <div className="p-8 bg-white">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              <span>Fiabilité du modèle</span>
              <span className="text-slate-800">92%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-blue rounded-full" style={{ width: '92%' }}></div>
            </div>
            <p className="mt-6 text-[11px] font-medium text-slate-500 leading-relaxed italic">
              * Les prévisions sont basées sur l'historique des 24 derniers mois et les tendances actuelles du marché.
            </p>
          </div>
        </div>

        {/* Recommandations de relances */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100/50 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-shape icon-shape-sm bg-gradient-warning shadow-glow-amber">
                <BellAlertIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Relances Prioritaires</h2>
            </div>
            <span className="badge badge-primary">3 Actions Recommandées</span>
          </div>
          <div className="p-4 space-y-3 bg-white">
            {[
              { name: 'Carthage Global', days: 5, score: 88, type: 'Email' },
              { name: 'Pharma Plus SA', days: 12, score: 72, type: 'Appel' },
              { name: 'Global Import', days: 8, score: 65, type: 'Meeting' },
            ].map((client, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-gradient-blue group-hover:text-white transition-all group-hover:scale-110">
                    <UserGroupIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{client.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Dernière interaction : {client.days}j</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${client.score > 80 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                    Urgence {client.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="px-8 py-4 bg-slate-50/30 border-t border-slate-100/50">
            <button className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all">
              Voir tout le plan de relance
            </button>
          </div>
        </div>

        {/* Analyse de satisfaction */}
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
                <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 * 0.15} className="text-emerald-500 shadow-glow-emerald" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-slate-800">8.5</span>
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
                Basé sur 45 évaluations le mois dernier
              </p>
            </div>
          </div>
        </div>

        {/* Probabilités de conversion */}
        <div className="card-luxury p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100/50 bg-gradient-to-r from-slate-50/50 to-transparent flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="icon-shape icon-shape-sm bg-gradient-blue shadow-glow-blue">
                <DocumentMagnifyingGlassIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-widest">Opportunités à Fort Potentiel</h2>
            </div>
            <CpuChipIcon className="h-5 w-5 text-slate-300" />
          </div>
          <div className="p-8 space-y-8 bg-white">
            {[
              { id: 1, client: 'Tunisie Telecom', prob: 85, vol: '45k TND' },
              { id: 2, client: 'Amen Bank', prob: 72, vol: '120k TND' },
              { id: 3, client: 'STEG SA', prob: 68, vol: '28k TND' },
            ].map((devis) => (
              <div key={devis.id} className="group">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-black text-slate-800">{devis.client}</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">({devis.vol})</span>
                  </div>
                  <span className="text-sm font-black text-emerald-600">{devis.prob}% <span className="text-[9px] uppercase text-slate-400">probabilité</span></span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-success transition-all duration-1000"
                    style={{ width: `${devis.prob}%` }}
                  ></div>
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
