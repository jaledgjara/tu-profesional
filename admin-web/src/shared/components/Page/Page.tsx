// Page — contenedor estándar para las páginas del admin panel.
// Padding, max-width y header (title + subtitle) consistentes en todas las pantallas.

import type { ReactNode } from 'react';

import styles from './Page.module.css';

interface PageProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;   // botones o controles a la derecha del header
  children?: ReactNode;
}

export function Page({ title, subtitle, actions, children }: PageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
