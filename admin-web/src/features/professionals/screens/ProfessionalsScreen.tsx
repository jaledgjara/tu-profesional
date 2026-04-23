// ProfessionalsScreen — listado de profesionales con data real.
// Distinta de /requests (que es sólo el triage de pending): acá se ve el
// catálogo completo con filtro de status + búsqueda + paginación.
//
// URL state:
//   ?page=N          página actual (1-indexed)
//   ?q=texto         búsqueda (nombre/email/matrícula/especialidad)
//   ?status=VALUE    approved (default) | pending | rejected | all
//
// Acciones Sprint B: Ver detalle, Suspender, Reactivar, Eliminar, Restaurar.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Ban, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { SearchInput } from '@/shared/components/SearchInput/SearchInput';
import { Pagination } from '@/shared/components/Pagination/Pagination';
import { UserCard, type UserCardAction, type UserCardStatus } from '@/shared/components/UserCard/UserCard';
import { ConfirmWithReasonDialog } from '@/shared/components/ConfirmWithReasonDialog/ConfirmWithReasonDialog';

import { useProfessionals } from '@/features/professionals/hooks/useProfessionals';
import {
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useRestoreUser,
} from '@/features/moderation/hooks/useModerationActions';
import type {
  ProfessionalStatus,
  AdminProfessional,
} from '@/features/professionals/services/professionalsService';

import styles from './ProfessionalsScreen.module.css';

const PAGE_SIZE = 20;

type StatusFilter = ProfessionalStatus | 'all';

const STATUS_TABS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'approved', label: 'Aprobados' },
  { value: 'pending',  label: 'Pendientes' },
  { value: 'rejected', label: 'Rechazados' },
  { value: 'all',      label: 'Todos' },
];

function parseStatus(raw: string | null): StatusFilter {
  if (raw === 'pending' || raw === 'rejected' || raw === 'all') return raw;
  return 'approved';
}

// Badge del listado. El estado de moderación del profile (suspended/
// deleted) pisa al status de aprobación porque es lo más importante que
// el admin necesita ver de un vistazo.
function badgeFor(pro: AdminProfessional): UserCardStatus {
  if (pro.deleted_at)   return { label: 'Eliminado',  tone: 'danger'  };
  if (pro.suspended_at) return { label: 'Suspendido', tone: 'warning' };
  if (pro.status === 'pending')  return { label: 'Pendiente',  tone: 'warning' };
  if (pro.status === 'rejected') return { label: 'Rechazado',  tone: 'danger'  };
  return pro.is_active
    ? { label: 'Activo',      tone: 'success' }
    : { label: 'Desactivado', tone: 'neutral' };
}

type PendingAction =
  | { kind: 'suspend'; id: string; name: string | null; email: string | null }
  | { kind: 'delete';  id: string; name: string | null; email: string | null }
  | null;

export function ProfessionalsScreen() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const page   = Math.max(1, Number(params.get('page')) || 1);
  const q      = params.get('q') ?? '';
  const status = parseStatus(params.get('status'));

  const { data, isLoading, isFetching, isError, refetch } = useProfessionals({
    page,
    pageSize: PAGE_SIZE,
    status:   status === 'all' ? undefined : status,
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
    if (!window.confirm('¿Reactivar este profesional?')) return;
    unsuspendMutation.mutate(id);
  }

  function handleRestore(id: string) {
    if (!window.confirm('¿Restaurar este profesional?')) return;
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
    copy.delete('page');
    setParams(copy, { replace: true });
  }

  function setStatus(next: StatusFilter) {
    const copy = new URLSearchParams(params);
    if (next === 'approved') copy.delete('status');
    else copy.set('status', next);
    copy.delete('page');
    setParams(copy, { replace: true });
  }

  const rows  = data?.rows  ?? [];
  const total = data?.total ?? 0;

  const subtitle = isLoading
    ? 'Cargando profesionales…'
    : total === 0
      ? q
        ? `Sin resultados para "${q}".`
        : 'No hay profesionales en este filtro.'
      : total === 1
        ? '1 profesional.'
        : `${total} profesionales.`;

  return (
    <Page title="Profesionales" subtitle={subtitle}>
      <div className={styles.toolbar}>
        <div className={styles.tabs} role="tablist" aria-label="Filtrar por estado">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              className={[
                styles.tab,
                status === tab.value && styles.tabActive,
              ].filter(Boolean).join(' ')}
              onClick={() => setStatus(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder="Buscar por nombre, email, matrícula…"
        />
      </div>

      {isLoading ? (
        <PageLoader label="Cargando profesionales…" />
      ) : isError ? (
        <div className={styles.errorBanner} role="alert">
          <p>No se pudieron cargar los profesionales.</p>
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {q ? 'Sin resultados' : 'Sin profesionales en este filtro'}
          </p>
          <p className={styles.emptyText}>
            {q
              ? 'Probá con otro nombre, matrícula o especialidad.'
              : 'Cambiá el filtro de arriba para ver otros estados.'}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {rows.map((pro) => {
            const isDeleted   = !!pro.deleted_at;
            const isSuspended = !!pro.suspended_at;

            const actions: UserCardAction[] = [
              {
                id:      'view',
                label:   'Ver detalle',
                icon:    <Eye size={14} aria-hidden />,
                onClick: () => navigate(`/professionals/${pro.id}`),
              },
              ...(isDeleted
                ? [{
                    id:      'restore',
                    label:   'Restaurar',
                    icon:    <RotateCcw size={14} aria-hidden />,
                    onClick: () => handleRestore(pro.id),
                  } as UserCardAction]
                : isSuspended
                  ? [
                      {
                        id:      'reactivate',
                        label:   'Reactivar',
                        icon:    <CheckCircle2 size={14} aria-hidden />,
                        onClick: () => handleUnsuspend(pro.id),
                      } as UserCardAction,
                      {
                        id:      'delete',
                        label:   'Eliminar',
                        icon:    <Trash2 size={14} aria-hidden />,
                        variant: 'danger',
                        onClick: () => setPending({ kind: 'delete', id: pro.id, name: pro.full_name, email: pro.email }),
                      } as UserCardAction,
                    ]
                  : [
                      {
                        id:      'suspend',
                        label:   'Suspender',
                        icon:    <Ban size={14} aria-hidden />,
                        onClick: () => setPending({ kind: 'suspend', id: pro.id, name: pro.full_name, email: pro.email }),
                      } as UserCardAction,
                      {
                        id:      'delete',
                        label:   'Eliminar',
                        icon:    <Trash2 size={14} aria-hidden />,
                        variant: 'danger',
                        onClick: () => setPending({ kind: 'delete', id: pro.id, name: pro.full_name, email: pro.email }),
                      } as UserCardAction,
                    ]
              ),
            ];

            const subtitleText = [
              pro.specialty,
              pro.license ? `MN ${pro.license}` : null,
              `hace ${formatDistanceToNow(new Date(pro.created_at), { locale: es })}`,
            ].filter(Boolean).join(' · ');

            return (
              <UserCard
                key={pro.id}
                avatarUrl={pro.photo_url}
                name={pro.full_name}
                email={pro.email}
                subtitle={subtitleText}
                status={badgeFor(pro)}
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
        title={pending?.kind === 'delete' ? 'Eliminar profesional' : 'Suspender profesional'}
        subject={
          pending ? (
            <>
              {pending.name ? <strong>{pending.name}</strong> : null}
              {pending.name && pending.email ? <> · </> : null}
              {pending.email}
            </>
          ) : null
        }
        confirmLabel={pending?.kind === 'delete' ? 'Eliminar' : 'Suspender'}
        tone={pending?.kind === 'delete' ? 'danger' : 'default'}
        minLength={pending?.kind === 'delete' ? 20 : 10}
        placeholder={
          pending?.kind === 'delete'
            ? '¿Por qué eliminás a este profesional? (mínimo 20 caracteres)'
            : '¿Por qué suspendés a este profesional?'
        }
        hint={
          pending?.kind === 'delete'
            ? 'El profesional deja de aparecer y no puede loguearse. Sus reseñas se conservan. Reversible desde el detalle.'
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
