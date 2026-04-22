// ClientsScreen — listado de usuarios con role='client'. Stub por ahora.
// PR futuro: tabla con filtros (email, fecha alta), acciones (suspender, borrar).

import { Page } from '@/shared/components/Page/Page';

export function ClientsScreen() {
  return (
    <Page
      title="Clientes"
      subtitle="Listado de usuarios. Próximamente: tabla, filtros y acciones de moderación."
    />
  );
}
