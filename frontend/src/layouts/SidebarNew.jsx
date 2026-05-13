import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import usePermission from '../hooks/usePermission';
import { MODULE_CODES } from '../utils/constants';

const menuSections = [
  {
    label: 'Principal',
    items: [
      { name: 'Tableau de Bord', href: '/dashboard', icon: 'dashboard', moduleCode: MODULE_CODES.DASHBOARD },
    ]
  },
  {
    label: 'Ventes',
    items: [
      { name: 'Devis', href: '/devis', icon: 'devis', moduleCode: MODULE_CODES.DEVIS },
      { name: 'Bons de Commande', href: '/bcv', icon: 'bcv', moduleCode: MODULE_CODES.COMMANDES },
      { name: 'Bons de Livraison', href: '/blv', icon: 'blv', moduleCode: MODULE_CODES.LIVRAISONS },
      { name: 'Factures', href: '/fav', icon: 'fav', moduleCode: MODULE_CODES.FACTURES },
    ]
  },
  {
    label: 'CRM',
    items: [
      { name: 'Clients', href: '/clients', icon: 'clients', moduleCode: MODULE_CODES.CLIENTS },
    ]
  },
];

const icons = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
      <rect x="3" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="3" width="7" height="7" rx="1"></rect>
      <rect x="14" y="14" width="7" height="7" rx="1"></rect>
      <rect x="3" y="14" width="7" height="7" rx="1"></rect>
    </svg>
  ),
  devis: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
    </svg>
  ),
  bcv: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"></path>
      <path d="M9 5a2 2 0 012 2h2a2 2 0 012-2"></path>
    </svg>
  ),
  blv: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
      <path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"></path>
    </svg>
  ),
  fav: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
      <rect x="2" y="5" width="20" height="14" rx="2"></rect>
      <path d="M7 15h0M12 15h0M17 15h0"></path>
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="nav-icon">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
};

const SidebarNew = () => {
  const { user, logout } = useAuth();
  const { allPermissions } = usePermission();
  const navigate = useNavigate();
  const role = String(user?.UserRole || '').toLowerCase();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const hasAccess = (item) => {
    if (item.moduleCode == null) return true;
    const p = allPermissions.find(p => Number(p.moduleCode) === Number(item.moduleCode));
    return p?.isActive === true;
  };

  const initials = user?.FullName
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <aside className="sidebar-maquette">
      {/* Header */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">N</div>
          <div className="logo-text">
            <span className="logo-title">NEXUS</span>
            <span className="logo-subtitle">ERP Suite</span>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <motion.button
        whileHover={{ y: -2 }}
        onClick={() => navigate('/profile')}
        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:border-blue-300 transition-all group"
      >
        <div className="relative">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white"></span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {user?.FullName || 'Utilisateur'}
          </p>
          <p className="text-xs text-slate-500 truncate">{user?.UserRole || 'Admin'}</p>
        </div>
      </motion.button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto -mx-3 px-3">
        {menuSections.map((section, idx) => {
          const visibleItems = section.items.filter(hasAccess);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="nav-section mb-4">
              <span className="nav-label">{section.label}</span>
              {visibleItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'active' : ''}`
                  }
                >
                  {icons[item.icon]}
                  <span>{item.name}</span>
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
        >
          <div className="h-8 w-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-red-600">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </div>
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
};

export default SidebarNew;
