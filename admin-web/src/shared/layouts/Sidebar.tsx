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
  Star,
  ScrollText,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useSession } from '@/app/providers/AuthProvider';
import { useAdminProfile } from '@/features/auth/hooks/useAdminProfile';

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
  { to: '/reviews',       icon: Star,            label: 'Reseñas' },
];

const ADMIN_ITEMS: NavItem[] = [
  { to: '/activity', icon: ScrollText, label: 'Actividad' },
];

export function Sidebar() {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { data: profile } = useAdminProfile();

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
            <NavItemLink key={item.to} item={item} />
          ))}
        </ul>

        <p className={styles.groupLabel}>Administración</p>

        <ul className={styles.list}>
          {ADMIN_ITEMS.map((item) => (
            <NavItemLink key={item.to} item={item} />
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

function NavItemLink({ item }: { item: NavItem }) {
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
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}
