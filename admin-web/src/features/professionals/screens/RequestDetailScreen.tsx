// RequestDetailScreen — página /requests/:id con toda la info del pro y
// las acciones Aprobar / Rechazar. El admin decide acá, no en el listado.
//
// Post-acción: invalidación de queries (vía los hooks) + navigate al listado.

import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  ArrowLeft, Globe, MapPin, Mail, Phone, MessageCircle,
  AtSign, BadgeCheck, Quote,
} from 'lucide-react';

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { Button } from '@/shared/components/Button/Button';

import { usePendingProfessional } from '@/features/professionals/hooks/usePendingProfessional';
import { useApproveProfessional } from '@/features/professionals/hooks/useApproveProfessional';
import { useRejectProfessional } from '@/features/professionals/hooks/useRejectProfessional';
import { RejectDialog } from '@/features/professionals/components/RejectDialog';
import type {
  PendingProfessionalDetail,
  ProfessionalLocation,
} from '@/features/professionals/services/professionalsService';

import styles from './RequestDetailScreen.module.css';

export function RequestDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: pro, isLoading, isError } = usePendingProfessional(id);
  const approveMutation = useApproveProfessional();
  const rejectMutation  = useRejectProfessional();

  const [rejectOpen, setRejectOpen] = useState(false);

  function handleApprove() {
    if (!pro) return;
    approveMutation.mutate(pro.id, {
      onSuccess: () => navigate('/requests', { replace: true }),
    });
  }

  function handleRejectConfirm(reason: string) {
    if (!pro) return;
    rejectMutation.mutate(
      { id: pro.id, reason },
      {
        onSuccess: () => {
          setRejectOpen(false);
          navigate('/requests', { replace: true });
        },
      },
    );
  }

  if (isLoading) {
    return (
      <Page title="Solicitud">
        <PageLoader label="Cargando solicitud…" />
      </Page>
    );
  }

  if (isError || !pro) {
    return (
      <Page title="Solicitud">
        <div className={styles.errorBanner} role="alert">
          <p>No se pudo cargar la solicitud o no existe.</p>
          <Link to="/requests" className={styles.backLink}>
            <ArrowLeft size={16} aria-hidden />
            Volver al listado
          </Link>
        </div>
      </Page>
    );
  }

  const initial = (pro.full_name?.charAt(0) || pro.email?.charAt(0) || '?').toUpperCase();
  const isPending = pro.status === 'pending';

  return (
    <div className={styles.screen}>
      <div className={styles.content}>
        <Link to="/requests" className={styles.back}>
          <ArrowLeft size={16} aria-hidden />
          Volver a Solicitudes
        </Link>

        {/* ── Header ─────────────────────────────────────────────── */}
        <header className={styles.header}>
          {pro.photo_url ? (
            <img src={pro.photo_url} alt="" className={styles.photo} />
          ) : (
            <span className={styles.photoFallback} aria-hidden>{initial}</span>
          )}
          <div className={styles.headerText}>
            <div className={styles.statusRow}>
              <StatusBadge status={pro.status} />
              <span className={styles.waitTime}>
                Solicitado hace {formatDistanceToNow(new Date(pro.created_at), { locale: es })}
              </span>
            </div>
            <h1 className={styles.name}>{pro.full_name || 'Sin nombre'}</h1>
            <p className={styles.specialty}>{pro.specialty || 'Especialidad no cargada'}</p>
          </div>
        </header>

        {/* ── Rejection reason (si aplica) ───────────────────────── */}
        {pro.status === 'rejected' && pro.rejection_reason ? (
          <div className={styles.rejectionBanner} role="note">
            <strong>Razón del rechazo:</strong> {pro.rejection_reason}
          </div>
        ) : null}

        {/* ── Sections grid ──────────────────────────────────────── */}
        <div className={styles.sections}>
          <Section title="Datos profesionales">
            <Field label="Matrícula" value={pro.license} mono />
            <Field label="DNI"       value={pro.dni}     mono />
            <Field label="Categoría" value={pro.category} />
            <Field
              label="Modalidades"
              value={formatModalities(pro.attends_online, pro.attends_presencial)}
            />
          </Section>

          <Section title="Especialidad y áreas">
            <Field label="Especialidad" value={pro.specialty} />
            {pro.sub_specialties.length > 0 ? (
              <div>
                <p className={styles.fieldLabel}>Sub-especialidades</p>
                <div className={styles.pills}>
                  {pro.sub_specialties.map((s) => (
                    <span key={s} className={styles.pill}>{s}</span>
                  ))}
                </div>
              </div>
            ) : null}
            {pro.professional_area.length > 0 ? (
              <div>
                <p className={styles.fieldLabel}>Áreas</p>
                <div className={styles.pills}>
                  {pro.professional_area.map((a) => (
                    <span key={a} className={styles.pillAccent}>{a}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </Section>

          <Section title="Biografía" full>
            {pro.description ? (
              <p className={styles.description}>{pro.description}</p>
            ) : (
              <p className={styles.empty}>Sin descripción cargada.</p>
            )}
            {pro.quote ? (
              <blockquote className={styles.quote}>
                <Quote size={16} aria-hidden className={styles.quoteIcon} />
                <p className={styles.quoteText}>"{pro.quote}"</p>
                {pro.quote_author ? (
                  <cite className={styles.quoteAuthor}>— {pro.quote_author}</cite>
                ) : null}
              </blockquote>
            ) : null}
          </Section>

          <Section title="Contacto">
            <ContactLine icon={<Mail size={14} />}           label="Email"     value={pro.email} href={pro.email ? `mailto:${pro.email}` : null} />
            <ContactLine icon={<Phone size={14} />}          label="Teléfono"  value={pro.phone} href={pro.phone ? `tel:${pro.phone}` : null} />
            <ContactLine icon={<MessageCircle size={14} />}  label="WhatsApp"  value={pro.social_whatsapp} href={pro.social_whatsapp ? `https://wa.me/${pro.social_whatsapp.replace(/\D/g, '')}` : null} />
            <ContactLine icon={<AtSign size={14} />}         label="Instagram" value={pro.social_instagram} href={socialUrl('instagram', pro.social_instagram)} />
            <ContactLine icon={<AtSign size={14} />}         label="LinkedIn"  value={pro.social_linkedin}  href={socialUrl('linkedin', pro.social_linkedin)} />
            <ContactLine icon={<AtSign size={14} />}         label="Twitter"   value={pro.social_twitter}   href={socialUrl('twitter', pro.social_twitter)} />
            <ContactLine icon={<AtSign size={14} />}         label="TikTok"    value={pro.social_tiktok}    href={socialUrl('tiktok', pro.social_tiktok)} />
          </Section>

          <Section title="Ubicación" full>
            {pro.location ? (
              <div className={styles.location}>
                <MapPin size={16} aria-hidden className={styles.locationIcon} />
                <p className={styles.locationText}>{formatAddress(pro.location)}</p>
              </div>
            ) : (
              <p className={styles.empty}>El profesional no cargó una ubicación.</p>
            )}
            <div className={styles.modalities}>
              {pro.attends_online ? (
                <span className={styles.modalityPill}>
                  <Globe size={14} aria-hidden /> Atiende online
                </span>
              ) : null}
              {pro.attends_presencial ? (
                <span className={styles.modalityPill}>
                  <MapPin size={14} aria-hidden /> Atiende presencial
                </span>
              ) : null}
            </div>
          </Section>
        </div>

        {/* ── Error de mutation (arriba del sticky bar para no taparlo) ── */}
        {approveMutation.isError ? (
          <div className={styles.errorBanner} role="alert">
            No se pudo aprobar: {(approveMutation.error as Error).message}
          </div>
        ) : null}
      </div>

      {/* ── Sticky bottom bar (solo si está pendiente) ───────────────── */}
      {isPending ? (
        <footer className={styles.actions}>
          <div className={styles.actionsInner}>
            <div className={styles.actionsHint}>
              <BadgeCheck size={16} aria-hidden />
              Al aprobar, el profesional se vuelve visible públicamente.
            </div>
            <div className={styles.actionsButtons}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setRejectOpen(true)}
                disabled={approveMutation.isPending || rejectMutation.isPending}
              >
                Rechazar
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleApprove}
                isLoading={approveMutation.isPending}
                disabled={rejectMutation.isPending}
              >
                Aprobar solicitud
              </Button>
            </div>
          </div>
        </footer>
      ) : null}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (!rejectMutation.isPending) {
            setRejectOpen(open);
            if (!open) rejectMutation.reset();
          }
        }}
        professionalName={pro.full_name ?? ''}
        isSubmitting={rejectMutation.isPending}
        errorMessage={
          rejectMutation.isError ? (rejectMutation.error as Error).message : undefined
        }
        onConfirm={handleRejectConfirm}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-componentes inline: no se reutilizan fuera de esta screen
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
  label, value, mono = false,
}: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={[styles.fieldValue, mono && styles.mono].filter(Boolean).join(' ')}>
        {value || '—'}
      </p>
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

function StatusBadge({ status }: { status: PendingProfessionalDetail['status'] }) {
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

function socialUrl(platform: 'instagram' | 'linkedin' | 'twitter' | 'tiktok', handle: string | null): string | null {
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
