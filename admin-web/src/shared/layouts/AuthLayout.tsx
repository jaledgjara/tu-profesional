// Layout para pantallas de auth: card centrado verticalmente, con marca arriba.
// Las screens lo envuelven y pasan el formulario como children.

import type { ReactNode } from 'react';

import styles from './AuthLayout.module.css';

interface AuthLayoutProps {
  title:    string;
  subtitle?: string;
  children: ReactNode;
  footer?:  ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>Tu Profesional</span>
          <span className={styles.brandTag}>Admin</span>
        </div>
        <div className={styles.heading}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        </div>
        <div className={styles.body}>{children}</div>
        {footer ? <div className={styles.footer}>{footer}</div> : null}
      </div>
    </div>
  );
}
