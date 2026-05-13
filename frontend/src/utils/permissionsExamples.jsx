/**
 * 🎯 EXEMPLE PRATIQUE: UTILISER LES PERMISSIONS DANS UN COMPOSANT
 * ═════════════════════════════════════════════════════════════════
 * 
 * Ce fichier montre comment utiliser les permissions pour:
 * - Afficher/masquer des boutons
 * - Afficher/masquer des sections
 * - Contrôler l'accès aux pages
 * - Griser des éléments
 */

import { usePermission } from '../hooks/usePermission';
import { MODULE_CODES, ACTION_TYPES } from '../utils/constants';

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 1: AFFICHER/MASQUER BOUTONS
// ═══════════════════════════════════════════════════════════════

export const ClientActions = ({ clientId }) => {
  // Récupérer les permissions pour le module CLIENTS
  const { canCreate, canEdit, canDelete } = usePermission(MODULE_CODES.CLIENTS);

  return (
    <div className="flex gap-2">
      {/* ✅ Bouton "Créer" visible SEULEMENT si l'utilisateur peut créer */}
      {canCreate && (
        <button className="btn btn-primary" onClick={() => handleCreate()}>
          ➕ Nouveau client
        </button>
      )}

      {/* ✅ Bouton "Modifier" visible SEULEMENT si l'utilisateur peut modifier */}
      {canEdit && (
        <button className="btn btn-secondary" onClick={() => handleEdit(clientId)}>
          ✏️ Modifier
        </button>
      )}

      {/* ✅ Bouton "Supprimer" visible SEULEMENT si l'utilisateur peut supprimer */}
      {canDelete && (
        <button
          className="btn btn-danger"
          onClick={() => handleDelete(clientId)}
        >
          🗑️ Supprimer
        </button>
      )}

      {/* ❌ Bouton jamais visible pour les rôles sans permission */}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 2: SECTIONS CONDITIONNELLES
// ═══════════════════════════════════════════════════════════════

export const ClientForm = ({ client, isNew }) => {
  const { canEdit, isAdmin } = usePermission(MODULE_CODES.CLIENTS);

  return (
    <form>
      {/* Section toujours visible */}
      <fieldset>
        <label>Nom client</label>
        <input type="text" defaultValue={client.name} />
      </fieldset>

      {/* Section visible SEULEMENT si l'utilisateur peut modifier */}
      {canEdit && (
        <fieldset>
          <label>Email</label>
          <input type="email" defaultValue={client.email} />
        </fieldset>
      )}

      {/* Section visible SEULEMENT pour les admins */}
      {isAdmin() && (
        <fieldset>
          <label>ID Interne (Admin only)</label>
          <input type="text" defaultValue={client.internalId} disabled />
        </fieldset>
      )}

      <button type="submit">Enregistrer</button>
    </form>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 3: PROTÉGER UNE PAGE ENTIÈRE
// ═══════════════════════════════════════════════════════════════

export const ProtectedClientPage = ({ clientId }) => {
  const { canView, isAdmin } = usePermission(MODULE_CODES.CLIENTS);

  // ❌ L'utilisateur n'a pas accès au module CLIENTS
  if (!canView) {
    return (
      <div className="alert alert-error">
        <h2>Accès refusé</h2>
        <p>Vous n'avez pas la permission de consulter les clients.</p>
      </div>
    );
  }

  // ✅ Admin a accès à plus de sections
  if (isAdmin()) {
    return (
      <div>
        <h1>Page Clients - Vue Admin</h1>
        <AdminClientSection clientId={clientId} />
        <ClientMetrics clientId={clientId} />
      </div>
    );
  }

  // ✅ Utilisateur normal avec accès limité
  return (
    <div>
      <h1>Page Clients</h1>
      <BasicClientSection clientId={clientId} />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 4: BOUTONS GRISÉS SELON LES PERMISSIONS
// ═══════════════════════════════════════════════════════════════

export const InvoiceRow = ({ invoice }) => {
  const { canEdit, canDelete, canExport } = usePermission(MODULE_CODES.FACTURES);

  return (
    <tr>
      <td>{invoice.number}</td>
      <td>{invoice.amount}</td>
      <td className="flex gap-2">
        {/* Bouton Modifier: Coachable si permission, grisé sinon */}
        <button
          onClick={() => handleEdit(invoice.id)}
          disabled={!canEdit}  // ← Key point: disabled={!permission}
          className={canEdit ? 'btn btn-primary' : 'btn btn-gray cursor-not-allowed'}
        >
          ✏️ Modifier
        </button>

        {/* Bouton Supprimer: Non visible si pas de permission */}
        {canDelete && (
          <button onClick={() => handleDelete(invoice.id)} className="btn btn-danger">
            🗑️ Supprimer
          </button>
        )}

        {/* Bouton Exporter: Non visible si pas de permission */}
        {canExport && (
          <button onClick={() => handleExport(invoice.id)} className="btn btn-info">
            📤 Exporter
          </button>
        )}
      </td>
    </tr>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 5: COMBO - PLUSIEURS MODULES
// ═══════════════════════════════════════════════════════════════

export const ClientDetailsPage = ({ clientId }) => {
  // Permissions pour différents modules
  const clientPerms = usePermission(MODULE_CODES.CLIENTS);
  const devisPerms = usePermission(MODULE_CODES.DEVIS);
  const facturePerms = usePermission(MODULE_CODES.FACTURES);

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* SECTION CLIENTS */}
      {clientPerms.canView && (
        <section className="card">
          <h2>Informations Client</h2>
          <p>Code: {client.code}</p>
          <p>Nom: {client.name}</p>
          
          {clientPerms.canEdit && (
            <button onClick={handleEditClient}>✏️ Modifier</button>
          )}
        </section>
      )}

      {/* SECTION DEVIS */}
      {devisPerms.canView && (
        <section className="card">
          <h2>Devis associés</h2>
          {devisPerms.canCreate && (
            <button onClick={handleCreateDevis}>➕ Nouveau devis</button>
          )}
          {/* Liste des devis */}
        </section>
      )}

      {/* SECTION FACTURES */}
      {facturePerms.canView && (
        <section className="card">
          <h2>Factures</h2>
          {facturePerms.canExport && (
            <button onClick={handleExportFactures}>📤 Exporter</button>
          )}
          {/* Liste des factures */}
        </section>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 6: MENU DYNAMIQUE
// ═══════════════════════════════════════════════════════════════

export const SidebarMenu = () => {
  const { canView } = usePermission();

  const menuItems = [
    { label: 'Dashboard', module: MODULE_CODES.DASHBOARD, path: '/' },
    { label: 'Clients', module: MODULE_CODES.CLIENTS, path: '/clients' },
    { label: 'Devis', module: MODULE_CODES.DEVIS, path: '/devis' },
    { label: 'Stock', module: MODULE_CODES.STOCK, path: '/stock' },
    { label: 'Utilisateurs', module: MODULE_CODES.USERS, path: '/users' },
  ];

  // Filtrer le menu selon les permissions
  const visibleItems = menuItems.filter((item) => canView(item.module));

  return (
    <nav className="sidebar">
      {visibleItems.map((item) => (
        <a key={item.path} href={item.path}>
          {item.label}
        </a>
      ))}
    </nav>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 7: ÉLÉMENTS GRISES (UI HINT)
// ═══════════════════════════════════════════════════════════════

export const TableActions = ({ item }) => {
  const { canEdit, canDelete, canValidate } = usePermission(MODULE_CODES.DEVIS);

  return (
    <div className="flex gap-2">
      {/* Option 1: Masquer complètement */}
      {canEdit && (
        <button className="btn-sm">Modifier</button>
      )}

      {/* Option 2: Afficher grisé (pour UX hint) */}
      <button
        className="btn-sm"
        disabled={!canDelete}
        title={canDelete ? 'Supprimer' : 'Vous n\'avez pas la permission'}
        onClick={() => canDelete && handleDelete(item.id)}
      >
        Supprimer
      </button>

      {/* Option 3: Tooltip au survol */}
      <button
        className={`btn-sm ${canValidate ? 'hover:bg-green-100' : 'opacity-50 cursor-not-allowed'}`}
        disabled={!canValidate}
        onMouseEnter={() => !canValidate && showTooltip('Permission refusée')}
        onClick={() => canValidate && handleValidate(item.id)}
      >
        ✅ Valider
      </button>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 8: MESSAGE PERSONNALISÉ PAR RÔLE
// ═══════════════════════════════════════════════════════════════

export const AccessDeniedMessage = () => {
  const { user } = usePermission();

  const messages = {
    Admin: 'Vous avez accès à tout',
    Commercial: 'Vous avez accès aux ventes et projets',
    Technicien: 'Vous avez accès aux activités et SAV',
    Client: 'Vous avez accès limité',
  };

  return (
    <div className="alert">
      <p>Votre rôle: <strong>{user?.UserRole}</strong></p>
      <p>{messages[user?.UserRole] || 'Accès restreint'}</p>
    </div>
  );
};

export default {
  ClientActions,
  ClientForm,
  ProtectedClientPage,
  InvoiceRow,
  ClientDetailsPage,
  SidebarMenu,
  TableActions,
  AccessDeniedMessage,
};
