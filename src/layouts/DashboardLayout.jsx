import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatbotWidget from '../components/ui/ChatbotWidget';

/**
 * Layout principal du dashboard - Light Gray & Blue Premium Design
 */
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-mesh">
      {/* Enhanced Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Soft animated blue orbs - More refined */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-500/8 rounded-full blur-3xl animate-pulse animation-delay-0"></div>
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-cyan-400/6 rounded-full blur-3xl animate-pulse animation-delay-1"></div>
        <div className="absolute -bottom-48 right-1/4 w-[600px] h-[600px] bg-indigo-400/5 rounded-full blur-3xl animate-pulse animation-delay-2"></div>
        
        {/* Additional accent orbs */}
        <div className="absolute top-1/2 left-1/3 w-[350px] h-[350px] bg-blue-300/4 rounded-full blur-3xl"></div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233b82f6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      </div>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-72 focus:outline-none relative">

        {/* Top Gradient Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

        {/* Navbar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Content Zone - Enhanced Styling */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative z-10 bg-gradient-to-b from-white/30 via-transparent to-cyan-50/20">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-10 py-8 lg:py-10">
            <Outlet />
          </div>
        </main>

        {/* Chatbot */}
        <ChatbotWidget />

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-200/50 bg-gradient-to-r from-white/50 to-blue-50/30 backdrop-blur-sm">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <p className="text-xs text-slate-500">
                © 2024 <span className="font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">NexusCRM Pro</span>. Tous droits réservés.
              </p>
              <div className="w-1 h-1 rounded-full bg-slate-300"></div>
              <p className="text-xs text-slate-500 font-medium">v2.0.0</p>
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-all hover:font-semibold">Documentation</a>
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-all hover:font-semibold">Support 24/7</a>
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-all hover:font-semibold">Licence</a>
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-all hover:font-semibold">Confidentialité</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
