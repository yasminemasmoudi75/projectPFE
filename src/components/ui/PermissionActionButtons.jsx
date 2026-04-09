import React from 'react';
import { 
  PlusIcon, 
  PencilSquareIcon, 
  TrashIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';
import PermissionButton from './PermissionButton';

/**
 * PermissionActionButtons - Groupe de boutons CRUD standards avec permissions
 * 
 * Affiche automatiquement les boutons: Créer, Voir, Modifier, Supprimer, Exporter, Valider
 * selon les permissions de l'utilisateur
 * 
 * @example
 * // Dans une liste
 * <PermissionActionButtons
 *   permissions={{ canEdit: true, canDelete: false, canCreate: true }}
 *   actions={{
 *     create: () => navigate('/create'),
 *     edit: () => navigate(`/edit/${id}`),
 *     delete: () => handleDelete(id),
 *     view: () => navigate(`/${id}`),
 *     export: () => handleExport(id),
 *     validate: () => handleValidate(id)
 *   }}
 *   size="md"
 *   layout="horizontal" // 'horizontal', 'vertical'
 * />
 * 
 * // Versions spécialisées:
 * // Juste boutons Créer/Editer/Supprimer (version basique)
 * <PermissionActionButtons.BasicCRUD permissions={{...}} actions={{...}} />
 * 
 * // Juste pour les lignes de tableau
 * <PermissionActionButtons.TableRow permissions={{...}} actions={{...}} />
 */
const PermissionActionButtons = ({
  permissions = {},
  actions = {},
  size = 'md',
  layout = 'horizontal',
  showLabels = false,
  className = '',
  variant = 'default',
  isSaving = false,
  customButtons = [] // Boutons personnalisés additionnels
}) => {
  const {
    canCreate,
    canEdit,
    canDelete,
    canView = true,
    canExport = false,
    canValidate = false
  } = permissions;

  const {
    create,
    edit,
    delete: deleteAction,
    view,
    export: exportAction,
    validate
  } = actions;

  const containerClass = layout === 'vertical' 
    ? 'flex flex-col gap-2' 
    : 'flex gap-2 items-center';

  return (
    <div className={`${containerClass} ${className}`}>
      {/* CREATE */}
      <PermissionButton
        canPerform={canCreate}
        action="create"
        onClick={create}
        icon={PlusIcon}
        label={showLabels ? 'Créer' : undefined}
        size={size}
        variant={variant}
        disabled={isSaving}
      />

      {/* VIEW */}
      <PermissionButton
        canPerform={canView}
        action="info"
        onClick={view}
        icon={EyeIcon}
        label={showLabels ? 'Voir' : undefined}
        size={size}
        variant={variant}
        disabled={isSaving}
      />

      {/* EDIT */}
      <PermissionButton
        canPerform={canEdit}
        action="edit"
        onClick={edit}
        icon={PencilSquareIcon}
        label={showLabels ? 'Modifier' : undefined}
        size={size}
        variant={variant}
        disabled={isSaving}
      />

      {/* DELETE */}
      <PermissionButton
        canPerform={canDelete}
        action="delete"
        onClick={deleteAction}
        icon={TrashIcon}
        label={showLabels ? 'Supprimer' : undefined}
        size={size}
        variant={variant}
        disabled={isSaving}
      />

      {/* EXPORT */}
      <PermissionButton
        canPerform={canExport}
        action="export"
        onClick={exportAction}
        icon={ArrowDownTrayIcon}
        label={showLabels ? 'Exporter' : undefined}
        size={size}
        variant={variant}
        disabled={isSaving}
      />

      {/* VALIDATE */}
      <PermissionButton
        canPerform={canValidate}
        action="validate"
        onClick={validate}
        icon={CheckCircleIcon}
        label={showLabels ? 'Valider' : undefined}
        size={size}
        variant={variant}
        disabled={isSaving}
      />

      {/* CUSTOM BUTTONS */}
      {customButtons.map((btn, idx) => (
        <PermissionButton
          key={`custom-btn-${idx}`}
          canPerform={btn.canPerform}
          action={btn.action}
          onClick={btn.onClick}
          icon={btn.icon}
          label={btn.label}
          size={size}
          variant={variant}
          disabled={isSaving}
        />
      ))}
    </div>
  );
};

/**
 * Variante BASIC - Seulement Create/Edit/Delete
 */
PermissionActionButtons.BasicCRUD = ({
  permissions,
  actions,
  size = 'md',
  className = '',
  isSaving = false
}) => {
  return (
    <PermissionActionButtons
      permissions={{ canCreate: permissions?.canCreate, canEdit: permissions?.canEdit, canDelete: permissions?.canDelete }}
      actions={{ create: actions?.create, edit: actions?.edit, delete: actions?.delete }}
      size={size}
      className={className}
      isSaving={isSaving}
    />
  );
};

/**
 * Variante TABLE ROW - Optimisé pour les ligne de tableau
 */
PermissionActionButtons.TableRow = ({
  permissions,
  actions,
  showView = true,
  className = '',
  isSaving = false
}) => {
  const {
    canEdit = false,
    canDelete = false,
  } = permissions;

  const {
    edit,
    delete: deleteAction,
    view
  } = actions;

  return (
    <div className={`flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${className}`}>
      {showView && (
        <PermissionButton
          canPerform={true}
          action="info"
          onClick={view}
          icon={EyeIcon}
          size="sm"
          disabled={isSaving}
        />
      )}
      <PermissionButton
        canPerform={canEdit}
        action="edit"
        onClick={edit}
        icon={PencilSquareIcon}
        size="sm"
        disabled={isSaving}
      />
      <PermissionButton
        canPerform={canDelete}
        action="delete"
        onClick={deleteAction}
        icon={TrashIcon}
        size="sm"
        disabled={isSaving}
      />
    </div>
  );
};

/**
 * Variante HEADER - Pour les boutons en haut de page (Créer + Rechercher)
 */
PermissionActionButtons.PageHeader = ({
  permissions,
  actions,
  className = '',
  isSaving = false
}) => {
  const { canCreate } = permissions;
  const { create } = actions;

  return (
    <PermissionButton
      canPerform={canCreate}
      action="create"
      onClick={create}
      icon={PlusIcon}
      size="lg"
      className={`px-4 py-2.5 ${className}`}
      disabled={isSaving}
    >
      <span className="font-semibold text-base">Nouveau</span>
    </PermissionButton>
  );
};

export default PermissionActionButtons;
