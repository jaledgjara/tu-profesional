// RequestsScreen — listado de solicitudes pendientes como grid de cards.
// Las acciones (aprobar/rechazar) viven en /requests/:id, no en la card,
// para que el admin nunca apruebe sin haber visto el perfil completo.

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';

import { RequestsList } from '@/features/professionals/components/RequestsList';
import { usePendingProfessionals } from '@/features/professionals/hooks/usePendingProfessionals';

import styles from './RequestsScreen.module.css';

export function RequestsScreen() {
  const { data, isLoading, isError, refetch } = usePendingProfessionals();

  const count    = data?.length ?? 0;
  const subtitle = isLoading
    ? 'Cargando solicitudes…'
    : count === 0
      ? 'No hay solicitudes pendientes.'
      : count === 1
        ? '1 solicitud pendiente de revisión.'
        : `${count} solicitudes pendientes de revisión.`;

  return (
    <Page title="Solicitudes" subtitle={subtitle}>
      {isLoading ? (
        <PageLoader label="Cargando solicitudes…" />
      ) : isError ? (
        <div className={styles.errorBanner} role="alert">
          <p>No se pudieron cargar las solicitudes.</p>
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : count === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>Todo al día</p>
          <p className={styles.emptyText}>
            Cuando un profesional complete su registro, su solicitud va a aparecer acá.
          </p>
        </div>
      ) : (
        <RequestsList data={data ?? []} />
      )}
    </Page>
  );
}
