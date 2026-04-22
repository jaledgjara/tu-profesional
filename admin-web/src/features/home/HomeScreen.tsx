// Placeholder de la home del admin. En PRs siguientes pasa a ser el
// dashboard real con KPIs y accesos a secciones.

import styles from './HomeScreen.module.css';

export function HomeScreen() {
  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Admin panel</h1>
        <p className={styles.subtitle}>Tu Profesional · scaffold inicial</p>
      </header>
    </main>
  );
}
