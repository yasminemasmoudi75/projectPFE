import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../app/axios';
import useAuth from '../../hooks/useAuth';
import {
  KeyIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  UserGroupIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SaveIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const MODULES = [
  { code: 3, name: 'Projets', icon: '📁', category: 'CRM' },
  { code: 4, name: 'Devis', icon: '📄', category: 'Ventes' },
  { code: 5, name: 'Commandes', icon: '📦', category: 'Ventes' },
  { code: 6, name: 'Livraisons', icon: '🚚', category: 'Ventes' },
  { code: 7, name: 'Factures', icon: '💰', category: 'Ventes' },
  { code: 30, name: 'Clients', icon: '👥', category: 'CRM' },
  { code: 31, name: 'Règlement/SAV', icon: '🔧', category: 'Support' },
  { code: 40, name: 'Tournée', icon: '📍', category: 'Logistique' },
  { code: 41, name: 'Chargement', icon: '⚡', category: 'Logistique' },
  { code: 42, name: 'Objectifs', icon: '🎯', category: 'RH' },
  { code: 43, name: 'Recap', icon: '📊', category: 'Analyse' },
  { code: 44, name: 'Relevé', icon: '📝', category: 'Analyse' },
  { code: 45, name: 'Visites', icon: '🚶', category: 'CRM' },
  { code: 46, name: 'Stock/Produits', icon: '📦', category: 'Inventaire' },
  { code: 47, name: 'Solde Client', icon: '💳', category: 'Finance' },
  { code: 52, name: 'Maps', icon: '🗺️', category: 'Logistique' }
];

const ROLES = ['Admin', 'Agent', 'Commercial', 'Client', 'Technicien'];

const PermissionManagerPro = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState('Admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState(['Ventes', 'CRM']);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Accès réservé aux administrateurs');
      navigate('/dashboard');
      return;
    }
    fetchPermissions();
  }, [isAdmin, navigate]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/permissions/all');
      if (response.data?.status === 'success') {
        const permsByRole = {};
        ROLES.forEach(role => {
          permsByRole[role] = {};
          MODULES.forEach(mod => {
            permsByRole[role][mod.code] = {
              isActive: true,
              canAdd: true,
              canEdit: true,
              canDelete: true,
              canValid: true,
              canExport: true
            };
          });
        });
        
        const apiPerms = response.data.data || [];
        apiPerms.forEach(perm => {
          const role = perm.ProfileUser || perm.profileUser;
          const code = perm.CodMod || perm.moduleCode;
          if (permsByRole[role] && permsByRole[role][code]) {
            permsByRole[role][code] = {
              isActive: perm.Actif === 1 || perm.isActive === true,
              canAdd: perm.canAdd === 1 || perm.canCreate === true,
              canEdit: perm.canEdit === 1 || perm.canEdit === true,
              canDelete: perm.canDelt === 1 || perm.canDelete === true,
              canValid: perm.canValid === 1 || perm.canValidate === true,
              canExport: perm.CanImp === 1 || perm.canExport === true
            };
          }
        });
        
        setPermissions(permsByRole);
      }
    } catch (err) {
      console.error('Error fetching permissions:', err);
      toast.error('Erreur lors du chargement des permissions');
      const defaults = {};
      ROLES.forEach(role => {
        defaults[role] = {};
        MODULES.forEach(mod => {
          defaults[role][mod.code] = {
            isActive: role === 'Admin',
            canAdd: role === 'Admin',
            canEdit: role === 'Admin',
            canDelete: role === 'Admin',
            canValid: role === 'Admin',
            canExport: role === 'Admin'
          };
        });
      });
      setPermissions(defaults);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (role, moduleCode, field) => {
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleCode]: {
          ...prev[role][moduleCode],
          [field]: !prev[role][moduleCode][field]
        }
      }
    }));
    setHasChanges(true);
  };

  const toggleModuleVisibility = (role, moduleCode) => {
    const newValue = !permissions[role][moduleCode].isActive;
    setPermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [moduleCode]: {
          ...prev[role][moduleCode],
          isActive: newValue
        }
      }
    }));
    setHasChanges(true);
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      await axios.post('/permissions/update', permissions);
      toast.success('Permissions sauvegardées avec succès!');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Erreur lors de la sauvegarde des permissions');
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const categories = [...new Set(MODULES.map(m => m.category))].sort();
  const filteredModules = MODULES.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-purple-600"></div>
        <p className="text-slate-500 font-medium">Chargement des permissions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* HEADER */}
      <div className="relative overflow-hidden rounded-3xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-900 opacity-95"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml,%3Csvg%20width=%2760%27%20height=%2760%27%20viewBox=%270%200%2060%2060%27%20xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cg%20fill=%27none%27%20fill-rule=%27evenodd%27%3E%3Cg%20fill=%27%23ffffff%27%20fill-opacity=%270.05%27%3E%3Cpath%20d=%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        
        <div className="relative px-8 py-12 md:px-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <KeyIcon className="h-6 w-6 text-white" />
            </div>
            <span className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-bold uppercase tracking-wide">
              🔐 Gestion des Permissions
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">
            Contrôle d'Accès
          </h1>
          <p className="text-purple-100 text-lg font-medium max-w-2xl">
            Gérez précisément les droits d'accès par rôle et par module
          </p>
        </div>
      </div>

      {/* ROLE SELECTOR & SEARCH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Selector */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-5 w-5 text-purple-600" />
            Sélectionner un Rôle
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(role => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                  selectedRole === role
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-purple-300'
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5 mx-auto mb-2" />
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <MagnifyingGlassIcon className="h-5 w-5 text-purple-600" />
            Rechercher un Module
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Ex: Devis, Clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition"
            />
            <MagnifyingGlassIcon className="absolute right-3 top-3.5 h-5 w-5 text-slate-300" />
          </div>
        </div>
      </div>

      {/* MODULE PERMISSIONS GRID */}
      <div className="space-y-6">
        {categories.map(category => {
          const categoryModules = filteredModules.filter(m => m.category === category);
          if (categoryModules.length === 0) return null;

          return (
            <div key={category} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100"
              >
                <h3 className="text-lg font-bold text-slate-900">{category}</h3>
                <ChevronDownIcon
                  className={`h-5 w-5 text-slate-400 transition-transform ${
                    expandedCategories.includes(category) ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Category Modules */}
              {expandedCategories.includes(category) && (
                <div className="p-6 space-y-4 bg-slate-50">
                  {categoryModules.map(module => (
                    <div
                      key={module.code}
                      className="rounded-xl border border-slate-200 bg-white p-6 hover:shadow-md transition-shadow"
                    >
                      {/* Module Header */}
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{module.icon}</span>
                          <div>
                            <h4 className="font-bold text-slate-900">{module.name}</h4>
                            <p className="text-xs text-slate-500">Module code: {module.code}</p>
                          </div>
                        </div>

                        {/* Visibility Toggle */}
                        <button
                          onClick={() => toggleModuleVisibility(selectedRole, module.code)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                            permissions[selectedRole]?.[module.code]?.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {permissions[selectedRole]?.[module.code]?.isActive ? (
                            <>
                              <EyeIcon className="h-4 w-4" />
                              Visible
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="h-4 w-4" />
                              Caché
                            </>
                          )}
                        </button>
                      </div>

                      {/* Permission Checkboxes */}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {[
                          { key: 'canAdd', label: '➕ Créer', icon: CheckIcon },
                          { key: 'canEdit', label: '✏️ Modifier', icon: CheckIcon },
                          { key: 'canDelete', label: '🗑️ Supprimer', icon: CheckIcon },
                          { key: 'canValid', label: '✅ Valider', icon: CheckIcon },
                          { key: 'canExport', label: '📥 Exporter', icon: CheckIcon },
                          { key: 'isActive', label: '🔓 Access', icon: CheckIcon }
                        ].map(perm => (
                          <button
                            key={perm.key}
                            onClick={() => togglePermission(selectedRole, module.code, perm.key)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 font-semibold transition-all ${
                              permissions[selectedRole]?.[module.code]?.[perm.key]
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-slate-200 bg-white text-slate-400'
                            }`}
                          >
                            {perm.label.split(' ')[0]}
                            <span className="text-xs font-medium">{perm.label.split(' ')[1]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SAVE BUTTON */}
      {hasChanges && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={savePermissions}
            disabled={saving}
            className="flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-5 w-5" />
                Sauvegarder les modifications
              </>
            )}
          </button>
        </div>
      )}

      {/* INFO BOX */}
      {!hasChanges && (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 flex items-start gap-4">
          <CheckCircleIcon className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-900">Aucune modification en cours</h4>
            <p className="text-sm text-emerald-700 mt-1">Faites des modifications pour voir le bouton de sauvegarde apparaître</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PermissionManagerPro;
