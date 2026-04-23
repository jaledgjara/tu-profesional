// ClientDetailScreen — página /clients/:id.
// Perfil + último sign-in + reseñas escritas + acciones de moderación
// (suspender, reactivar, eliminar, restaurar — Sprint B).

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Mail, MessageSquare, Star, EyeOff,
  Ban, CheckCircle2, Trash2, RotateCcw,
} from 'lucide-react';

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { Button } from '@/shared/components/Button/Button';
import { ConfirmWithReasonDialog } from '@/shared/components/ConfirmWithReasonDialog/ConfirmWithReasonDialog';

import { useClient } from '@/features/clients/hooks/useClient';
import {
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useRestoreUser,
} from '@/features/moderation/hooks/useModerationActions';

import styles from './ClientDetailScreen.module.css';

export function ClientDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useClient(id);

  // Diálogos de razón obligatoria — uno por acción destructiva.
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);

  const suspendMutation   = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const deleteMutation    = useDeleteUser();
  const restoreMutation   = useRestoreUser();

  if (isLoading) {
    return (
      <Page title="Cliente">
        <PageLoader label="Cargando cliente…" />
      </Page>
    );
  }

  if (isError || !data) {
    return (
      <Page title="Cliente">
        <div className={styles.errorBanner} role="alert">
          <p>No se pudo cargar el cliente o no existe.</p>
          <Link to="/clients" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Volver al listado
          </Link>
        </div>
      </Page>
    );
  }

  const { profile, auth, moderation, reviews_stats, reviews } = data;
  const initial = (profile.email?.charAt(0) || '?').toUpperCase();

  const isDeleted   = !!profile.deleted_at;
  const isSuspended = !!profile.suspended_at;
  // Mientras cualquier mutation corre, deshabilitamos todos los botones
  // para evitar doble-click / acciones concurrentes.
  const anyPending = suspendMutation.isPending
    || unsuspendMutation.isPending
    || deleteMutation.isPending
    || restoreMutation.isPending;

  function handleSuspendConfirm(reason: string) {
    suspendMutation.mutate({ id: profile.id, reason }, {
      onSuccess: () => {
        setSuspendOpen(false);
        suspendMutation.reset();
      },
    });
  }

  function handleDeleteConfirm(reason: string) {
    deleteMutation.mutate({ id: profile.id, reason }, {
      onSuccess: () => {
        setDeleteOpen(false);
        deleteMutation.reset();
      },
    });
  }

  function handleUnsuspend() {
    if (!window.confirm('¿Reactivar este cliente? Va a poder escribir reseñas de nuevo.')) return;
    unsuspendMutation.mutate(profile.id);
  }

  function handleRestore() {
    if (!window.confirm('¿Restaurar este cliente? Va a volver a aparecer como activo.')) return;
    restoreMutation.mutate(profile.id);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <Link to="/clients" className={styles.back}>
          <ArrowLeft size={16} aria-hidden />
          Volver a Clientes
        </Link>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className={styles.header}>
          <span className={styles.avatar} aria-hidden>{initial}</span>
          <div className={styles.headerText}>
            <span className={styles.role}>Cliente</span>
            <h1 className={styles.name}>{profile.email ?? 'Sin email'}</h1>
            <p className={styles.meta}>
              Registrado hace {formatDistanceToNow(new Date(profile.created_at), { locale: es })}
            </p>
          </div>
          <div className={styles.headerActions}>
            {isDeleted ? (
              // Eliminado: solo se puede restaurar. Suspender no aplica.
              <Button
                type="button"
                variant="secondary"
                onClick={handleRestore}
                isLoading={restoreMutation.isPending}
                disabled={anyPending && !restoreMutation.isPending}
              >
                <RotateCcw size={14} aria-hidden />
                Restaurar
              </Button>
            ) : isSuspended ? (
              // Suspendido: permitimos Reactivar + todavía se puede Eliminar.
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleUnsuspend}
                  isLoading={unsuspendMutation.isPending}
                  disabled={anyPending && !unsuspendMutation.isPending}
                >
                  <CheckCircle2 size={14} aria-hidden />
                  Reactivar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeleteOpen(true)}
                  disabled={anyPending}
                >
                  <Trash2 size={14} aria-hidden />
                  Eliminar
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setSuspendOpen(true)}
                  disabled={anyPending}
                >
                  <Ban size={14} aria-hidden />
                  Suspender
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setDeleteOpen(true)}
                  disabled={anyPending}
                >
                  <Trash2 size={14} aria-hidden />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        </header>

        {/* ── Banners de moderación ──────────────────────────────── */}
        {isDeleted ? (
          <div className={styles.bannerDanger} role="note">
            <strong>Cuenta eliminada</strong>
            {moderation.deleted_at ? (
              <> el {format(new Date(moderation.deleted_at), "d MMM yyyy · HH:mm", { locale: es })}</>
            ) : null}
            {moderation.deleted_by_email ? <> por {moderation.deleted_by_email}</> : null}
            . La cuenta no aparece en listados ni puede iniciar sesión.
          </div>
        ) : isSuspended ? (
          <div className={styles.bannerWarning} role="note">
            <strong>Cuenta suspendida</strong>
            {moderation.suspended_at ? (
              <> el {format(new Date(moderation.suspended_at), "d MMM yyyy · HH:mm", { locale: es })}</>
            ) : null}
            {moderation.suspended_by_email ? <> por {moderation.suspended_by_email}</> : null}
            .{' '}
            {moderation.suspension_reason ? (
              <>Razón: {moderation.suspension_reason}</>
            ) : null}
          </div>
        ) : null}

        {/* ── Error de mutation (se muestra bajo el header) ──────── */}
        {unsuspendMutation.isError ? (
          <div className={styles.bannerDanger} role="alert">
            No se pudo reactivar: {(unsuspendMutation.error as Error).message}
          </div>
        ) : null}
        {restoreMutation.isError ? (
          <div className={styles.bannerDanger} role="alert">
            No se pudo restaurar: {(restoreMutation.error as Error).message}
          </div>
        ) : null}

        {/* ── Secciones en grid ──────────────────────────────────── */}
        <div className={styles.sections}>
          <Section title="Cuenta">
            <Field label="Email" value={profile.email} icon={<Mail size={14} />} />
            <Field label="ID" value={profile.id} mono />
            <Field label="Rol" value={profile.role} />
            <Field
              label="Creado"
              value={format(new Date(profile.created_at), "d MMM yyyy · HH:mm", { locale: es })}
            />
            <Field
              label="Último sign-in"
              value={
                auth.last_sign_in_at
                  ? `${format(new Date(auth.last_sign_in_at), "d MMM yyyy · HH:mm", { locale: es })}`
                  : 'Nunca'
              }
            />
          </Section>

          <Section title="Actividad como reviewer">
            <div className={styles.statsGrid}>
              <Stat label="Reseñas totales" value={reviews_stats.total} />
              <Stat label="Visibles" value={reviews_stats.visible} />
              <Stat label="Ocultas" value={reviews_stats.hidden} tone={reviews_stats.hidden > 0 ? 'warning' : undefined} />
              <Stat
                label="Rating promedio"
                value={reviews_stats.total > 0 ? reviews_stats.avg_rating.toFixed(1) : '—'}
              />
            </div>
          </Section>

          <Section title="Últimas reseñas escritas" full>
            {reviews.length === 0 ? (
              <p className={styles.empty}>Todavía no escribió reseñas.</p>
            ) : (
              <ul className={styles.reviewList}>
                {reviews.map((r) => (
                  <li key={r.id} className={styles.reviewItem}>
                    <button
                      type="button"
                      className={styles.reviewProfessional}
                      onClick={() => navigate(`/professionals/${r.professional_id}`)}
                      title="Abrir profesional"
                    >
                      {r.professional_photo_url ? (
                        <img src={r.professional_photo_url} alt="" className={styles.reviewPhoto} />
                      ) : (
                        <span className={styles.reviewPhotoFallback} aria-hidden>
                          {(r.professional_name?.charAt(0) ?? '?').toUpperCase()}
                        </span>
                      )}
                      <span className={styles.reviewProfessionalName}>
                        {r.professional_name ?? 'Profesional'}
                      </span>
                    </button>
                    <div className={styles.reviewBody}>
                      <div className={styles.reviewRow}>
                        <span className={styles.reviewRating}>
                          <Star size={12} aria-hidden fill="currentColor" /> {r.rating}
                        </span>
                        <span className={styles.reviewDate}>
                          {format(new Date(r.created_at), "d MMM yyyy", { locale: es })}
                        </span>
                        {r.hidden_at ? (
                          <span className={styles.reviewHidden} title={r.hidden_reason ?? 'Oculta'}>
                            <EyeOff size={12} aria-hidden />
                            Oculta
                          </span>
                        ) : null}
                      </div>
                      {r.comment ? (
                        <p className={styles.reviewComment}>
                          <MessageSquare size={12} aria-hidden className={styles.reviewIcon} />
                          {r.comment}
                        </p>
                      ) : (
                        <p className={styles.reviewEmpty}>Sin comentario.</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>
      </div>

      {/* ── Dialogs ──────────────────────────────────────────────── */}
      <ConfirmWithReasonDialog
        open={suspendOpen}
        onOpenChange={(open) => {
          if (!suspendMutation.isPending) {
            setSuspendOpen(open);
            if (!open) suspendMutation.reset();
          }
        }}
        title="Suspender cliente"
        subject={<>Email: <strong>{profile.email}</strong></>}
        confirmLabel="Suspender"
        tone="default"
        minLength={10}
        placeholder="¿Por qué suspendés a este cliente? (ej: reseñas con insultos)"
        hint="Esta razón se guarda en el audit log. La suspensión es reversible."
        isSubmitting={suspendMutation.isPending}
        errorMessage={
          suspendMutation.isError ? (suspendMutation.error as Error).message : undefined
        }
        onConfirm={handleSuspendConfirm}
      />

      <ConfirmWithReasonDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleteMutation.isPending) {
            setDeleteOpen(open);
            if (!open) deleteMutation.reset();
          }
        }}
        title="Eliminar cliente"
        subject={<>Email: <strong>{profile.email}</strong></>}
        confirmLabel="Eliminar"
        tone="danger"
        minLength={20}
        placeholder="¿Por qué eliminás a este cliente? (mínimo 20 caracteres)"
        hint="El cliente deja de aparecer en listados y no puede loguearse. Sus reseñas se conservan. Es reversible desde el detalle."
        isSubmitting={deleteMutation.isPending}
        errorMessage={
          deleteMutation.isError ? (deleteMutation.error as Error).message : undefined
        }
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componentes inline
// ─────────────────────────────────────────────────────────────────

function Section({
  title, children, full = false,
}: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <section className={[styles.section, full && styles.sectionFull].filter(Boolean).join(' ')}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.sectionBody}>{children}</div>
    </section>
  );
}

function Field({
  label, value, mono = false, icon,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={[styles.fieldValue, mono && styles.mono].filter(Boolean).join(' ')}>
        {icon ? <span className={styles.fieldIcon}>{icon}</span> : null}
        {value || '—'}
      </p>
    </div>
  );
}

function Stat({
  label, value, tone,
}: {
  label: string;
  value: string | number;
  tone?: 'warning';
}) {
  return (
    <div className={[styles.stat, tone === 'warning' && styles.statWarning].filter(Boolean).join(' ')}>
      <p className={styles.statValue}>{value}</p>
      <p className={styles.statLabel}>{label}</p>
    </div>
  );
}
