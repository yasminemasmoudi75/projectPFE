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
  ArrowTopRightOnSquareIcon
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
  { name: 'Commandes', href: '/devis/orders', icon: DocumentCheckIcon, moduleCode: MODULE_CODES.DEVIS },
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
    <div className="flex h-full flex-col bg-white">
      {/* Branding Header */}
      <div className="px-6 py-10 flex flex-col items-center border-b border-slate-100/60">
        <div className="relative group transition-transform hover:scale-105 duration-300">
          <div className="h-24 w-56 flex items-center justify-center">
            <img src="/images/logonexus.png" className="h-full w-full object-contain" alt="Nexus CRM" />
          </div>
          <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
        </div>
        <p className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Nexus Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 scrollbar-none space-y-1">
        {filteredMenu.map((item, idx) => {
          if (item.type === 'section') {
            return (
              <div key={`section-${idx}`} className="px-4 pt-6 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">
                  {item.name}
                </p>
              </div>
            );
          }
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 relative overflow-hidden',
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-blue rounded-r-full"></div>
                  )}

                  {/* Icon */}
                  <div className={clsx(
                    "p-2.5 rounded-xl transition-all duration-300",
                    isActive
                      ? "bg-gradient-blue text-white shadow-glow-blue"
                      : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                  )}>
                    <item.icon className="h-4 w-4" strokeWidth={2} />
                  </div>

                  {/* Label */}
                  <span className={clsx(
                    "text-sm tracking-tight transition-all",
                    isActive ? "font-bold" : "font-medium"
                  )}>
                    {item.name}
                  </span>

                  {/* Hover arrow */}
                  {!isActive && (
                    <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-auto opacity-0 -translate-x-2 group-hover:opacity-40 group-hover:translate-x-0 transition-all" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Help Card */}
      <div className="mx-4 mb-6 mt-auto">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-blue p-5 shadow-glow-blue">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>

          <div className="relative z-10">
            <div className="h-10 w-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-4">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Besoin d'aide ?</h4>
            <p className="text-[11px] text-white/70 mb-4 leading-relaxed">
              Consultez notre documentation
            </p>
            <button className="w-full py-2.5 bg-white text-blue-600 rounded-xl text-xs font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
              Documentation
            </button>
          </div>
        </div>
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
