// ClientsScreen — listado de usuarios con role='client' con data real.
// Paginación server-side (RPC admin_list_clients) y búsqueda por nombre/email.
//
// URL state:
//   ?page=N     página actual (1-indexed)
//   ?q=texto    búsqueda
// Guardar en URL permite compartir el link y volver al mismo lugar.
//
// Acciones del dropdown (Sprint B):
//   Ver detalle → navega a /clients/:id
//   Suspender/Eliminar → abren diálogo de razón en esta misma pantalla
//   Reactivar/Restaurar → window.confirm + mutation directa
// El id del cliente "bajo acción" vive en selectedId; el dialog lee de ahí.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Ban, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { SearchInput } from '@/shared/components/SearchInput/SearchInput';
import { Pagination } from '@/shared/components/Pagination/Pagination';
import { UserCard, type UserCardAction } from '@/shared/components/UserCard/UserCard';
import { ConfirmWithReasonDialog } from '@/shared/components/ConfirmWithReasonDialog/ConfirmWithReasonDialog';

import { useClients } from '@/features/clients/hooks/useClients';
import {
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useRestoreUser,
} from '@/features/moderation/hooks/useModerationActions';

import styles from './ClientsScreen.module.css';

const PAGE_SIZE = 20;

// Estado compartido del dialog: qué cliente + qué acción.
type PendingAction =
  | { kind: 'suspend'; id: string; email: string | null }
  | { kind: 'delete';  id: string; email: string | null }
  | null;

export function ClientsScreen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const q    = params.get('q') ?? '';

  const { data, isLoading, isFetching, isError, refetch } = useClients({
    page,
    pageSize: PAGE_SIZE,
    search:   q,
  });

  const [pending, setPending] = useState<PendingAction>(null);

  const suspendMutation   = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const deleteMutation    = useDeleteUser();
  const restoreMutation   = useRestoreUser();

  function handleConfirmReason(reason: string) {
    if (!pending) return;
    const onSuccess = () => {
      setPending(null);
      suspendMutation.reset();
      deleteMutation.reset();
    };
    if (pending.kind === 'suspend') {
      suspendMutation.mutate({ id: pending.id, reason }, { onSuccess });
    } else {
      deleteMutation.mutate({ id: pending.id, reason }, { onSuccess });
    }
  }

  function handleUnsuspend(id: string) {
    if (!window.confirm('¿Reactivar este cliente?')) return;
    unsuspendMutation.mutate(id);
  }

  function handleRestore(id: string) {
    if (!window.confirm('¿Restaurar este cliente?')) return;
    restoreMutation.mutate(id);
  }

  function setPage(next: number) {
    const copy = new URLSearchParams(params);
    if (next <= 1) copy.delete('page');
    else copy.set('page', String(next));
    setParams(copy, { replace: false });
  }

  function setQ(next: string) {
    const copy = new URLSearchParams(params);
    if (next) copy.set('q', next);
    else copy.delete('q');
    // Cualquier cambio de query resetea a página 1 para no quedar en
    // una página que no existe en el resultado nuevo.
    copy.delete('page');
    setParams(copy, { replace: true });
  }

  const rows  = data?.rows  ?? [];
  const total = data?.total ?? 0;

  const subtitle = isLoading
    ? 'Cargando clientes…'
    : total === 0
      ? q
        ? `Sin resultados para "${q}".`
        : 'No hay clientes registrados todavía.'
      : total === 1
        ? '1 cliente registrado.'
        : `${total} clientes registrados.`;

  return (
    <Page title="Clientes" subtitle={subtitle}>
      <div className={styles.toolbar}>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar por email…"
        />
      </div>

      {isLoading ? (
        <PageLoader label="Cargando clientes…" />
      ) : isError ? (
        <div className={styles.errorBanner} role="alert">
          <p>No se pudieron cargar los clientes.</p>
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {q ? 'Sin resultados' : 'Todavía no hay clientes'}
          </p>
          <p className={styles.emptyText}>
            {q
              ? 'Probá con otro email.'
              : 'Cuando se registre un usuario, va a aparecer acá.'}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {rows.map((client) => {
            const isDeleted   = !!client.deleted_at;
            const isSuspended = !!client.suspended_at;

            // Construcción del menú: "Ver detalle" siempre; después
            // ramificamos según el estado de moderación del cliente.
            const actions: UserCardAction[] = [
              {
                id:      'view',
                label:   'Ver detalle',
                icon:    <Eye size={14} aria-hidden />,
                onClick: () => navigate(`/clients/${client.id}`),
              },
              ...(isDeleted
                ? [{
                    id:      'restore',
                    label:   'Restaurar',
                    icon:    <RotateCcw size={14} aria-hidden />,
                    onClick: () => handleRestore(client.id),
                  } as UserCardAction]
                : isSuspended
                  ? [
                      {
                        id:      'reactivate',
                        label:   'Reactivar',
                        icon:    <CheckCircle2 size={14} aria-hidden />,
                        onClick: () => handleUnsuspend(client.id),
                      } as UserCardAction,
                      {
                        id:      'delete',
                        label:   'Eliminar',
                        icon:    <Trash2 size={14} aria-hidden />,
                        variant: 'danger',
                        onClick: () => setPending({ kind: 'delete', id: client.id, email: client.email }),
                      } as UserCardAction,
                    ]
                  : [
                      {
                        id:      'suspend',
                        label:   'Suspender',
                        icon:    <Ban size={14} aria-hidden />,
                        onClick: () => setPending({ kind: 'suspend', id: client.id, email: client.email }),
                      } as UserCardAction,
                      {
                        id:      'delete',
                        label:   'Eliminar',
                        icon:    <Trash2 size={14} aria-hidden />,
                        variant: 'danger',
                        onClick: () => setPending({ kind: 'delete', id: client.id, email: client.email }),
                      } as UserCardAction,
                    ]
              ),
            ];

            // Decisión de producto: los clientes son anónimos en la DB
            // (solo email, sin nombre). Usamos el email como identificador
            // primario en la card — no mostramos "Sin nombre".
            return (
              <UserCard
                key={client.id}
                name={client.email}
                subtitle={`Se registró hace ${formatDistanceToNow(new Date(client.created_at), { locale: es })}`}
                status={
                  isDeleted
                    ? { label: 'Eliminado',  tone: 'danger'  }
                    : isSuspended
                      ? { label: 'Suspendido', tone: 'warning' }
                      : { label: 'Activo',     tone: 'success' }
                }
                actions={actions}
              />
            );
          })}
        </div>
      )}

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        onChange={setPage}
        disabled={isFetching}
      />

      {/* Dialog único compartido entre suspender y eliminar — el state
          `pending` decide qué muestra. Cerramos sólo si no hay mutation
          en curso para que no se quede colgado un request. */}
      <ConfirmWithReasonDialog
        open={!!pending}
        onOpenChange={(open) => {
          const busy = suspendMutation.isPending || deleteMutation.isPending;
          if (!busy && !open) {
            setPending(null);
            suspendMutation.reset();
            deleteMutation.reset();
          }
        }}
        title={pending?.kind === 'delete' ? 'Eliminar cliente' : 'Suspender cliente'}
        subject={pending ? <>Email: <strong>{pending.email}</strong></> : null}
        confirmLabel={pending?.kind === 'delete' ? 'Eliminar' : 'Suspender'}
        tone={pending?.kind === 'delete' ? 'danger' : 'default'}
        minLength={pending?.kind === 'delete' ? 20 : 10}
        placeholder={
          pending?.kind === 'delete'
            ? '¿Por qué eliminás a este cliente? (mínimo 20 caracteres)'
            : '¿Por qué suspendés a este cliente?'
        }
        hint={
          pending?.kind === 'delete'
            ? 'El cliente deja de aparecer y no puede loguearse. Sus reseñas se conservan. Reversible desde el detalle.'
            : 'La suspensión es reversible. Queda en el audit log.'
        }
        isSubmitting={
          pending?.kind === 'delete' ? deleteMutation.isPending : suspendMutation.isPending
        }
        errorMessage={
          pending?.kind === 'delete'
            ? (deleteMutation.isError ? (deleteMutation.error as Error).message : undefined)
            : (suspendMutation.isError ? (suspendMutation.error as Error).message : undefined)
        }
        onConfirm={handleConfirmReason}
      />
    </Page>
  );
}
