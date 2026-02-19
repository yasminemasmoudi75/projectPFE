import { Fragment, useState, useEffect } from 'react';
import { Menu, Transition, Popover } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  SparklesIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  ArrowsPointingOutIcon,
  CheckCircleIcon,
  ClockIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';
import { logout } from '../auth/authSlice';
import toast from 'react-hot-toast';

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Déconnexion réussie');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    const parts = path.split('/').filter(Boolean);

    const mapping = {
      dashboard: { title: 'Tableau de Bord', breadcrumb: 'Aperçu', icon: SparklesIcon },
      clients: { title: 'Gestion Clients', breadcrumb: 'CRM Core', icon: UserCircleIcon },
      users: { title: 'Collaborateurs', breadcrumb: 'Système', icon: SparklesIcon },
      devis: { title: 'Dossiers Ventes', breadcrumb: 'Finance', icon: DocumentTextIcon },
      products: { title: 'Catalogue Stock', breadcrumb: 'Logistique', icon: CubeIcon },
      profile: { title: 'Paramètres', breadcrumb: 'Compte', icon: Cog6ToothIcon },
      ia: { title: 'Nexus IA Engine', breadcrumb: 'Intelligence', icon: SparklesIcon }
    };

    const mainPart = parts[0] || 'dashboard';
    return mapping[mainPart] || { title: 'Application', breadcrumb: 'Nexus', icon: SparklesIcon };
  };

  const { title, breadcrumb } = getPageTitle();

  const notifications = [
    { id: 1, title: 'Nouveau Devis', desc: 'Validé par Tech Solutions', time: '5m', type: 'success' },
    { id: 2, title: 'Rappel Projet', desc: 'Réunion à 14h00', time: '1h', type: 'warning' },
    { id: 3, title: 'Nexus AI', desc: 'Mise à jour des analyses', time: '3h', type: 'info' }
  ];

  return (
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all">
      {/* Decorative top line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#3477f2]/10 via-[#3477f2] to-[#3477f2]/10"></div>

      <div className="flex h-20 shrink-0 items-center justify-between px-6 lg:px-12 transition-all">
        {/* Left Section: Maximized Logo Only */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            className="p-3 rounded-2xl bg-slate-100/50 border border-slate-200 text-slate-600 lg:hidden hover:bg-slate-200 transition-all active:scale-95"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Corporate Logo in Navbar */}
          <div className="flex items-center group ml-6">
            <div className="h-12 w-48 flex items-center justify-start overflow-hidden transition-transform duration-500 hover:scale-[1.05]">
              <img src="/images/logo-bs.png" className="h-full w-full object-contain" alt="Business Software" />
            </div>
          </div>
        </div>



        {/* Right Section: Status & Actions */}
        <div className="flex items-center gap-5">
          {/* Time Widget */}
          <div className="hidden 2xl:flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-black text-slate-600 tracking-wider uppercase">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Messages */}
            <button className="relative p-3 rounded-2xl text-slate-400 hover:text-[#3477f2] hover:bg-[#3477f2]/5 transition-all active:scale-95 group">
              <EnvelopeIcon className="h-5 w-5" />
              <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-[#3477f2] rounded-full ring-2 ring-white"></span>
            </button>

            {/* Notifications Popover */}
            <Popover className="relative">
              <Popover.Button className="relative p-3 rounded-2xl text-slate-400 hover:text-[#3477f2] hover:bg-[#3477f2]/5 transition-all active:scale-95 outline-none">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
              </Popover.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute right-0 z-50 mt-4 w-80 origin-top-right overflow-hidden rounded-[2rem] bg-white p-2 shadow-soft-xl border border-slate-100">
                  <div className="p-4 flex items-center justify-between border-b border-slate-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Notifications</h3>
                    <button className="text-[10px] font-bold text-blue-600 hover:underline">Tout marquer</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-4 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100">
                        <div className="flex items-start gap-4">
                          <div className={clsx(
                            "h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                            n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                              n.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                          )}>
                            <CheckCircleIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800 leading-tight">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{n.desc}</p>
                            <p className="text-[10px] text-slate-300 mt-2 font-bold uppercase">{n.time} ago</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-all">
                    Voir toutes les notifications
                  </button>
                </Popover.Panel>
              </Transition>
            </Popover>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2 hidden lg:block"></div>

          {/* User Profile Deep Navigation */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-4 p-1 rounded-2xl bg-white border border-slate-100 hover:border-[#3477f2]/30 hover:shadow-soft transition-all outline-none group pr-3">
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-black text-sm shadow-glow-blue transition-transform duration-500 group-hover:scale-110">
                  {user?.FullName?.charAt(0) || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 h-3.5 w-3.5 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-black text-slate-800 tracking-tight leading-none mb-0.5 lowercase first-letter:uppercase group-hover:text-[#3477f2] transition-colors">
                  {user?.FullName?.split(' ')[0] || 'Utilisateur'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {user?.UserRole || 'Membre'}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                  <span className="text-[9px] font-bold text-[#3477f2] uppercase tracking-widest">Admin</span>
                </div>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="transform opacity-0 scale-95 translate-y-2"
              enterTo="transform opacity-100 scale-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="transform opacity-100 scale-100 translate-y-0"
              leaveTo="transform opacity-0 scale-95 translate-y-2"
            >
              <Menu.Items className="absolute right-0 z-50 mt-4 w-72 origin-top-right p-2 bg-white rounded-[2rem] shadow-soft-xl border border-slate-100 focus:outline-none overflow-hidden">
                <div className="p-4 mb-2 bg-gradient-to-br from-slate-50 to-blue-50/50 rounded-[1.5rem] border border-blue-100/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-gradient-blue flex items-center justify-center text-white font-black text-lg">
                      {user?.FullName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-base font-black text-slate-800 leading-none">{user?.FullName}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Session: <span className="text-[#3477f2]">#{Math.floor(Math.random() * 9000) + 1000}</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/60 p-2 rounded-xl border border-blue-50 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Role</p>
                      <p className="text-[10px] font-black text-slate-800 uppercase">{user?.UserRole}</p>
                    </div>
                    <div className="bg-white/60 p-2 rounded-xl border border-blue-50 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Points</p>
                      <p className="text-[10px] font-black text-emerald-600 uppercase">2,4k</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all',
                          active ? 'bg-slate-50 text-[#3477f2]' : 'text-slate-500 hover:text-slate-800'
                        )}
                      >
                        <UserCircleIcon className="h-5 w-5" />
                        Profil & Sécurité
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/ia')}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all',
                          active ? 'bg-slate-50 text-[#3477f2]' : 'text-slate-500 hover:text-slate-800'
                        )}
                      >
                        <SparklesIcon className="h-5 w-5 text-blue-400" />
                        Nexus Intelligence
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest rounded-[1.25rem] transition-all',
                          active ? 'bg-slate-50 text-[#3477f2]' : 'text-slate-500 hover:text-slate-800'
                        )}
                      >
                        <Cog6ToothIcon className="h-5 w-5" />
                        Préférences Suite
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="mx-4 my-2 border-t border-slate-100"></div>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        'flex w-full items-center gap-3 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] rounded-[1.25rem] transition-all',
                        active ? 'bg-rose-50 text-rose-600' : 'text-slate-400'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Sign Out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
