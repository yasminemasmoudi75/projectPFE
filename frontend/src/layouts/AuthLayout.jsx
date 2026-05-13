import { Outlet, Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

const AuthLayout = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans overflow-hidden">
      {/* Left Panel: Background Image with Blue Border */}
      <div className="relative hidden xl:flex xl:w-[45%] overflow-hidden bg-[#0f172a] border-r-[6px] border-[#0062AF]">
        {/* The Nexus CRM Image as Background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/CRM-1.png"
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:opacity-100 hover:mix-blend-normal transition-all duration-1000"
            alt="Nexus CRM Background"
          />
          {/* Dark Overlay for better contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-[#0f172a]/50"></div>
          <div className="absolute inset-0 bg-blue-900/10"></div>
        </div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
          <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-5%] left-[-5%] w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]"></div>
        </div>

        {/* Top Corporate Logo */}
        <div className="absolute top-12 left-12 z-20 transition-all hover:scale-105">
          <div className="bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-xl border border-white/20 shadow-2xl">
            <img src="/images/logo-bs.png" className="h-8 w-auto object-contain brightness-0 invert" alt="Business Software" />
          </div>
        </div>

        {/* Optional: Central invisible box to keep focus on background */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-16">
          {/* We keep this empty as requested to show the background image taking all the part */}
        </div>


      </div>

      {/* Form Side (Right Panel) */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 md:px-20 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="w-full max-w-[420px] relative z-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
