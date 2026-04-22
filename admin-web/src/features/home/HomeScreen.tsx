// HomeScreen — dashboard principal. El layout (sidebar + header) lo
// provee AdminShell, así que acá solo va el contenido específico de /.

import { Page } from '@/shared/components/Page/Page';
import { KpiGrid } from '@/features/dashboard/components/KpiGrid/KpiGrid';
import { KpiCard } from '@/features/dashboard/components/KpiCard/KpiCard';
import { useUserCounts } from '@/features/dashboard/hooks/useUserCounts';

import styles from './HomeScreen.module.css';

export function HomeScreen() {
  const { data: counts, isLoading, isError } = useUserCounts();

  return (
    <Page
      title="Panel"
      subtitle="Resumen general de la plataforma."
    >
      {isError ? (
        <div className={styles.errorBanner} role="alert">
          No se pudieron cargar los KPIs. Probá recargar la página.
        </div>
      ) : (
        <KpiGrid>
          <KpiCard
            label="Clientes"
            value={counts?.clients}
            isLoading={isLoading}
          />
          <KpiCard
            label="Profesionales"
            value={counts?.professionals}
            isLoading={isLoading}
          />
        </KpiGrid>
      )}
    </Page>
  );
}
