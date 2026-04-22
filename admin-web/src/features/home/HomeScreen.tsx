// Placeholder de la home del admin. En PRs siguientes pasa a ser el
// dashboard real con KPIs y accesos a secciones.

import { useNavigate } from 'react-router-dom';

import { Button } from '@/shared/components/Button/Button';
import { useSession } from '@/app/providers/AuthProvider';
import { useAdminProfile } from '@/features/auth/hooks/useAdminProfile';

import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const navigate = useNavigate();
  const { signOut } = useSession();
  const { data: profile } = useAdminProfile();

  async function handleSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  return (
    <main className={styles.container}>
      <div className={styles.header}>
        <span className={styles.brand}>Tu Profesional · Admin</span>
        <div className={styles.user}>
          <span className={styles.email}>{profile?.email ?? ''}</span>
          <Button variant="secondary" size="sm" onClick={handleSignOut}>
            Salir
          </Button>
        </div>
      </div>

      <section className={styles.content}>
        <h1 className={styles.title}>Panel</h1>
        <p className={styles.subtitle}>
          Autenticación OK. Las secciones del dashboard vienen en PRs siguientes.
        </p>
      </section>
    </main>
  );
}
