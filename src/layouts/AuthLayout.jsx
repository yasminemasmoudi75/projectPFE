import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-white font-sans overflow-hidden">

      {/* ── Left Panel ── */}
      <div className="relative hidden xl:flex xl:w-[48%] flex-col overflow-hidden">

        {/* Background image with dark overlay */}
        <div className="absolute inset-0 z-0 bg-[#0a1628]">
          <img
            src="/images/CRM-1.png"
            className="w-full h-full object-cover opacity-40 mix-blend-luminosity"
            alt="NexusCRM"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0a1628]/70 via-[#0a1628]/60 to-[#0a1628]/90" />
        </div>

        {/* Subtle glow orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-400/8 rounded-full blur-[100px]" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-10 py-10">

          {/* BS Business Software logo */}
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-lg px-3 py-2 self-start">
            <div className="h-7 w-7 rounded bg-[#0062AF] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-[11px] leading-none">BS</span>
            </div>
            <div>
              <p className="text-white font-black text-[11px] uppercase tracking-[0.12em] leading-tight">Business</p>
              <p className="text-white/50 font-semibold text-[9px] uppercase tracking-[0.15em]">Software</p>
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Big NEXUS CRM branding */}
          <div className="mb-8">
            <div className="leading-none">
              <h1 className="text-[82px] font-black text-white tracking-[-0.02em] leading-none">
                Ne<span className="text-[#0062AF]">x</span>us
              </h1>
              <p className="text-[32px] font-black text-[#38bdf8] tracking-[0.3em] leading-none mt-1 uppercase">CRM</p>
            </div>
            <p className="text-white/40 text-sm font-medium leading-relaxed mt-5 max-w-[300px]">
              Plateforme de gestion commerciale complète — clients, ventes, projets & intelligence artificielle.
            </p>
          </div>

          {/* Trust badge */}
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] text-white/35 font-semibold uppercase tracking-[0.1em]">
              Connexion sécurisée · Données chiffrées
            </span>
          </div>
        </div>
      </div>

      {/* ── Right Panel (Form) ── */}
      <div className="flex-1 flex flex-col justify-center items-center relative bg-white">

        {/* Subtle top accent */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-[#0062AF] via-sky-400 to-teal-400" />

        {/* Mobile logo */}
        <div className="xl:hidden flex items-center gap-2.5 absolute top-6 left-6 z-10">
          <div className="h-8 w-8 rounded-lg bg-[#0062AF] flex items-center justify-center">
            <span className="text-white font-black text-xs">N</span>
          </div>
          <span className="font-black text-slate-900 text-base tracking-tight">NexusCRM</span>
        </div>

        <div className="w-full max-w-[400px] px-6 relative z-10">
          <Outlet />
        </div>

        {/* Bottom copyright */}
        <p className="absolute bottom-5 text-[11px] text-slate-300 font-medium tracking-wide">
          © 2025 NexusCRM · Business Software
        </p>
      </div>
    </div>
  );
};

export default AuthLayout;
