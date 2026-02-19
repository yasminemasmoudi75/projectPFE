import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';

/**
 * Layout principal du dashboard - Light Gray & Blue Premium Design
 */
const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-mesh">
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Soft blue orbs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-cyan-400/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-48 right-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-3xl"></div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
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
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

        {/* Navbar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Content Zone */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth relative z-10">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-10 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-200/50 bg-white/50 backdrop-blur-sm">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-10 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-slate-500">
              © 2024 <span className="font-semibold text-blue-600">NexusCRM</span>. Tous droits réservés.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Documentation</a>
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Support</a>
              <a href="#" className="text-xs text-slate-500 hover:text-blue-600 transition-colors">Licence</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
