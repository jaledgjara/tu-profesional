// KpiCard — la tarjeta mínima del dashboard: label arriba (gris chico),
// número grande abajo (Bricolage bold). Estado de loading con skeleton.
// Sin íconos por ahora — se puede sumar en prop opcional si hace falta.

import type { ReactNode } from 'react';

import styles from './KpiCard.module.css';

interface KpiCardProps {
  label:      string;
  value:      number | null | undefined;
  /** Si es true muestra skeleton en lugar del número. */
  isLoading?: boolean;
  /** Texto chico debajo del número (ej: "+12% vs. semana pasada"). Opcional. */
  hint?:      ReactNode;
}

const numberFmt = new Intl.NumberFormat('es-AR');

export function KpiCard({ label, value, isLoading, hint }: KpiCardProps) {
  return (
    <article className={styles.card}>
      <p className={styles.label}>{label}</p>

      {isLoading ? (
        <span className={styles.skeleton} aria-hidden />
      ) : (
        <p className={styles.value}>
          {value == null ? '—' : numberFmt.format(value)}
        </p>
      )}

      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </article>
  );
}
