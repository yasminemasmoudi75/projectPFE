import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import ChatbotWidget from '../components/ui/ChatbotWidget';
import NotificationReminder from '../components/notifications/NotificationReminder';

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--slate-100)' }}>

      {/* Subtle decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(0,98,175,0.04) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.03) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-40 right-1/3 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 70%)' }} />
      </div>

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-72 relative">

        {/* Navbar */}
        <Navbar setSidebarOpen={setSidebarOpen} />

        {/* Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>

        {/* Chatbot */}
        <ChatbotWidget />

        {/* Rappel notifications au login */}
        <NotificationReminder />

        {/* Footer */}
        <footer className="border-t border-slate-200/60 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-[1600px] px-4 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              © 2025{' '}
              <span className="font-bold text-[#0062AF]">NexusCRM</span>
              {' '}· Business Software · v2.0
            </p>
            <div className="flex items-center gap-4">
              {['Documentation', 'Support', 'Confidentialité'].map(item => (
                <a
                  key={item}
                  href="#"
                  className="text-xs text-slate-400 hover:text-[#0062AF] transition-colors font-medium"
                >
                  {item}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;
