import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import {
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';

const FEATURES = [
  { icon: ChartBarIcon,   label: 'Tableaux de bord temps réel',      desc: 'KPIs, graphiques et analyses avancées' },
  { icon: UserGroupIcon,  label: 'Gestion clients & portefeuilles',   desc: 'CRM complet avec suivi 360°' },
  { icon: BriefcaseIcon,  label: 'Devis, commandes & factures',       desc: 'Cycle de vente entièrement digitalisé' },
  { icon: SparklesIcon,   label: 'Intelligence artificielle embarquée', desc: 'Prédictions et recommandations' },
];

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans overflow-hidden">

      {/* ── Left Panel ── */}
      <div className="relative hidden xl:flex xl:w-[46%] flex-col overflow-hidden bg-[#0a1628]">

        {/* Background image */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/CRM-1.png"
            className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
            alt="NexusCRM"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0062AF]/60 via-[#0a1628]/80 to-[#0a1628]" />
        </div>

        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 -left-20 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px]" />
        </div>

        {/* Accent line top */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-transparent via-[#0062AF] to-transparent z-10" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div className="h-10 w-10 rounded-xl bg-[#0062AF] flex items-center justify-center shadow-lg flex-shrink-0">
              <img src="/images/logonexus.png" className="h-6 w-6 object-contain" alt="Nexus" onError={(e) => { e.target.style.display='none'; }} />
            </div>
            <div>
              <span className="text-white font-black text-xl tracking-tight">NexusCRM</span>
              <span className="block text-blue-300/80 text-[10px] font-semibold uppercase tracking-widest">Business Platform</span>
            </div>
          </div>

          {/* Hero text */}
          <div className="my-10">
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Gérez votre activité<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">
                avec précision
              </span>
            </h1>
            <p className="text-blue-100/60 text-sm leading-relaxed max-w-[320px]">
              Une plateforme CRM complète pour piloter vos ventes, clients, projets et analyses en temps réel.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-10">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/8 hover:bg-white/8 transition-colors"
              >
                <div className="h-8 w-8 rounded-lg bg-[#0062AF]/40 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
                  <f.icon className="h-4 w-4 text-blue-300" />
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-bold truncate">{f.label}</p>
                  <p className="text-blue-300/50 text-[11px] truncate">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2 mt-auto">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-white/40 font-medium">
              Connexion sécurisée · Données chiffrées
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex flex-col justify-center items-center relative overflow-hidden bg-white">

        {/* Subtle background */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50/80 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-50/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50/60 rounded-full blur-[80px] pointer-events-none" />

        {/* Mobile logo */}
        <div className="xl:hidden flex items-center gap-2 absolute top-6 left-6 z-10">
          <div className="h-8 w-8 rounded-lg bg-[#0062AF] flex items-center justify-center">
            <img src="/images/logonexus.png" className="h-5 w-5 object-contain" alt="Nexus" onError={(e) => { e.target.style.display='none'; }} />
          </div>
          <span className="font-black text-slate-900 text-base">NexusCRM</span>
        </div>

        <div className="w-full max-w-[420px] relative z-10 px-6">
          <Outlet />
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-6 text-[11px] text-slate-400 font-medium">
          © 2025 NexusCRM · Business Software
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
