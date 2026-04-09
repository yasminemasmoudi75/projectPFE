import { Fragment, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  HomeIcon,
  DocumentTextIcon,
  DocumentCheckIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  UsersIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  CubeIcon,
  UserGroupIcon,
  LifebuoyIcon,
  ShoppingBagIcon,
  TruckIcon,
  BanknotesIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';
import usePermission from '../hooks/usePermission';
import { MODULE_CODES } from '../utils/constants';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, moduleCode: MODULE_CODES.DASHBOARD, color: 'sky' },
  { type: 'section', name: 'Administration' },
  { name: 'Admin', href: '/admin', icon: ShieldCheckIcon, moduleCode: null, color: 'violet' },
  { type: 'section', name: 'CRM & Ventes' },
  { name: 'Utilisateurs', href: '/users', icon: UsersIcon, moduleCode: MODULE_CODES.USERS, color: 'indigo' },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, moduleCode: MODULE_CODES.MESSAGES, color: 'cyan' },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon, moduleCode: MODULE_CODES.CLIENTS, color: 'emerald' },
  { name: 'Devis', href: '/devis', icon: DocumentTextIcon, moduleCode: MODULE_CODES.DEVIS, color: 'sky' },
  { name: 'Bons de Commande', href: '/bcv', icon: ShoppingBagIcon, moduleCode: MODULE_CODES.COMMANDES, color: 'amber' },
  { name: 'Livraisons', href: '/blv', icon: TruckIcon, moduleCode: MODULE_CODES.LIVRAISONS, color: 'orange' },
  { name: 'Factures', href: '/fav', icon: BanknotesIcon, moduleCode: MODULE_CODES.FACTURES, color: 'green' },
  { name: 'Paiements', href: '/reglements', icon: BanknotesIcon, moduleCode: MODULE_CODES.REGLEMENT, color: 'emerald' },
  { name: 'Mouvements', href: '/mouvements', icon: ArrowPathIcon, moduleCode: MODULE_CODES.TOURNEE, color: 'teal' },
  { name: 'Projets', href: '/projets', icon: BriefcaseIcon, moduleCode: MODULE_CODES.PROJETS, color: 'violet' },
  { type: 'section', name: 'Operations' },
  { name: 'Activites', href: '/activites', icon: CalendarIcon, moduleCode: MODULE_CODES.CHARGEMENT, color: 'rose' },
  { name: 'Calendrier', href: '/calendar', icon: CalendarIcon, moduleCode: MODULE_CODES.CALENDRIER, color: 'pink' },
  { name: 'Produits', href: '/products', icon: CubeIcon, moduleCode: MODULE_CODES.STOCK, color: 'slate' },
  { name: 'SAV', href: '/claims', icon: LifebuoyIcon, moduleCode: MODULE_CODES.REGLEMENT, color: 'red' },
  { type: 'section', name: 'Intelligence' },
  { name: 'Objectifs', href: '/objectifs', icon: ChartBarIcon, moduleCode: MODULE_CODES.OBJECTIFS, color: 'emerald' },
  { name: 'Recap', href: null, icon: SparklesIcon, moduleCode: MODULE_CODES.RECAP, color: 'violet' },
  { name: 'Relevé', href: null, icon: ChatBubbleLeftRightIcon, moduleCode: MODULE_CODES.RELEVE, color: 'cyan' },
  { name: 'Visite', href: null, icon: DocumentCheckIcon, moduleCode: MODULE_CODES.VISITES, color: 'amber' },
  { name: 'Maps', href: null, icon: UsersIcon, moduleCode: MODULE_CODES.MAPS, color: 'sky' },
];

const palette = {
  sky: { pastel: 'bg-sky-50', text: 'text-sky-600', solid: 'bg-sky-500', ring: 'ring-sky-200' },
  violet: { pastel: 'bg-violet-50', text: 'text-violet-600', solid: 'bg-violet-500', ring: 'ring-violet-200' },
  indigo: { pastel: 'bg-indigo-50', text: 'text-indigo-600', solid: 'bg-indigo-500', ring: 'ring-indigo-200' },
  cyan: { pastel: 'bg-cyan-50', text: 'text-cyan-600', solid: 'bg-cyan-500', ring: 'ring-cyan-200' },
  emerald: { pastel: 'bg-emerald-50', text: 'text-emerald-600', solid: 'bg-emerald-500', ring: 'ring-emerald-200' },
  amber: { pastel: 'bg-amber-50', text: 'text-amber-600', solid: 'bg-amber-500', ring: 'ring-amber-200' },
  orange: { pastel: 'bg-orange-50', text: 'text-orange-600', solid: 'bg-orange-500', ring: 'ring-orange-200' },
  green: { pastel: 'bg-green-50', text: 'text-green-600', solid: 'bg-green-500', ring: 'ring-green-200' },
  teal: { pastel: 'bg-teal-50', text: 'text-teal-600', solid: 'bg-teal-500', ring: 'ring-teal-200' },
  rose: { pastel: 'bg-rose-50', text: 'text-rose-600', solid: 'bg-rose-500', ring: 'ring-rose-200' },
  pink: { pastel: 'bg-pink-50', text: 'text-pink-600', solid: 'bg-pink-500', ring: 'ring-pink-200' },
  slate: { pastel: 'bg-slate-100', text: 'text-slate-600', solid: 'bg-slate-500', ring: 'ring-slate-200' },
  red: { pastel: 'bg-red-50', text: 'text-red-600', solid: 'bg-red-500', ring: 'ring-red-200' },
};

const MenuItem = ({ item }) => {
  const p = palette[item.color] || palette.sky;

  if (!item.href) {
    return (
      <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl opacity-50 cursor-not-allowed" title="Bientôt disponible">
        <div className={clsx('h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0', p.pastel)}>
          <item.icon className={clsx('h-4 w-4', p.text)} />
        </div>
        <span className="text-sm font-medium text-slate-500 flex-1 truncate">{item.name}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={item.href}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl transition-colors duration-200 outline-none',
          !isActive && 'hover:bg-slate-200/50'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <>
              <motion.div
                layoutId="sidebar-active-bg"
                className={clsx('absolute inset-0 rounded-xl', p.pastel)}
                transition={{ type: 'spring', stiffness: 600, damping: 40 }}
              />
              <motion.div
                layoutId="sidebar-active-pill"
                className={clsx('absolute left-0 inset-y-2 w-1 rounded-r-full', p.solid)}
                transition={{ type: 'spring', stiffness: 600, damping: 40 }}
              />
            </>
          )}
          <div className="relative z-10 h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300">
            <div
              className={clsx(
                'h-full w-full rounded-lg flex items-center justify-center transition-all duration-300',
                isActive
                  ? clsx(p.solid, 'shadow-md')
                  : clsx(p.pastel, 'group-hover:scale-105')
              )}
            >
              <item.icon
                className={clsx(
                  'h-4 w-4 transition-colors',
                  isActive ? 'text-white' : p.text
                )}
              />
            </div>
          </div>
          <span
            className={clsx(
              'relative z-10 text-sm font-semibold truncate transition-colors',
              isActive ? p.text : 'text-slate-600 group-hover:text-slate-800'
            )}
          >
            {item.name}
          </span>
        </>
      )}
    </NavLink>
  );
};

const SidebarContent = () => {
  const { user } = useAuth();
  const { allPermissions } = usePermission();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState({});
  const role = String(user?.UserRole || '').toLowerCase();

  const toggle = (name) => setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));

  const filtered = menuItems.filter(item => {
    if (role === 'client' && ['Bons de Commande', 'Livraisons'].includes(item.name)) {
      return true;
    }

    if (item.type === 'section') return true;
    if (item.moduleCode == null) return true;
    // Hide SAV module for commercial users
    if (item.name === 'SAV' && role === 'commercial') return false;
    // Hide Clients (admin) module from non-admin users
    if (item.name === 'Clients' && role !== 'admin') return false;
    // Hide Users (admin) module from non-admin users
    if (item.name === 'Utilisateurs' && role !== 'admin') return false;
    // Hide Admin section from non-admin users
    if (item.name === 'Admin' && role !== 'admin') return false;

    const p = allPermissions.find(p => Number(p.moduleCode) === Number(item.moduleCode));
    return p?.isActive === true;
  }).map(item => {
    return item;
  });

  const groups = [];
  let sec = null;
  filtered.forEach(item => {
    if (item.type === 'section') {
      sec = { ...item, items: [] };
      groups.push(sec);
    } else if (sec) {
      sec.items.push(item);
    } else {
      groups.push(item);
    }
  });

  const initials = user?.FullName
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="flex h-full flex-col overflow-hidden bg-white">
      {/* Header avec logo - Logo bien visible */}
      <div className="border-b border-slate-200 px-5 py-5 bg-slate-50">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md flex-shrink-0">
            <img src="/images/logonexus.png" className="h-8 w-8 object-contain" alt="Nexus" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900">NexusCRM</h1>
            <p className="text-xs text-slate-500 font-medium">Business Management</p>
          </div>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="px-4 py-4 border-b border-slate-200">
        <motion.button
          whileHover={{ y: -2 }}
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 hover:border-blue-300 transition-all group"
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
          <ChevronDownIcon className="h-4 w-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </motion.button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {groups.map((g, i) => {
            if (g.type === 'section') {
              const isOpen = !collapsed[g.name];
              const hasItems = g.items?.length > 0;
              if (!hasItems) return null;

              return (
                <div key={i} className="mb-4">
                  <button
                    onClick={() => toggle(g.name)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <span className="flex-1 text-left text-xs font-bold text-slate-600 uppercase tracking-widest">
                      {g.name}
                    </span>
                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDownIcon className="h-4 w-4 text-slate-400" />
                    </motion.div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="py-2 space-y-1">
                          {g.items.map((item) => (
                            <MenuItem key={item.name} item={item} />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }
            return <MenuItem key={g.name} item={g} />;
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors group">
          <div className="h-8 w-8 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center transition-colors">
            <ArrowRightOnRectangleIcon className="h-4 w-4 text-red-600" />
          </div>
          <span className="text-sm font-medium">Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      {/* Mobile Sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="p-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="bg-white w-full shadow-2xl">
                  <SidebarContent />
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col p-3">
        <div className="h-full bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
