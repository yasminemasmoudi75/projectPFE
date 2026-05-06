import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
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
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  HomeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import useAuth from '../hooks/useAuth';
import { logout } from '../auth/authSlice';
import toast from 'react-hot-toast';
import { getImageUrl } from '../utils/imageUrl';
import NotificationBell from '../components/notifications/NotificationBell';

const Navbar = ({ setSidebarOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      toast.success('Déconnexion réussie');
      navigate('/auth/login');
    } catch (error) {
      toast.error('Erreur lors de la déconnexion');
    }
  };

  return (
    <div className="sticky top-0 z-40 h-16 flex shrink-0 items-center border-b border-slate-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8 gap-x-4">
      {/* Mobile Menu Button */}
      <button type="button" className="-m-2.5 p-2.5 text-slate-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
        <Bars3Icon className="h-6 w-6" />
      </button>

      {/* Mobile Logo */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-md">
          <img src="/images/logonexus.png" className="h-5 w-5 object-contain" alt="Nexus" />
        </div>
        <span className="font-semibold text-slate-900">NexusCRM</span>
      </div>

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 lg:hidden" />

      {/* Right side: Search and Actions */}
      <div className="ml-auto flex items-center gap-x-4 lg:gap-x-6">
        <NotificationBell />

        {/* Separator */}
        <div className="hidden lg:block h-6 w-px bg-slate-200" />

        {/* Profile Dropdown */}
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-100 transition-colors group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold text-sm">
              {user?.PhotoProfil ? (
                <img
                  className="h-8 w-8 rounded-lg object-cover"
                  src={getImageUrl(user.PhotoProfil)}
                  alt=""
                />
              ) : (
                user?.FullName?.charAt(0) || 'U'
              )}
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-semibold text-slate-900">{user?.FullName || 'Utilisateur'}</p>
              <p className="text-xs text-slate-500">{user?.UserRole || 'Admin'}</p>
            </div>
            <ChevronDownIcon className="hidden lg:block h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
          </Menu.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white py-2 shadow-lg ring-1 ring-slate-200 focus:outline-none">
              <Menu.Item>
                {({ active }) => (
                  <Link
                    to="/profile"
                    className={clsx(
                      active ? 'bg-slate-100' : '',
                      'block px-4 py-2 text-sm text-slate-900'
                    )}
                  >
                    Mon Profil
                  </Link>
                )}
              </Menu.Item>
              <div className="my-1 h-px bg-slate-200" />
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={clsx(
                      active ? 'bg-slate-100' : '',
                      'block w-full text-left px-4 py-2 text-sm text-slate-900'
                    )}
                  >
                    Déconnexion
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </div>
  );
};

export default Navbar;
