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
import { getImageUrl } from '../utils/imageUrl';

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
    <div className="sticky top-0 z-40 bg-gradient-to-b from-white/80 via-white/70 to-white/50 backdrop-blur-2xl border-b border-slate-200/30 shadow-sm transition-all hover:shadow-md duration-300">
      {/* Decorative top gradient line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>

      <div className="flex h-20 shrink-0 items-center justify-between px-6 lg:px-12 transition-all">
        {/* Left Section: Menu & Logo */}
        <div className="flex items-center gap-4 lg:gap-6">
          <button
            type="button"
            className="p-3 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 text-slate-600 lg:hidden hover:bg-slate-200 transition-all active:scale-95 shadow-sm hover:shadow-md"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          {/* Corporate Logo in Navbar - Enhanced */}
          <div className="flex items-center group ml-2 lg:ml-0">
            <div className="h-12 w-48 flex items-center justify-start overflow-hidden transition-all duration-500 hover:scale-[1.03] active:scale-95">
              <img src="/images/logo-bs.png" className="h-full w-full object-contain filter hover:brightness-110 transition-all" alt="Business Software" />
            </div>
          </div>
        </div>



        {/* Right Section: Status & Actions - Enhanced */}
        <div className="flex items-center gap-4 lg:gap-5">
          {/* Time Widget - More Professional */}
          <div className="hidden 2xl:flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-transparent border border-slate-200/50 rounded-xl hover:border-blue-200 transition-all shadow-sm hover:shadow-md">
            <ClockIcon className="h-4 w-4 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-600 tracking-wider uppercase">
              {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Messages */}
            <button className="relative p-3 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-95 group shadow-sm hover:shadow-md duration-300">
              <EnvelopeIcon className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full ring-2 ring-white animation-pulse"></span>
            </button>

            {/* Notifications Popover - Enhanced */}
            <Popover className="relative">
              <Popover.Button className="relative p-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all active:scale-95 outline-none shadow-sm hover:shadow-md duration-300">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
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
                <Popover.Panel className="absolute right-0 z-50 mt-4 w-80 origin-top-right overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100/50">
                  <div className="p-4 flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-50 to-transparent">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Notifications</h3>
                    <button className="text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors">Tout marquer</button>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2 space-y-2">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-3 rounded-xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-slate-100/50 group">
                        <div className="flex items-start gap-3">
                          <div className={clsx(
                            "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm group-hover:shadow-md transition-all",
                            n.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                              n.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                          )}>
                            <CheckCircleIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 leading-tight">{n.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{n.desc}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{n.time} ago</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full py-3 bg-gradient-to-r from-slate-50 to-transparent text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all border-t border-slate-100">
                    Voir tous les notifications
                  </button>
                </Popover.Panel>
              </Transition>
            </Popover>
          </div>

          <div className="h-8 w-px bg-gradient-to-b from-slate-200/0 via-slate-200 to-slate-200/0 mx-2 hidden lg:block"></div>

          {/* User Profile Menu - Enhanced */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center gap-3 p-1 rounded-xl bg-gradient-to-br from-white to-slate-50 border border-slate-200/50 hover:border-blue-200 hover:shadow-md active:scale-95 transition-all outline-none group pr-2">
              <div className="relative">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30 transition-all duration-300 group-hover:scale-110 overflow-hidden group-active:scale-95">
                  {user?.PhotoProfil ? (
                    <img src={getImageUrl(user.PhotoProfil)} alt={user.FullName} className="w-full h-full object-cover" />
                  ) : (
                    user?.FullName?.charAt(0) || 'U'
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-emerald-500 rounded-full border-2 border-white shadow-md animate-pulse"></div>
              </div>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-bold text-slate-800 tracking-tight leading-none mb-0.5 group-hover:text-blue-600 transition-colors">
                  {user?.FullName?.split(' ')[0] || 'Utilisateur'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold text-slate-500/80 uppercase tracking-widest">
                    {user?.UserRole || 'Membre'}
                  </span>
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
              <Menu.Items className="absolute right-0 z-50 mt-3 w-72 origin-top-right p-2 bg-white rounded-2xl shadow-2xl border border-slate-100/50 focus:outline-none overflow-hidden">
                <div className="p-4 mb-2 bg-gradient-to-br from-blue-50/50 to-indigo-50/30 rounded-xl border border-blue-100/30">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/30 overflow-hidden">
                      {user?.PhotoProfil ? (
                        <img src={getImageUrl(user.PhotoProfil)} alt={user.FullName} className="w-full h-full object-cover" />
                      ) : (
                        user?.FullName?.charAt(0)
                      )}
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-800 leading-none">{user?.FullName}</p>
                      <p className="text-[9px] font-semibold text-slate-500 mt-1 uppercase tracking-wider">Session: <span className="text-blue-600">#{Math.floor(Math.random() * 9000) + 1000}</span></p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white/80 p-3 rounded-lg border border-blue-50 text-center hover:shadow-sm transition-all">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Role</p>
                      <p className="text-[10px] font-bold text-slate-800 uppercase mt-1">{user?.UserRole}</p>
                    </div>
                    <div className="bg-white/80 p-3 rounded-lg border border-emerald-50 text-center hover:shadow-sm transition-all">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Points</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">2.4k</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 p-2">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                          active ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        <UserCircleIcon className="h-4 w-4" />
                        Profil & Sécurité
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/ia')}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                          active ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        <SparklesIcon className="h-4 w-4 text-blue-500" />
                        Nexus Intelligence
                      </button>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => navigate('/profile')}
                        className={clsx(
                          'flex w-full items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                          active ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        <Cog6ToothIcon className="h-4 w-4" />
                        Préférences Suite
                      </button>
                    )}
                  </Menu.Item>
                </div>

                <div className="mx-2 my-2 border-t border-slate-100/50"></div>

                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        'flex w-full items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                        active ? 'bg-rose-50 text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
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
