// Pantalla completa con spinner centrado. La usan los guards mientras
// verifican sesión/rol; también sirve como fallback genérico.

import styles from './PageLoader.module.css';

export function PageLoader({ label = 'Cargando…' }: { label?: string }) {
  return (
    <div className={styles.container} role="status" aria-live="polite">
      <span className={styles.spinner} aria-hidden />
      <span className={styles.label}>{label}</span>
    </div>
  );
}
