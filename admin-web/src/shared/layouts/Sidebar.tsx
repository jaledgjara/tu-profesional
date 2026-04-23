// Sidebar — navegación fija del admin panel.
// Dos bloques: navegación principal arriba, admin/auditoría abajo.
// User info + signout fijados en el footer del sidebar.
//
// Iconos desde lucide-react. Estado activo via NavLink (isActive del router).

import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  Star,
  ScrollText,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useSession } from '@/app/providers/useSession';
import { useAdminProfile } from '@/features/auth/hooks/useAdminProfile';
import { usePendingCount } from '@/features/professionals/hooks/usePendingCount';

import styles from './Sidebar.module.css';

interface NavItem {
  to:    string;
  icon:  LucideIcon;
  label: string;
  end?:  boolean;
}

const MAIN_ITEMS: NavItem[] = [
  { to: '/',              icon: LayoutDashboard, label: 'Panel', end: true },
  { to: '/clients',       icon: Users,           label: 'Clientes' },
  { to: '/professionals', icon: Stethoscope,     label: 'Profesionales' },
  { to: '/requests',      icon: ClipboardList,   label: 'Solicitudes' },
  { to: '/reviews',       icon: Star,            label: 'Reseñas' },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/activity', icon: ScrollText, label: 'Actividad' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { data: profile } = useAdminProfile();
  const { data: pendingCount } = usePendingCount();

  const email    = profile?.email ?? '';
  const initial  = email.charAt(0).toUpperCase() || '?';

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>Tu Profesional</span>
        <span className={styles.brandTag}>Admin</span>
      </div>

      <nav className={styles.nav} aria-label="Navegación principal">
        <ul className={styles.list}>
          {MAIN_ITEMS.map((item) => (
            <NavItemLink
              key={item.to}
              item={item}
              badgeCount={item.to === '/requests' ? pendingCount ?? 0 : 0}
            />
          ))}
        </ul>

        <p className={styles.groupLabel}>Administración</p>

        <ul className={styles.list}>
          {ADMIN_ITEMS.map((item) => (
            <NavItemLink key={item.to} item={item} badgeCount={0} />
          ))}
        </ul>
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.avatar} aria-hidden>{initial}</span>
          <span className={styles.email} title={email}>{email}</span>
        </div>
        <button
          type="button"
          className={styles.signOut}
          onClick={handleSignOut}
          aria-label="Cerrar sesión"
        >
          <LogOut size={16} aria-hidden />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}

function NavItemLink({ item, badgeCount }: { item: NavItem; badgeCount: number }) {
  const Icon = item.icon;
  return (
    <li>
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          [styles.link, isActive && styles.linkActive].filter(Boolean).join(' ')
        }
      >
        <Icon size={18} aria-hidden className={styles.linkIcon} />
        <span className={styles.linkLabel}>{item.label}</span>
        {badgeCount > 0 ? (
          <span
            className={styles.badge}
            aria-label={`${badgeCount} pendiente${badgeCount === 1 ? '' : 's'}`}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        ) : null}
      </NavLink>
    </li>
  );
}
