import React from 'react';
import { Tooltip } from '@headlessui/react';

/**
 * PermissionButton - Bouton automatique avec gestion des permissions
 * 
 * Affiche ou masque automatiquement un bouton selon les permissions de l'utilisateur
 * 
 * @example
 * <PermissionButton
 *   canPerform={canEdit}
 *   action="edit"
 *   onClick={handleEdit}
 *   icon={PencilIcon}
 *   label="Modifier"
 * />
 */
const PermissionButton = ({
  canPerform = false,
  action = 'action', // 'create', 'edit', 'delete', 'export', 'validate'
  onClick,
  icon: Icon,
  label = '',
  variant = 'default', // 'default', 'success', 'danger', 'warning', 'info'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  showTooltip = true,
  className = '',
  children,
  ...props
}) => {
  // Si permission refusée, ne pas afficher
  if (!canPerform) {
    return null;
  }

  // Classes par variante
  const variantClasses = {
    default: 'text-slate-400 bg-white border border-slate-200 hover:text-slate-600 hover:bg-slate-50',
    success: 'text-green-400 bg-white border border-green-200 hover:text-green-600 hover:bg-green-50',
    danger: 'text-red-400 bg-white border border-red-200 hover:text-red-600 hover:bg-red-50',
    warning: 'text-amber-400 bg-white border border-amber-200 hover:text-amber-600 hover:bg-amber-50',
    info: 'text-blue-400 bg-white border border-blue-200 hover:text-blue-600 hover:bg-blue-50'
  };

  // Classes par action (override variante si pertinent)
  const actionClasses = {
    create: 'text-green-400 bg-white border border-green-200 shadow-sm hover:text-green-600 hover:border-green-300 hover:bg-green-50',
    edit: 'text-amber-400 bg-white border border-slate-200 shadow-sm hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50',
    delete: 'text-red-400 bg-white border border-red-200 shadow-sm hover:text-red-600 hover:border-red-300 hover:bg-red-50',
    export: 'text-blue-400 bg-white border border-blue-200 shadow-sm hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50',
    validate: 'text-emerald-400 bg-white border border-emerald-200 shadow-sm hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
  };

  // Classes par taille
  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2.5 text-sm',
    lg: 'p-3 text-base'
  };

  // Récupérer les classes finales
  const finalVariantClass = actionClasses[action] || variantClasses[variant];
  const finalSizeClass = sizeClasses[size];

  // Messages de permission refusée
  const deniedMessages = {
    create: 'Vous n\'avez pas la permission de créer',
    edit: 'Vous n\'avez pas la permission de modifier',
    delete: 'Vous n\'avez pas la permission de supprimer',
    export: 'Vous n\'avez pas la permission d\'exporter',
    validate: 'Vous n\'avez pas la permission de valider'
  };

  const button = (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        ${finalSizeClass}
        ${finalVariantClass}
        rounded-xl transition-all hover:-translate-y-0.5
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0
        flex items-center gap-2
        ${className}
      `}
      title={label || deniedMessages[action]}
      {...props}
    >
      {Icon && <Icon className={size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />}
      {children && <span>{children}</span>}
    </button>
  );

  // Optionnellement envelopper dans un tooltip
  if (showTooltip && label) {
    return (
      <Tooltip>
        <Tooltip.Button as="div" className="flex">
          {button}
        </Tooltip.Button>
        <Tooltip.Panel className="absolute right-0 -top-12 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 before:absolute before:bottom-0 before:left-1/2 before:-translate-x-1/2 before:translate-y-full before:border-4 before:border-transparent before:border-t-slate-900">
          {label}
        </Tooltip.Panel>
      </Tooltip>
    );
  }

  return button;
};

export default PermissionButton;
