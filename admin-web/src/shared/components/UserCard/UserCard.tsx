// UserCard — tarjeta genérica para listar usuarios (clientes, profesionales).
// Muestra avatar, nombre, email, subtítulo opcional y un badge de estado.
// Las acciones llegan por props (array) y se renderizan en un dropdown (⋯)
// para que la card no crezca con botones y se vea bien en listas densas.
//
// Tipos de action:
//   - variant 'default' (gris) | 'danger' (rojo, para eliminar/suspender)
//   - disabled opcional por action (ej: "Suspender" cuando ya está suspendido)

import type { ReactNode } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreVertical } from 'lucide-react';

import styles from './UserCard.module.css';

export interface UserCardAction {
  id:        string;
  label:     string;
  icon?:     ReactNode;
  variant?:  'default' | 'danger';
  disabled?: boolean;
  onClick:   () => void;
}

export interface UserCardStatus {
  label:   string;
  tone:    'neutral' | 'success' | 'warning' | 'danger';
}

interface UserCardProps {
  avatarUrl?: string | null;
  name:       string | null;
  email?:     string | null;
  /** Texto secundario (ej: "Se registró hace 3 días", "3 reseñas"). */
  subtitle?:  ReactNode;
  status?:    UserCardStatus;
  actions?:   UserCardAction[];
  /** Handler opcional para click en toda la card (ej: ir al detalle). */
  onClick?:   () => void;
}

export function UserCard({
  avatarUrl,
  name,
  email,
  subtitle,
  status,
  actions,
  onClick,
}: UserCardProps) {
  const initial = (name?.charAt(0) || email?.charAt(0) || '?').toUpperCase();
  const hasActions = actions && actions.length > 0;

  return (
    <article
      className={[styles.card, onClick && styles.clickable].filter(Boolean).join(' ')}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className={styles.avatar} loading="lazy" />
      ) : (
        <span className={styles.avatarFallback} aria-hidden>{initial}</span>
      )}

      <div className={styles.body}>
        <div className={styles.identityRow}>
          <h3 className={styles.name}>{name || 'Sin nombre'}</h3>
          {status ? (
            <span className={[styles.badge, styles[`badge_${status.tone}`]].join(' ')}>
              {status.label}
            </span>
          ) : null}
        </div>
        {email ? <p className={styles.email}>{email}</p> : null}
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>

      {hasActions ? (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              className={styles.menuTrigger}
              aria-label="Acciones"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical size={18} aria-hidden />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={styles.menu}
              align="end"
              sideOffset={4}
              onClick={(e) => e.stopPropagation()}
            >
              {actions.map((action) => (
                <DropdownMenu.Item
                  key={action.id}
                  className={[
                    styles.menuItem,
                    action.variant === 'danger' && styles.menuItemDanger,
                  ].filter(Boolean).join(' ')}
                  disabled={action.disabled}
                  onSelect={(e) => {
                    e.preventDefault();
                    action.onClick();
                  }}
                >
                  {action.icon ? <span className={styles.menuItemIcon}>{action.icon}</span> : null}
                  {action.label}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      ) : null}
    </article>
  );
}
