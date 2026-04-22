// ActivityScreen — historial de acciones de admin (admin_audit_log). Stub por ahora.
// PR futuro: tabla con fecha, admin, acción, target, metadata. Filtros por admin y fecha.

import { Page } from '@/shared/components/Page/Page';

export function ActivityScreen() {
  return (
    <Page
      title="Actividad"
      subtitle="Historial de acciones de admin. Próximamente: log de auditoría desde admin_audit_log."
    />
  );
}
