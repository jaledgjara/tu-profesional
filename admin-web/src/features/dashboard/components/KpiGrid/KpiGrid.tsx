// KpiGrid — layout responsive para N tarjetas de KPI.
// En mobile apila de a 1, en tablet 2, desktop 4. Gap consistente.

import type { ReactNode } from 'react';

import styles from './KpiGrid.module.css';

export function KpiGrid({ children }: { children: ReactNode }) {
  return <div className={styles.grid}>{children}</div>;
}
