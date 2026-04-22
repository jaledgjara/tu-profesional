// AdminShell — wrapper del panel autenticado. Renderiza el Sidebar fijo a la
// izquierda y el contenido de la ruta actual (Outlet) a la derecha.
//
// Lo monta RequireAdmin, así que todo lo que vive acá ya pasó el check de
// role='admin'. No hay que volver a validar nada.

import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';

import styles from './AdminShell.module.css';

export function AdminShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
