import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import {
  Bars3Icon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  MagnifyingGlassIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';
import { logout } from '../auth/authSlice';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';
import NotificationBell from '../components/notifications/NotificationBell';

const ROLE_STYLES = {
  admin:       'bg-violet-100 text-violet-700',
  commercial:  'bg-sky-100 text-sky-700',
  commerciale: 'bg-sky-100 text-sky-700',
  agent:       'bg-emerald-100 text-emerald-700',
  technicien:  'bg-amber-100 text-amber-700',
  client:      'bg-rose-100 text-rose-700',
};

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Déconnexion réussie');
      navigate('/auth/login');
    } catch {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  const roleKey = String(user?.UserRole || '').toLowerCase();
  const roleBadge = ROLE_STYLES[roleKey] || 'bg-slate-100 text-slate-600';
  const roleLabel = user?.UserRole || 'Utilisateur';

  const initials = user?.FullName
    ?.split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-3 border-b border-slate-200/70 bg-white/95 backdrop-blur-sm px-4 sm:px-6 lg:px-8 shadow-[0_1px_0_0_rgba(226,232,240,0.8)]">

      {/* Mobile menu button */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-slate-500 hover:text-slate-700 lg:hidden rounded-lg hover:bg-slate-100 transition-colors"
        onClick={() => setSidebarOpen(true)}
      >
        <Bars3Icon className="h-5 w-5" />
      </button>

      {/* Mobile logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="h-7 w-7 rounded-lg bg-[#0062AF] flex items-center justify-center">
          <img src="/images/logonexus.png" className="h-4 w-4 object-contain" alt="Nexus" onError={(e) => { e.target.style.display='none'; }} />
        </div>
        <span className="font-bold text-slate-900 text-sm">NexusCRM</span>
      </div>

      <div className="h-5 w-px bg-slate-200 lg:hidden" />

      {/* Desktop search bar */}
      <div className="hidden lg:flex flex-1 max-w-sm">
        <div className="relative w-full">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0062AF]/40 focus:bg-white focus:ring-2 focus:ring-[#0062AF]/8 transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="ml-auto flex items-center gap-x-2 lg:gap-x-3">

        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(v => !v)}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          {searchOpen ? <XMarkIcon className="h-5 w-5" /> : <MagnifyingGlassIcon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <NotificationBell />

        <div className="hidden lg:block h-5 w-px bg-slate-200" />

        {/* Profile dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2.5 rounded-xl p-1.5 hover:bg-slate-100 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-[#0062AF]/30">
            {/* Avatar */}
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#0062AF] to-[#004a85] flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden shadow-sm">
              {user?.PhotoProfil ? (
                <img
                  className="h-8 w-8 rounded-lg object-cover"
                  src={getImageUrl(user.PhotoProfil)}
                  alt=""
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            {/* Name + role */}
            <div className="hidden lg:block text-left">
              <p className="text-sm font-semibold text-slate-900 leading-tight">
                {user?.FullName || 'Utilisateur'}
              </p>
              <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded-full', roleBadge)}>
                {roleLabel}
              </span>
            </div>

            <ChevronDownIcon className="hidden lg:block h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-all group-data-[headlessui-state=open]:rotate-180" />
          </Menu.Button>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 scale-95 translate-y-1"
            enterTo="transform opacity-100 scale-100 translate-y-0"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 scale-100 translate-y-0"
            leaveTo="transform opacity-0 scale-95 translate-y-1"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80 focus:outline-none overflow-hidden">

              {/* User info header */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <p className="text-xs font-bold text-slate-800 truncate">{user?.FullName || 'Utilisateur'}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{user?.EmailPro || ''}</p>
              </div>

              <div className="py-1.5">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={clsx(
                        'flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors',
                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                      )}
                    >
                      <UserCircleIcon className="h-4 w-4 text-slate-400" />
                      Mon Profil
                    </Link>
                  )}
                </Menu.Item>

                <Menu.Item>
                  {({ active }) => (
                    <Link
                      to="/profile"
                      className={clsx(
                        'flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors',
                        active ? 'bg-slate-50 text-slate-900' : 'text-slate-700'
                      )}
                    >
                      <Cog6ToothIcon className="h-4 w-4 text-slate-400" />
                      Paramètres
                    </Link>
                  )}
                </Menu.Item>
              </div>

              <div className="border-t border-slate-100 py-1.5">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={clsx(
                        'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors',
                        active ? 'bg-rose-50 text-rose-600' : 'text-slate-700'
                      )}
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Déconnexion
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>

      {/* Mobile search bar (expandable) */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 lg:hidden bg-white border-b border-slate-200 px-4 py-3 shadow-md"
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-9 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#0062AF]/50 focus:ring-2 focus:ring-[#0062AF]/10 transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
