import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePermissions } from '../hooks/usePermissions';
import { MODULE_CODES, USER_ROLES, ACTION_TYPES } from '../utils/constants';

/**
 * RoleModuleMatrix Component
 * Displays a comprehensive table of which roles have access to which modules
 * Shows granular permissions: View, Create, Edit, Delete, Validate, Export
 * 
 * Used by:
 * - Admin dashboard to visualize permission structure
 * - Permission management interface
 * - Audit/compliance reporting
 */
export const RoleModuleMatrix = () => {
  const { user } = useAuth();
  const { permissions } = usePermissions();
  const [matrixData, setMatrixData] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  // Module definitions with metadata
  const MODULES = [
    { code: MODULE_CODES.USERS, name: 'Utilisateurs', status: 'complete', features: ['Admin only'] },
    { code: MODULE_CODES.MESSAGES, name: 'Messages', status: 'complete', features: [] },
    { code: MODULE_CODES.PROJETS, name: 'Projets', status: 'complete', features: [] },
    { code: MODULE_CODES.DEVIS, name: 'Devis', status: 'complete', features: ['Filtrage personnalisé'] },
    { code: MODULE_CODES.COMMANDES, name: 'Commandes (BCV)', status: 'complete', features: ['Filtrage personnalisé'] },
    { code: MODULE_CODES.LIVRAISONS, name: 'Livraisons (BLV)', status: 'incomplete', features: ['⚠️ Filtrage manquant'] },
    { code: MODULE_CODES.FACTURES, name: 'Factures (FAV)', status: 'incomplete', features: ['⚠️ Filtrage manquant'] },
    { code: MODULE_CODES.CALENDRIER, name: 'Calendrier', status: 'empty', features: ['🔴 Non-implémenté'] },
    { code: MODULE_CODES.CLIENTS, name: 'Clients', status: 'complete', features: ['Filtrage personnalisé'] },
    { code: MODULE_CODES.REGLEMENT, name: 'SAV/Réclamations', status: 'complete', features: ['Logique spéciale'] },
    { code: MODULE_CODES.MENU, name: 'Menu', status: 'hardcoded', features: ['Lecture seule'] },
    { code: MODULE_CODES.TOURNEE, name: 'Tournée', status: 'empty', features: ['🔴 Non-implémenté'] },
    { code: MODULE_CODES.CHARGEMENT, name: 'Activités/Chargement', status: 'complete', features: [] },
    { code: MODULE_CODES.OBJECTIFS, name: 'Objectifs', status: 'complete', features: [] },
    { code: MODULE_CODES.RECAP, name: 'Recap', status: 'empty', features: ['🔴 Non-implémenté'] },
    { code: MODULE_CODES.RELEVE, name: 'Relevé', status: 'empty', features: ['🔴 Non-implémenté'] },
    { code: MODULE_CODES.VISITES, name: 'Visites', status: 'complete', features: [] },
    { code: MODULE_CODES.STOCK, name: 'Stock', status: 'complete', features: ['Filtrage personnalisé'] },
    { code: MODULE_CODES.SOLDE_CLIENT, name: 'Solde Client', status: 'complete', features: [] },
    { code: MODULE_CODES.MAPS, name: 'Maps', status: 'complete', features: [] },
  ];

  // Role-based access matrix (from database or fallback)
  const ROLE_PERMISSIONS = {
    [USER_ROLES.ADMIN]: {
      displayName: 'Admin',
      color: 'bg-red-50',
      description: 'Accès complet à tous les modules actifs. Doit respecter TabAWProfileAccess.'
    },
    [USER_ROLES.COMMERCIAL]: {
      displayName: 'Commercial',
      color: 'bg-blue-50',
      description: 'Accès limité à 11 modules de vente. Données filtrées par représentant.'
    },
    [USER_ROLES.AGENT]: {
      displayName: 'Agent',
      color: 'bg-blue-50',
      description: 'Même permissions que Commercial. Données filtrées par représentant.'
    },
    [USER_ROLES.TECHNICIEN]: {
      displayName: 'Technicien',
      color: 'bg-purple-50',
      description: 'Accès spécialisé: SAV, Stock, Activités. Rôle support.'
    },
    [USER_ROLES.CLIENT]: {
      displayName: 'Client',
      color: 'bg-green-50',
      description: 'Accès en lecture seule. Peut créer SAV uniquement.'
    },
  };

  // Action types with display info
  const ACTION_ICONS = {
    [ACTION_TYPES.VIEW]: '👁️',
    [ACTION_TYPES.CREATE]: '➕',
    [ACTION_TYPES.EDIT]: '✏️',
    [ACTION_TYPES.DELETE]: '🗑️',
    [ACTION_TYPES.VALIDATE]: '✅',
    [ACTION_TYPES.EXPORT]: '📊',
  };

  // Get color for module status
  const getStatusColor = (status) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100';
      case 'incomplete':
        return 'bg-yellow-100';
      case 'empty':
        return 'bg-red-100';
      case 'hardcoded':
        return 'bg-orange-100';
      default:
        return 'bg-gray-100';
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'complete':
        return <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs">✅ COMPLET</span>;
      case 'incomplete':
        return <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs">⚠️ INCOMPLET</span>;
      case 'empty':
        return <span className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs">🔴 VIDE</span>;
      case 'hardcoded':
        return <span className="px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs">🔧 HARDCODED</span>;
      default:
        return null;
    }
  };

  // Generate matrix data (in real app, fetch from API)
  useEffect(() => {
    // This would come from backend: GET /api/admin/matrix/roles-modules
    // For now, using fallback structure
    const generateMatrix = () => {
      return MODULES.map((module) => ({
        ...module,
        roles: {
          [USER_ROLES.ADMIN]: {
            canView: module.code !== null,
            canCreate: module.status !== 'empty',
            canEdit: module.status !== 'empty',
            canDelete: module.status !== 'empty',
            canValidate: module.code === MODULE_CODES.DEVIS || module.code === MODULE_CODES.COMMANDES,
            canExport: ['complete'].includes(module.status),
          },
          [USER_ROLES.COMMERCIAL]: {
            canView: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.CLIENTS, MODULE_CODES.MESSAGES, MODULE_CODES.STOCK, MODULE_CODES.CHARGEMENT, MODULE_CODES.OBJECTIFS, MODULE_CODES.VISITES, MODULE_CODES.SOLDE_CLIENT, MODULE_CODES.PROJETS, MODULE_CODES.FACTURES].includes(module.code),
            canCreate: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.CLIENTS, MODULE_CODES.MESSAGES, MODULE_CODES.CHARGEMENT, MODULE_CODES.OBJECTIFS, MODULE_CODES.VISITES].includes(module.code),
            canEdit: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.CLIENTS, MODULE_CODES.MESSAGES, MODULE_CODES.STOCK, MODULE_CODES.CHARGEMENT, MODULE_CODES.OBJECTIFS, MODULE_CODES.FACTURES].includes(module.code),
            canDelete: false,
            canValidate: false,
            canExport: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.FACTURES].includes(module.code),
          },
          [USER_ROLES.AGENT]: {
            canView: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.CLIENTS, MODULE_CODES.MESSAGES, MODULE_CODES.STOCK, MODULE_CODES.CHARGEMENT, MODULE_CODES.OBJECTIFS, MODULE_CODES.VISITES, MODULE_CODES.SOLDE_CLIENT, MODULE_CODES.PROJETS, MODULE_CODES.FACTURES].includes(module.code),
            canCreate: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.CLIENTS, MODULE_CODES.MESSAGES, MODULE_CODES.CHARGEMENT, MODULE_CODES.OBJECTIFS, MODULE_CODES.VISITES].includes(module.code),
            canEdit: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.CLIENTS, MODULE_CODES.MESSAGES, MODULE_CODES.STOCK, MODULE_CODES.CHARGEMENT, MODULE_CODES.OBJECTIFS, MODULE_CODES.FACTURES].includes(module.code),
            canDelete: false,
            canValidate: false,
            canExport: [MODULE_CODES.DEVIS, MODULE_CODES.COMMANDES, MODULE_CODES.FACTURES].includes(module.code),
          },
          [USER_ROLES.TECHNICIEN]: {
            canView: [MODULE_CODES.REGLEMENT, MODULE_CODES.STOCK, MODULE_CODES.CHARGEMENT, MODULE_CODES.MESSAGES, MODULE_CODES.VISITES].includes(module.code),
            canCreate: [MODULE_CODES.CHARGEMENT, MODULE_CODES.MESSAGES, MODULE_CODES.VISITES].includes(module.code),
            canEdit: [MODULE_CODES.REGLEMENT, MODULE_CODES.CHARGEMENT, MODULE_CODES.MESSAGES, MODULE_CODES.VISITES].includes(module.code),
            canDelete: false,
            canValidate: false,
            canExport: [MODULE_CODES.REGLEMENT].includes(module.code),
          },
          [USER_ROLES.CLIENT]: {
            canView: [MODULE_CODES.DEVIS, MODULE_CODES.FACTURES, MODULE_CODES.REGLEMENT, MODULE_CODES.MESSAGES, MODULE_CODES.PROJETS].includes(module.code),
            canCreate: [MODULE_CODES.REGLEMENT, MODULE_CODES.MESSAGES].includes(module.code),
            canEdit: false,
            canDelete: false,
            canValidate: false,
            canExport: [MODULE_CODES.FACTURES, MODULE_CODES.DEVIS].includes(module.code),
          },
        },
      }));
    };

    setMatrixData(generateMatrix());
  }, []);

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">📊 Matrice Rôles & Modules</h1>
        <p className="text-gray-600">Vue complète des permissions d'accès par rôle et module</p>
      </div>

      {/* Role Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedRole(null)}
          className={`px-4 py-2 rounded font-medium transition ${
            selectedRole === null ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'
          }`}
        >
          Tous les rôles
        </button>
        {Object.entries(ROLE_PERMISSIONS).map(([roleKey, roleData]) => (
          <button
            key={roleKey}
            onClick={() => setSelectedRole(roleKey)}
            className={`px-4 py-2 rounded font-medium transition ${
              selectedRole === roleKey
                ? `${roleData.color} text-gray-800 border-2 border-gray-800`
                : `${roleData.color} text-gray-800`
            }`}
          >
            {roleData.displayName}
          </button>
        ))}
      </div>

      {/* Role Description */}
      {selectedRole && (
        <div className={`mb-6 p-4 rounded ${ROLE_PERMISSIONS[selectedRole].color} border-l-4 border-gray-800`}>
          <h3 className="font-bold text-lg mb-1">{ROLE_PERMISSIONS[selectedRole].displayName}</h3>
          <p className="text-gray-700">{ROLE_PERMISSIONS[selectedRole].description}</p>
        </div>
      )}

      {/* Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="border p-3 text-left font-bold">Module</th>
              <th className="border p-3 text-center font-bold">État</th>
              {selectedRole === null ? (
                Object.entries(ROLE_PERMISSIONS).map(([roleKey, roleData]) => (
                  <th key={roleKey} className={`border p-3 text-center font-bold ${roleData.color}`}>
                    {roleData.displayName}
                  </th>
                ))
              ) : (
                <>
                  <th className="border p-3 text-center">👁️ View</th>
                  <th className="border p-3 text-center">➕ Create</th>
                  <th className="border p-3 text-center">✏️ Edit</th>
                  <th className="border p-3 text-center">🗑️ Delete</th>
                  <th className="border p-3 text-center">✅ Validate</th>
                  <th className="border p-3 text-center">📊 Export</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {matrixData.map((module, idx) => (
              <tr key={module.code} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                {/* Module Name */}
                <td className={`border p-3 font-medium ${getStatusColor(module.status)}`}>
                  <div>
                    <div className="font-bold text-gray-800">{module.name}</div>
                    <div className="text-xs text-gray-500">Code: {module.code}</div>
                    {module.features.length > 0 && (
                      <div className="text-xs text-gray-600 mt-1">
                        {module.features.map((f, i) => (
                          <div key={i}>{f}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </td>

                {/* Module Status */}
                <td className={`border p-3 text-center ${getStatusColor(module.status)}`}>
                  {getStatusBadge(module.status)}
                </td>

                {/* Permissions by Role */}
                {selectedRole === null ? (
                  Object.keys(ROLE_PERMISSIONS).map((roleKey) => (
                    <td key={roleKey} className={`border p-2 text-center text-sm ${ROLE_PERMISSIONS[roleKey].color}`}>
                      <div className="space-y-1">
                        {module.roles[roleKey].canView && <div>👁️</div>}
                        {module.roles[roleKey].canCreate && <div>➕</div>}
                        {module.roles[roleKey].canEdit && <div>✏️</div>}
                        {module.roles[roleKey].canDelete && <div>🗑️</div>}
                        {module.roles[roleKey].canValidate && <div>✅</div>}
                        {module.roles[roleKey].canExport && <div>📊</div>}
                        {!module.roles[roleKey].canView && <div className="text-gray-400 text-lg">❌</div>}
                      </div>
                    </td>
                  ))
                ) : (
                  <>
                    <td className="border p-2 text-center">{module.roles[selectedRole].canView ? '✅' : '❌'}</td>
                    <td className="border p-2 text-center">{module.roles[selectedRole].canCreate ? '✅' : '❌'}</td>
                    <td className="border p-2 text-center">{module.roles[selectedRole].canEdit ? '✅' : '❌'}</td>
                    <td className="border p-2 text-center">{module.roles[selectedRole].canDelete ? '✅' : '❌'}</td>
                    <td className="border p-2 text-center">{module.roles[selectedRole].canValidate ? '✅' : '❌'}</td>
                    <td className="border p-2 text-center">{module.roles[selectedRole].canExport ? '✅' : '❌'}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-100 rounded border border-gray-300">
        <h3 className="font-bold mb-3 text-gray-800">📋 Légende</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-bold">✅</span> Permission accordée
          </div>
          <div>
            <span className="font-bold">❌</span> Permission refusée
          </div>
          <div>
            <span className="font-bold">⭐</span> Filtrage personnalisé
          </div>
          <div>
            <span className="font-bold">🔴</span> Module non-implémenté
          </div>
          <div>
            <span className="font-bold">⚠️</span> Logique incomplète
          </div>
          <div>
            <span className="font-bold">👁️➕✏️🗑️✅📊</span> Actions CRUDVE
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-4 bg-green-50 rounded border border-green-200">
          <div className="text-2xl font-bold text-green-800">18/20</div>
          <div className="text-xs text-green-600">Modules actifs (Admin)</div>
        </div>
        <div className="p-4 bg-blue-50 rounded border border-blue-200">
          <div className="text-2xl font-bold text-blue-800">11/20</div>
          <div className="text-xs text-blue-600">Modules (Commercial/Agent)</div>
        </div>
        <div className="p-4 bg-purple-50 rounded border border-purple-200">
          <div className="text-2xl font-bold text-purple-800">5/20</div>
          <div className="text-xs text-purple-600">Modules (Technicien)</div>
        </div>
        <div className="p-4 bg-red-50 rounded border border-red-200">
          <div className="text-2xl font-bold text-red-800">4/20</div>
          <div className="text-xs text-red-600">Modules vides 🔴</div>
        </div>
        <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
          <div className="text-2xl font-bold text-yellow-800">2/20</div>
          <div className="text-xs text-yellow-600">Incomplètes ⚠️</div>
        </div>
      </div>
    </div>
  );
};

export default RoleModuleMatrix;
