import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
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
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';
import { filterMenuByPermissions } from '../utils/permissions';
import { MODULE_CODES } from '../utils/constants';

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, moduleCode: MODULE_CODES.DASHBOARD },
  { type: 'section', name: 'CRM & Ventes' },
  { name: 'Clients', href: '/clients', icon: UserGroupIcon, moduleCode: MODULE_CODES.CLIENTS },
  { name: 'Devis', href: '/devis', icon: DocumentTextIcon, moduleCode: MODULE_CODES.DEVIS },
  { name: 'Bons de Commande', href: '/bcv', icon: ShoppingBagIcon, moduleCode: MODULE_CODES.DEVIS },
  { name: 'Livraisons', href: '/blv', icon: TruckIcon, moduleCode: MODULE_CODES.DEVIS },
  { name: 'Factures', href: '/fav', icon: BanknotesIcon, moduleCode: MODULE_CODES.DEVIS },
  { name: 'Mouvements', href: '/mouvements', icon: ArrowPathIcon, moduleCode: MODULE_CODES.DEVIS },
  { name: 'Projets', href: '/projets', icon: BriefcaseIcon, moduleCode: MODULE_CODES.PROJETS },
  { type: 'section', name: 'Opérations' },
  { name: 'Activités', href: '/activites', icon: CalendarIcon, moduleCode: MODULE_CODES.ACTIVITES },
  { name: 'Calendrier', href: '/calendar', icon: CalendarIcon, moduleCode: MODULE_CODES.ACTIVITES },
  { name: 'Produits', href: '/products', icon: CubeIcon, moduleCode: MODULE_CODES.STOCK },
  { name: 'SAV', href: '/claims', icon: LifebuoyIcon, moduleCode: MODULE_CODES.SAV },
  { type: 'section', name: 'Intelligence' },
  { name: 'Objectifs', href: '/objectifs', icon: ChartBarIcon, moduleCode: MODULE_CODES.OBJECTIFS },
  { name: 'Nexus IA', href: '/ia', icon: SparklesIcon, moduleCode: MODULE_CODES.IA },
  { name: 'Messages', href: '/messages', icon: ChatBubbleLeftRightIcon, moduleCode: MODULE_CODES.MESSAGES },
  { type: 'section', name: 'Système' },
  { name: 'Utilisateurs', href: '/users', icon: UsersIcon, moduleCode: MODULE_CODES.USERS },
  { name: 'Paramètres', href: '/profile', icon: Cog6ToothIcon },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();
  const filteredMenu = filterMenuByPermissions(menuItems, user);

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-white via-slate-50/50 to-white">
      {/* Premium Branding Header */}
      <div className="px-6 py-8 flex flex-col items-center border-b border-slate-100/50 bg-gradient-to-br from-blue-50/30 to-transparent">
        <div className="relative group transition-transform hover:scale-110 duration-500">
          <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 blur"></div>
          <div className="relative h-20 w-48 flex items-center justify-center">
            <img src="/images/logonexus.png" className="h-full w-full object-contain filter group-hover:brightness-110 transition-all" alt="Nexus CRM" />
          </div>
        </div>
        <p className="mt-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.35em] group-hover:text-blue-600 transition-colors">Nexus Intelligence</p>
        <p className="text-[8px] text-slate-300 mt-1">Enterprise CRM v2.0</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-5 scrollbar-none space-y-0.5">
        {filteredMenu.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={`section-${idx}`} className="px-4 pt-5 pb-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap flex-shrink-0">
                    {item.name}
                  </p>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                </div>
              </div>
            );
          }
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-1 rounded-2xl px-4 py-3 transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator with gradient */}
                  {isActive && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full shadow-md"></div>
                    </>
                  )}

                  {/* Label with better typography */}
                  <span className={clsx(
                    "text-base tracking-tight transition-all flex-1 font-medium",
                    isActive ? "font-semibold text-blue-700" : "text-slate-700 group-hover:text-slate-900"
                  )}>
                    {item.name}
                  </span>


                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Section */}
      <div className="border-t border-slate-100/50 p-4 bg-gradient-to-t from-slate-50/50 to-transparent">
      </div>

    </div>
  );

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
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col p-4">
        <div className="h-full bg-white rounded-3xl shadow-soft-xl border border-slate-100 overflow-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
