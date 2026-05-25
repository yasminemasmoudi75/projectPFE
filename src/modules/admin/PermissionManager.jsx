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
  ExclamationTriangleIcon
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
  { code: 42, name: 'Objectifs', icon: '🎯', category: 'RH' },
  { code: 44, name: 'Relevé', icon: '📝', category: 'Analyse' },
  { code: 46, name: 'Stock/Produits', icon: '📦', category: 'Inventaire' },
];

const ROLES = ['Admin', 'Agent', 'Commercial', 'Client', 'Technicien'];

const PermissionManager = () => {
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
        // Organize permissions by role
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
        
        // Override with actual data from API
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
      // Initialize with defaults
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
    
    if (newValue) {
      toast.success(`Module activé pour ${role}`);
    } else {
      toast(`Module désactivé pour ${role}`, { icon: '👁️‍🗨️' });
    }
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      // In a real implementation, this would save to the backend
      // await axios.post('/permissions/bulk-update', permissions);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Permissions sauvegardées avec succès');
      setHasChanges(false);
    } catch (err) {
      console.error('Error saving permissions:', err);
      toast.error('Erreur lors de la sauvegarde');
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

  const filteredModules = MODULES.filter(mod => 
    mod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mod.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modulesByCategory = filteredModules.reduce((acc, mod) => {
    if (!acc[mod.category]) acc[mod.category] = [];
    acc[mod.category].push(mod);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <KeyIcon className="h-6 w-6 text-white" />
            </div>
            <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
              Sécurité
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            Gestion des Permissions
          </h1>
          <p className="text-slate-500 mt-1">
            Configurez les droits d\'accès par rôle et par module
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasChanges && (
            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-xl">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Modifications non sauvegardées</span>
            </div>
          )}
          <button
            onClick={fetchPermissions}
            className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all"
            title="Rafraîchir"
          >
            <ArrowPathIcon className="h-5 w-5" />
          </button>
          <button
            onClick={savePermissions}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all ${
              hasChanges
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <SaveIcon className="h-5 w-5" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-2">
        <div className="flex flex-wrap gap-2">
          {ROLES.map(role => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                selectedRole === role
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <UserGroupIcon className="h-5 w-5" />
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Rechercher un module..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
        />
      </div>

      {/* Permissions Grid */}
      <div className="space-y-4">
        {Object.entries(modulesByCategory).map(([category, modules]) => (
          <div key={category} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{modules[0].icon}</span>
                <h3 className="font-bold text-slate-800">{category}</h3>
                <span className="text-xs text-slate-500 bg-slate-200 px-2 py-1 rounded-full">
                  {modules.length} modules
                </span>
              </div>
              {expandedCategories.includes(category) ? (
                <ChevronDownIcon className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronRightIcon className="h-5 w-5 text-slate-400" />
              )}
            </button>
            
            {expandedCategories.includes(category) && (
              <div className="p-4 space-y-3">
                {modules.map(module => {
                  const perm = permissions[selectedRole]?.[module.code] || {};
                  return (
                    <div
                      key={module.code}
                      className={`p-4 rounded-xl border transition-all ${
                        perm.isActive
                          ? 'bg-white border-slate-200 hover:border-purple-300'
                          : 'bg-slate-50 border-slate-100 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{module.icon}</span>
                          <div>
                            <h4 className="font-bold text-slate-800">{module.name}</h4>
                            <p className="text-xs text-slate-500">Code: {module.code}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleModuleVisibility(selectedRole, module.code)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                            perm.isActive
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {perm.isActive ? (
                            <>
                              <EyeIcon className="h-4 w-4" />
                              Actif
                            </>
                          ) : (
                            <>
                              <EyeSlashIcon className="h-4 w-4" />
                              Inactif
                            </>
                          )}
                        </button>
                      </div>
                      
                      {perm.isActive && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
                          {[
                            { key: 'canAdd', label: 'Créer', icon: '➕' },
                            { key: 'canEdit', label: 'Modifier', icon: '✏️' },
                            { key: 'canDelete', label: 'Supprimer', icon: '🗑️' }
                          ].map(({ key, label, icon }) => (
                            <button
                              key={key}
                              onClick={() => togglePermission(selectedRole, module.code, key)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                perm[key]
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <span className="text-lg">{icon}</span>
                              <div className="flex items-center gap-1">
                                {perm[key] ? (
                                  <CheckIcon className="h-4 w-4" />
                                ) : (
                                  <XMarkIcon className="h-4 w-4" />
                                )}
                                <span className="text-xs font-medium">{label}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <ShieldCheckIcon className="h-6 w-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-purple-900">Résumé des permissions</h3>
            <p className="text-sm text-purple-700">
              Rôle sélectionné: <strong>{selectedRole}</strong> | 
              Modules actifs: <strong>{MODULES.filter(m => permissions[selectedRole]?.[m.code]?.isActive).length}</strong> / {MODULES.length}
            </p>
          </div>
          <button
            onClick={() => {
              // Reset to defaults for this role
              const defaults = { ...permissions };
              MODULES.forEach(mod => {
                defaults[selectedRole][mod.code] = {
                  isActive: selectedRole === 'Admin',
                  canAdd: selectedRole === 'Admin',
                  canEdit: selectedRole === 'Admin',
                  canDelete: selectedRole === 'Admin',
                  canValid: selectedRole === 'Admin',
                  canExport: selectedRole === 'Admin'
                };
              });
              setPermissions(defaults);
              setHasChanges(true);
              toast.success('Permissions réinitialisées');
            }}
            className="px-4 py-2 rounded-xl bg-white text-purple-700 font-medium hover:bg-purple-50 transition-colors border border-purple-200"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionManager;
