// ReviewCard — tarjeta de una reseña en la vista de moderación.
// Muestra rating (stars), comentario, meta del reviewer y del profesional,
// y un dropdown de acciones (ocultar/reactivar/eliminar).
//
// Si la reseña está oculta (hidden_at != null), se muestra un banner con la
// razón y quién la ocultó, y la acción pasa de "Ocultar" a "Reactivar".

import { Star, EyeOff, Eye, Trash2, MoreVertical } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import type { AdminReview } from '@/features/reviews/services/reviewsService';

import styles from './ReviewCard.module.css';

interface ReviewCardProps {
  review:    AdminReview;
  onHide:    (review: AdminReview) => void;
  onUnhide:  (review: AdminReview) => void;
  onDelete:  (review: AdminReview) => void;
}

export function ReviewCard({ review, onHide, onUnhide, onDelete }: ReviewCardProps) {
  const isHidden      = review.hidden_at != null;
  const proName       = review.professional_name || 'Profesional sin nombre';
  const proInitial    = proName.charAt(0).toUpperCase();
  const reviewerEmail = review.reviewer_email ?? '—';

  return (
    <article className={[styles.card, isHidden && styles.cardHidden].filter(Boolean).join(' ')}>
      <header className={styles.header}>
        <div className={styles.rating} aria-label={`${review.rating} de 5 estrellas`}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={16}
              className={n <= review.rating ? styles.starFilled : styles.starEmpty}
              aria-hidden
            />
          ))}
          <span className={styles.ratingText}>{review.rating}/5</span>
        </div>

        <div className={styles.headerActions}>
          <time className={styles.date} dateTime={review.created_at}>
            hace {formatDistanceToNow(new Date(review.created_at), { locale: es })}
          </time>
          {isHidden ? (
            <span className={styles.hiddenBadge}>
              <EyeOff size={12} aria-hidden /> Oculta
            </span>
          ) : null}

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button type="button" className={styles.menuTrigger} aria-label="Acciones">
                <MoreVertical size={18} aria-hidden />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className={styles.menu} align="end" sideOffset={4}>
                {isHidden ? (
                  <DropdownMenu.Item
                    className={styles.menuItem}
                    onSelect={(e) => { e.preventDefault(); onUnhide(review); }}
                  >
                    <Eye size={14} aria-hidden /> Reactivar
                  </DropdownMenu.Item>
                ) : (
                  <DropdownMenu.Item
                    className={styles.menuItem}
                    onSelect={(e) => { e.preventDefault(); onHide(review); }}
                  >
                    <EyeOff size={14} aria-hidden /> Ocultar
                  </DropdownMenu.Item>
                )}
                <DropdownMenu.Item
                  className={[styles.menuItem, styles.menuItemDanger].join(' ')}
                  onSelect={(e) => { e.preventDefault(); onDelete(review); }}
                >
                  <Trash2 size={14} aria-hidden /> Eliminar
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <p className={styles.comment}>{review.comment}</p>

      {isHidden && review.hidden_reason ? (
        <div className={styles.hiddenBanner} role="note">
          <p className={styles.hiddenBannerTitle}>
            Oculta por {review.hidden_by_email ?? 'admin'}
            {review.hidden_at ? (
              <>
                {' · '}
                <time dateTime={review.hidden_at}>
                  hace {formatDistanceToNow(new Date(review.hidden_at), { locale: es })}
                </time>
              </>
            ) : null}
          </p>
          <p className={styles.hiddenBannerReason}>{review.hidden_reason}</p>
        </div>
      ) : null}

      <footer className={styles.footer}>
        <div className={styles.pro}>
          {review.professional_photo_url ? (
            <img
              src={review.professional_photo_url}
              alt=""
              className={styles.proAvatar}
              loading="lazy"
            />
          ) : (
            <span className={styles.proAvatarFallback} aria-hidden>{proInitial}</span>
          )}
          <div className={styles.proText}>
            <span className={styles.proLabel}>Sobre</span>
            <span className={styles.proName} title={proName}>{proName}</span>
          </div>
        </div>

        <div className={styles.reviewer}>
          <span className={styles.reviewerLabel}>Escrita por</span>
          <span className={styles.reviewerEmail} title={reviewerEmail}>{reviewerEmail}</span>
        </div>
      </footer>
    </article>
  );
}
