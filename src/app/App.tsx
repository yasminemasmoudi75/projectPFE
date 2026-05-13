import { useState } from 'react';
import { Header } from '@/app/components/agent/Header';
import { Sidebar } from '@/app/components/agent/Sidebar';
import { Dashboard } from '@/app/components/agent/Dashboard';
import { ActivitesClients } from '@/app/components/agent/ActivitesClients';
import { Reclamations } from '@/app/components/agent/Reclamations';
import { Historique } from '@/app/components/agent/Historique';
import { Societes } from '@/app/components/agent/Societes';
import { Rapports } from '@/app/components/agent/Rapports';
import { ContactsList } from '@/app/components/agent/ContactsList';

// Technicien imports
import { HeaderTechnicien } from '@/app/components/technicien/HeaderTechnicien';
import { SidebarTechnicien } from '@/app/components/technicien/SidebarTechnicien';
import { DashboardTechnicien } from '@/app/components/technicien/DashboardTechnicien';
import { ReclamationsTechnicien } from '@/app/components/technicien/ReclamationsTechnicien';
import { InterventionsTechnicien } from '@/app/components/technicien/InterventionsTechnicien';
import { HistoriqueTechnicien } from '@/app/components/technicien/HistoriqueTechnicien';

// Admin imports
import { HeaderAdmin } from '@/app/components/admin/HeaderAdmin';
import { SidebarAdmin } from '@/app/components/admin/SidebarAdmin';
import { DashboardAdmin } from '@/app/components/admin/DashboardAdmin';
import { GestionUtilisateurs } from '@/app/components/admin/GestionUtilisateurs';
import { GestionSocietes } from '@/app/components/admin/GestionSocietes';
import { GestionStocks } from '@/app/components/admin/GestionStocks';
import { GestionDevis } from '@/app/components/admin/GestionDevis';
import { GestionIA } from '@/app/components/admin/GestionIA';
import { GestionProduits } from '@/app/components/admin/GestionProduits';
import { GestionProjets } from '@/app/components/admin/GestionProjets';
import { GestionActivites } from '@/app/components/admin/GestionActivites';
import { GestionObjectifs } from '@/app/components/admin/GestionObjectifs';
import { GestionSAV } from '@/app/components/admin/GestionSAV';
import { CalendrierGlobal } from '@/app/components/admin/CalendrierGlobal';
import { StatistiquesTableaux } from '@/app/components/admin/StatistiquesTableaux';
import { RelancesIA } from '@/app/components/admin/RelancesIA';
import { GestionRolesPermissions } from '@/app/components/admin/GestionRolesPermissions';
import { JournalConnexions } from '@/app/components/admin/JournalConnexions';

// Commercial imports
import { HeaderCommercial } from '@/app/components/commercial/HeaderCommercial';
import { SidebarCommercial } from '@/app/components/commercial/SidebarCommercial';
import { DashboardCommercial } from '@/app/components/commercial/DashboardCommercial';
import { ProjetsCommercial } from '@/app/components/commercial/ProjetsCommercial';
import { ActivitesCommercial } from '@/app/components/commercial/ActivitesCommercial';
import { CalendrierCommercial } from '@/app/components/commercial/CalendrierCommercial';
import { DevisCommercial } from '@/app/components/commercial/DevisCommercial';
import { ObjectifsCommercial } from '@/app/components/commercial/ObjectifsCommercial';

// Client imports
import { HeaderClient } from '@/app/components/client/HeaderClient';
import { SidebarClient } from '@/app/components/client/SidebarClient';
import { DashboardClient } from '@/app/components/client/DashboardClient';
import { ReclamationsClient } from '@/app/components/client/ReclamationsClient';
import { HistoriqueClient } from '@/app/components/client/HistoriqueClient';
import { MessagesClient } from '@/app/components/client/MessagesClient';

import { Login } from '@/app/components/auth/Login';
import { Register } from '@/app/components/auth/Register';
import { Button } from '@/app/components/ui/button';
import { Users, Wrench, Shield, Briefcase, User, LogOut } from 'lucide-react';

export default function App() {
  const [authPage, setAuthPage]   = useState<'login' | 'register' | null>('login');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userType, setUserType]   = useState<'agent' | 'technicien' | 'admin' | 'commercial' | 'client'>('admin');

  const handleLogin = (role: typeof userType) => {
    setUserType(role);
    setActiveTab('dashboard');
    setAuthPage(null);
  };

  const handleLogout = () => {
    setAuthPage('login');
    setActiveTab('dashboard');
  };

  const renderAgentContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <Dashboard />;
      case 'activities':    return <ActivitesClients />;
      case 'reclamations':  return <Reclamations />;
      case 'historique':    return <Historique />;
      case 'societes':      return <Societes />;
      case 'rapports':      return <Rapports />;
      case 'contacts':      return <ContactsList />;
      default:              return <Dashboard />;
    }
  };

  const renderTechnicienContent = () => {
    switch (activeTab) {
      case 'dashboard':     return <DashboardTechnicien />;
      case 'reclamations':  return <ReclamationsTechnicien />;
      case 'interventions': return <InterventionsTechnicien />;
      case 'historique':    return <HistoriqueTechnicien />;
      default:              return <DashboardTechnicien />;
    }
  };

  const renderAdminContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardAdmin />;
      case 'utilisateurs': return <GestionUtilisateurs />;
      case 'societes':     return <GestionSocietes />;
      case 'produits':     return <GestionProduits />;
      case 'stocks':       return <GestionStocks />;
      case 'projets':      return <GestionProjets />;
      case 'activites':    return <GestionActivites />;
      case 'devis':        return <GestionDevis />;
      case 'sav':          return <GestionSAV />;
      case 'objectifs':    return <GestionObjectifs />;
      case 'calendrier':   return <CalendrierGlobal />;
      case 'statistiques': return <StatistiquesTableaux />;
      case 'ia':           return <GestionIA />;
      case 'relances':     return <RelancesIA />;
      case 'roles':        return <GestionRolesPermissions />;
      case 'journal':      return <JournalConnexions />;
      default:             return <DashboardAdmin />;
    }
  };

  const renderCommercialContent = () => {
    switch (activeTab) {
      case 'dashboard':  return <DashboardCommercial />;
      case 'projets':    return <ProjetsCommercial />;
      case 'activites':  return <ActivitesCommercial />;
      case 'calendrier': return <CalendrierCommercial />;
      case 'devis':      return <DevisCommercial />;
      case 'objectifs':  return <ObjectifsCommercial />;
      default:           return <DashboardCommercial />;
    }
  };

  const renderClientContent = () => {
    switch (activeTab) {
      case 'dashboard':    return <DashboardClient />;
      case 'reclamations': return <ReclamationsClient />;
      case 'historique':   return <HistoriqueClient />;
      case 'messages':     return <MessagesClient />;
      default:             return <DashboardClient />;
    }
  };

  const switchUserType = (type: 'agent' | 'technicien' | 'admin' | 'commercial' | 'client') => {
    setUserType(type);
    setActiveTab('dashboard');
  };

  const renderSidebar = () => {
    switch (userType) {
      case 'admin':      return <SidebarAdmin activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'agent':      return <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'technicien': return <SidebarTechnicien activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'commercial': return <SidebarCommercial activeTab={activeTab} onTabChange={setActiveTab} />;
      case 'client':     return <SidebarClient activeTab={activeTab} onTabChange={setActiveTab} />;
    }
  };

  const renderHeader = () => {
    switch (userType) {
      case 'admin':      return <HeaderAdmin />;
      case 'agent':      return <Header />;
      case 'technicien': return <HeaderTechnicien />;
      case 'commercial': return <HeaderCommercial />;
      case 'client':     return <HeaderClient />;
    }
  };

  const renderContent = () => {
    switch (userType) {
      case 'admin':      return renderAdminContent();
      case 'agent':      return renderAgentContent();
      case 'technicien': return renderTechnicienContent();
      case 'commercial': return renderCommercialContent();
      case 'client':     return renderClientContent();
    }
  };

  /* ── Auth gate ── */
  if (authPage === 'login')    return <Login    onLogin={handleLogin} onGoRegister={() => setAuthPage('register')} />;
  if (authPage === 'register') return <Register onRegister={handleLogin} onGoLogin={() => setAuthPage('login')} />;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Fixed Sidebar */}
      {renderSidebar()}

      {/* Main content — offset by sidebar width */}
      <div className="lg:pl-72 flex flex-col min-h-screen">

        {/* User Type Switcher — sits above navbar */}
        <div className="flex items-center justify-between gap-1 py-2 px-4 bg-white border-b border-slate-100">
          <div className="flex items-center gap-1">
            {(
              [
                { type: 'admin',      label: 'Admin',      icon: Shield    },
                { type: 'agent',      label: 'Agent',      icon: Users     },
                { type: 'technicien', label: 'Technicien', icon: Wrench    },
                { type: 'commercial', label: 'Commercial', icon: Briefcase },
                { type: 'client',     label: 'Client',     icon: User      },
              ] as const
            ).map(({ type, label, icon: Icon }) => (
              <Button
                key={type}
                size="sm"
                onClick={() => switchUserType(type)}
                className={
                  userType === type
                    ? 'bg-blue-600 text-white shadow-sm rounded-lg'
                    : 'bg-transparent text-slate-600 hover:bg-slate-100 rounded-lg'
                }
              >
                <Icon className="w-4 h-4 mr-1.5" />
                {label}
              </Button>
            ))}
          </div>

          {/* Logout */}
          <Button
            size="sm"
            onClick={handleLogout}
            className="bg-transparent text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg border border-slate-200"
          >
            <LogOut className="w-4 h-4 mr-1.5" />
            Déconnexion
          </Button>
        </div>

        {/* Sticky Navbar */}
        {renderHeader()}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
