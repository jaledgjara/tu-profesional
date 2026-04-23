// ProfessionalDetailScreen — página /professionals/:id.
// Distinta de RequestDetailScreen (que es del flujo /requests/:id para triage
// de pending). Acá se ve el perfil completo del pro con el historial de
// moderación, estado de la suscripción y las reseñas recibidas.
//
// Sprint B: suspender / reactivar / eliminar / restaurar cableados. Las
// acciones de suscripción (pausar/otorgar gracia) aterrizan en Sprint C.

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Mail, Phone, MessageCircle, AtSign, MapPin, Globe,
  Quote, Star, EyeOff, Ban, CheckCircle2, Trash2, RotateCcw,
  PauseCircle, PlayCircle, MessageSquare,
} from 'lucide-react';

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { Button } from '@/shared/components/Button/Button';
import { ConfirmWithReasonDialog } from '@/shared/components/ConfirmWithReasonDialog/ConfirmWithReasonDialog';

import { useProfessional } from '@/features/professionals/hooks/useProfessional';
import {
  useSuspendUser,
  useUnsuspendUser,
  useDeleteUser,
  useRestoreUser,
} from '@/features/moderation/hooks/useModerationActions';
import type {
  ProfessionalStatus,
  SubscriptionStatus,
  ProfessionalLocation,
} from '@/features/professionals/services/professionalsService';

import styles from './ProfessionalDetailScreen.module.css';

export function ProfessionalDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProfessional(id);

  const [suspendOpen, setSuspendOpen] = useState(false);
  const [deleteOpen,  setDeleteOpen]  = useState(false);

  const suspendMutation   = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();
  const deleteMutation    = useDeleteUser();
  const restoreMutation   = useRestoreUser();

  if (isLoading) {
    return (
      <Page title="Profesional">
        <PageLoader label="Cargando profesional…" />
      </Page>
    );
  }

  if (isError || !data) {
    return (
      <Page title="Profesional">
        <div className={styles.errorBanner} role="alert">
          <p>No se pudo cargar el profesional o no existe.</p>
          <Link to="/professionals" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Volver al listado
          </Link>
        </div>
      </Page>
    );
  }

  const { profile, auth, professional, location, subscription, moderation, user_moderation, reviews_stats, reviews } = data;
  const initial = (professional?.full_name?.charAt(0) ?? profile.email?.charAt(0) ?? '?').toUpperCase();
  const isRejected = professional?.status === 'rejected';
  const subscriptionBadge = subscription ? subscriptionBadgeFor(subscription.status) : null;
  const isSubscriptionBlocking =
    subscription?.status === 'past_due' || subscription?.status === 'paused' || subscription?.status === 'canceled';

  const isDeleted   = !!profile.deleted_at;
  const isSuspended = !!profile.suspended_at;
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
    if (!window.confirm('¿Reactivar este profesional? Vuelve a aparecer en búsquedas si cumple los otros criterios.')) return;
    unsuspendMutation.mutate(profile.id);
  }

  function handleRestore() {
    if (!window.confirm('¿Restaurar este profesional?')) return;
    restoreMutation.mutate(profile.id);
  }

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <Link to="/professionals" className={styles.back}>
          <ArrowLeft size={16} aria-hidden />
          Volver a Profesionales
        </Link>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className={styles.header}>
          {professional?.photo_url ? (
            <img src={professional.photo_url} alt="" className={styles.photo} />
          ) : (
            <span className={styles.photoFallback} aria-hidden>{initial}</span>
          )}
          <div className={styles.headerText}>
            <div className={styles.badgeRow}>
              {professional ? <StatusBadge status={professional.status} /> : null}
              {subscriptionBadge ? (
                <span className={[styles.subBadge, styles[`sub${subscriptionBadge.tone}`]].join(' ')}>
                  {subscriptionBadge.label}
                </span>
              ) : null}
              <span className={styles.waitTime}>
                Registrado hace {formatDistanceToNow(new Date(profile.created_at), { locale: es })}
              </span>
            </div>
            <h1 className={styles.name}>{professional?.full_name || 'Sin nombre'}</h1>
            <p className={styles.specialty}>{professional?.specialty || 'Especialidad no cargada'}</p>
          </div>
          <div className={styles.headerActions}>
            {isDeleted ? (
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

        {/* ── Banners de moderación del profile ──────────────────── */}
        {isDeleted ? (
          <div className={styles.bannerDanger} role="note">
            <strong>Cuenta eliminada</strong>
            {user_moderation.deleted_at ? (
              <> el {format(new Date(user_moderation.deleted_at), "d MMM yyyy · HH:mm", { locale: es })}</>
            ) : null}
            {user_moderation.deleted_by_email ? <> por {user_moderation.deleted_by_email}</> : null}
            . El profesional no aparece en búsquedas ni puede iniciar sesión.
          </div>
        ) : isSuspended ? (
          <div className={styles.bannerWarning} role="note">
            <strong>Cuenta suspendida</strong>
            {user_moderation.suspended_at ? (
              <> el {format(new Date(user_moderation.suspended_at), "d MMM yyyy · HH:mm", { locale: es })}</>
            ) : null}
            {user_moderation.suspended_by_email ? <> por {user_moderation.suspended_by_email}</> : null}
            .{' '}
            {user_moderation.suspension_reason ? (
              <>Razón: {user_moderation.suspension_reason}</>
            ) : null}
          </div>
        ) : null}

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

        {/* ── Banners contextuales ───────────────────────────────── */}
        {isRejected && moderation?.rejection_reason ? (
          <div className={styles.bannerDanger} role="note">
            <strong>Rechazado:</strong> {moderation.rejection_reason}
          </div>
        ) : null}

        {isSubscriptionBlocking ? (
          <div className={styles.bannerWarning} role="note">
            <strong>Suscripción {subscriptionBadge?.label.toLowerCase()}.</strong>{' '}
            {subscription?.ends_at
              ? `Período actual terminó ${format(new Date(subscription.ends_at), "d MMM yyyy", { locale: es })}.`
              : 'Sin fecha de fin registrada.'}
          </div>
        ) : null}

        {/* ── Secciones ──────────────────────────────────────────── */}
        <div className={styles.sections}>
          <Section title="Cuenta">
            <Field label="Email" value={profile.email} icon={<Mail size={14} />} />
            <Field label="ID" value={profile.id} mono />
            <Field
              label="Creado"
              value={format(new Date(profile.created_at), "d MMM yyyy · HH:mm", { locale: es })}
            />
            <Field
              label="Último sign-in"
              value={
                auth.last_sign_in_at
                  ? format(new Date(auth.last_sign_in_at), "d MMM yyyy · HH:mm", { locale: es })
                  : 'Nunca'
              }
            />
          </Section>

          <Section title="Suscripción">
            <div className={styles.subHeader}>
              {subscriptionBadge ? (
                <span className={[styles.subBadgeLg, styles[`sub${subscriptionBadge.tone}`]].join(' ')}>
                  {subscriptionBadge.label}
                </span>
              ) : (
                <span className={styles.empty}>Sin suscripción.</span>
              )}
              <div className={styles.subActions}>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => console.log('TODO Sprint C: pausar suscripción', profile.id)}
                  disabled
                  title="Disponible en Sprint C"
                >
                  <PauseCircle size={14} aria-hidden />
                  Pausar
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => console.log('TODO Sprint C: dar gracia', profile.id)}
                  disabled
                  title="Disponible en Sprint C"
                >
                  <PlayCircle size={14} aria-hidden />
                  Otorgar gracia
                </Button>
              </div>
            </div>
            <Field
              label="Fin período actual"
              value={
                subscription?.ends_at
                  ? format(new Date(subscription.ends_at), "d MMM yyyy · HH:mm", { locale: es })
                  : '—'
              }
            />
            <Field
              label="Fin del trial"
              value={
                subscription?.trial_ends_at
                  ? format(new Date(subscription.trial_ends_at), "d MMM yyyy", { locale: es })
                  : '—'
              }
            />
            <Field label="ID Preapproval MP" value={subscription?.mp_preapproval_id ?? null} mono />
          </Section>

          <Section title="Datos profesionales">
            <Field label="Matrícula" value={professional?.license} mono />
            <Field label="DNI"       value={professional?.dni}     mono />
            <Field label="Categoría" value={professional?.category ?? null} />
            <Field
              label="Modalidades"
              value={formatModalities(
                professional?.attends_online ?? false,
                professional?.attends_presencial ?? false,
              )}
            />
          </Section>

          <Section title="Especialidad y áreas">
            <Field label="Especialidad" value={professional?.specialty ?? null} />
            {professional && professional.sub_specialties.length > 0 ? (
              <div>
                <p className={styles.fieldLabel}>Sub-especialidades</p>
                <div className={styles.pills}>
                  {professional.sub_specialties.map((s) => (
                    <span key={s} className={styles.pill}>{s}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {professional && professional.professional_area.length > 0 ? (
              <div>
                <p className={styles.fieldLabel}>Áreas</p>
                <div className={styles.pills}>
                  {professional.professional_area.map((a) => (
                    <span key={a} className={styles.pillAccent}>{a}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </Section>

          <Section title="Biografía" full>
            {professional?.description ? (
              <p className={styles.description}>{professional.description}</p>
            ) : (
              <p className={styles.empty}>Sin descripción cargada.</p>
            )}
            {professional?.quote ? (
              <blockquote className={styles.quote}>
                <Quote size={16} aria-hidden className={styles.quoteIcon} />
                <p className={styles.quoteText}>"{professional.quote}"</p>
                {professional.quote_author ? (
                  <cite className={styles.quoteAuthor}>— {professional.quote_author}</cite>
                ) : null}
              </blockquote>
            ) : null}
          </Section>

          <Section title="Contacto">
            <ContactLine icon={<Mail size={14} />}          label="Email"     value={profile.email}                    href={profile.email ? `mailto:${profile.email}` : null} />
            <ContactLine icon={<Phone size={14} />}         label="Teléfono"  value={professional?.phone ?? null}      href={professional?.phone ? `tel:${professional.phone}` : null} />
            <ContactLine icon={<MessageCircle size={14} />} label="WhatsApp"  value={professional?.social_whatsapp ?? null} href={professional?.social_whatsapp ? `https://wa.me/${professional.social_whatsapp.replace(/\D/g, '')}` : null} />
            <ContactLine icon={<AtSign size={14} />}        label="Instagram" value={professional?.social_instagram ?? null} href={socialUrl('instagram', professional?.social_instagram ?? null)} />
            <ContactLine icon={<AtSign size={14} />}        label="LinkedIn"  value={professional?.social_linkedin ?? null}  href={socialUrl('linkedin',  professional?.social_linkedin ?? null)} />
            <ContactLine icon={<AtSign size={14} />}        label="Twitter"   value={professional?.social_twitter ?? null}   href={socialUrl('twitter',   professional?.social_twitter ?? null)} />
            <ContactLine icon={<AtSign size={14} />}        label="TikTok"    value={professional?.social_tiktok ?? null}    href={socialUrl('tiktok',    professional?.social_tiktok ?? null)} />
          </Section>

          <Section title="Ubicación" full>
            {location ? (
              <div className={styles.location}>
                <MapPin size={16} aria-hidden className={styles.locationIcon} />
                <p className={styles.locationText}>{formatAddress(location)}</p>
              </div>
            ) : (
              <p className={styles.empty}>El profesional no cargó una ubicación.</p>
            )}
            <div className={styles.modalities}>
              {professional?.attends_online ? (
                <span className={styles.modalityPill}>
                  <Globe size={14} aria-hidden /> Atiende online
                </span>
              ) : null}
              {professional?.attends_presencial ? (
                <span className={styles.modalityPill}>
                  <MapPin size={14} aria-hidden /> Atiende presencial
                </span>
              ) : null}
            </div>
          </Section>

          <Section title="Historial de moderación" full>
            {moderation && (moderation.reviewed_at || moderation.rejection_reason) ? (
              <>
                <Field
                  label="Revisado"
                  value={
                    moderation.reviewed_at
                      ? format(new Date(moderation.reviewed_at), "d MMM yyyy · HH:mm", { locale: es })
                      : '—'
                  }
                />
                <Field label="Revisado por" value={moderation.reviewed_by_email} />
                {moderation.rejection_reason ? (
                  <Field label="Razón de rechazo" value={moderation.rejection_reason} />
                ) : null}
              </>
            ) : (
              <p className={styles.empty}>Sin historial de moderación. El profesional aún no fue revisado.</p>
            )}
          </Section>

          <Section title="Reseñas recibidas" full>
            <div className={styles.statsGrid}>
              <Stat label="Totales" value={reviews_stats.total} />
              <Stat label="Visibles" value={reviews_stats.visible} />
              <Stat
                label="Ocultas"
                value={reviews_stats.hidden}
                tone={reviews_stats.hidden > 0 ? 'warning' : undefined}
              />
              <Stat
                label="Promedio"
                value={reviews_stats.visible > 0 ? reviews_stats.avg_rating.toFixed(1) : '—'}
              />
            </div>

            {reviews_stats.visible > 0 ? (
              <div className={styles.breakdown}>
                {([5, 4, 3, 2, 1] as const).map((n) => {
                  const count = reviews_stats.rating_breakdown[n];
                  const pct = reviews_stats.visible > 0 ? (count / reviews_stats.visible) * 100 : 0;
                  return (
                    <div key={n} className={styles.breakdownRow}>
                      <span className={styles.breakdownLabel}>{n} <Star size={11} aria-hidden fill="currentColor" /></span>
                      <div className={styles.breakdownBar}>
                        <div className={styles.breakdownFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.breakdownCount}>{count}</span>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {reviews.length === 0 ? (
              <p className={styles.empty}>Todavía no recibió reseñas.</p>
            ) : (
              <ul className={styles.reviewList}>
                {reviews.map((r) => (
                  <li key={r.id} className={styles.reviewItem}>
                    <div className={styles.reviewHeader}>
                      <button
                        type="button"
                        className={styles.reviewReviewer}
                        onClick={() => navigate(`/clients/${r.reviewer_id}`)}
                        title="Abrir cliente"
                      >
                        {r.reviewer_email ?? 'anónimo'}
                      </button>
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
        title="Suspender profesional"
        subject={
          <>
            {professional?.full_name ? <strong>{professional.full_name}</strong> : null}
            {professional?.full_name && profile.email ? <> · </> : null}
            {profile.email}
          </>
        }
        confirmLabel="Suspender"
        tone="default"
        minLength={10}
        placeholder="¿Por qué suspendés a este profesional? (ej: reportes de mala praxis)"
        hint="Esta razón se guarda en el audit log. La suspensión es reversible. El pro deja de aparecer en búsquedas."
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
        title="Eliminar profesional"
        subject={
          <>
            {professional?.full_name ? <strong>{professional.full_name}</strong> : null}
            {professional?.full_name && profile.email ? <> · </> : null}
            {profile.email}
          </>
        }
        confirmLabel="Eliminar"
        tone="danger"
        minLength={20}
        placeholder="¿Por qué eliminás a este profesional? (mínimo 20 caracteres)"
        hint="El profesional deja de aparecer y no puede loguearse. Sus reseñas recibidas se conservan. Reversible desde este detalle."
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

function ContactLine({
  icon, label, value, href,
}: {
  icon:  React.ReactNode;
  label: string;
  value: string | null | undefined;
  href:  string | null;
}) {
  const hasValue = !!value;
  return (
    <div className={styles.contactLine}>
      <span className={styles.contactIcon}>{icon}</span>
      <span className={styles.contactLabel}>{label}</span>
      {hasValue && href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={styles.contactValue}>
          {value}
        </a>
      ) : hasValue ? (
        <span className={styles.contactValue}>{value}</span>
      ) : (
        <span className={styles.contactEmpty}>—</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ProfessionalStatus }) {
  const map = {
    pending:  { label: 'Pendiente',  cls: styles.statusPending },
    approved: { label: 'Aprobado',   cls: styles.statusApproved },
    rejected: { label: 'Rechazado',  cls: styles.statusRejected },
  } as const;
  const { label, cls } = map[status];
  return <span className={[styles.status, cls].join(' ')}>{label}</span>;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

// Mapea el estado crudo de la suscripción al badge visible + tono visual.
// 'Success' para estados saludables (active/trialing), 'Warning' para past_due
// (en grace, todavía recuperable), 'Neutral' para paused/canceled/none.
function subscriptionBadgeFor(status: SubscriptionStatus): { label: string; tone: 'Success' | 'Warning' | 'Neutral' } {
  switch (status) {
    case 'active':    return { label: 'Activa',    tone: 'Success' };
    case 'trialing':  return { label: 'En trial',  tone: 'Success' };
    case 'past_due':  return { label: 'Vencida',   tone: 'Warning' };
    case 'paused':    return { label: 'Pausada',   tone: 'Neutral' };
    case 'canceled':  return { label: 'Cancelada', tone: 'Neutral' };
    case 'none':      return { label: 'Sin susc.', tone: 'Neutral' };
  }
}

function formatModalities(online: boolean, presencial: boolean): string {
  const parts: string[] = [];
  if (online)     parts.push('Online');
  if (presencial) parts.push('Presencial');
  return parts.length > 0 ? parts.join(' · ') : 'Sin modalidad cargada';
}

function formatAddress(loc: ProfessionalLocation): string {
  const line1Parts = [loc.street, loc.number].filter(Boolean);
  const extras     = [loc.floor, loc.apartment].filter(Boolean).join(' ');
  const line1      = line1Parts.join(' ') + (extras ? `, ${extras}` : '');
  const line2      = [loc.city, loc.province, loc.country].filter(Boolean).join(', ');
  return [line1, line2].filter(Boolean).join(' — ');
}

function socialUrl(
  platform: 'instagram' | 'linkedin' | 'twitter' | 'tiktok',
  handle: string | null,
): string | null {
  if (!handle) return null;
  if (handle.startsWith('http')) return handle;
  const clean = handle.replace(/^@/, '');
  switch (platform) {
    case 'instagram': return `https://instagram.com/${clean}`;
    case 'linkedin':  return `https://linkedin.com/in/${clean}`;
    case 'twitter':   return `https://twitter.com/${clean}`;
    case 'tiktok':    return `https://tiktok.com/@${clean}`;
  }
}
