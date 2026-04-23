// ReviewsScreen — moderación de reseñas con data real.
// Tabs de estado (visibles/ocultas/todas), filtro por rating (★ 1..5),
// búsqueda en el comentario, paginación.
//
// Acciones por card (dropdown):
//   - Ocultar (soft hide, reversible) — exige razón ≥ 10 chars
//   - Reactivar (si ya está oculta)
//   - Eliminar (hard delete) — exige razón ≥ 20 chars
//
// URL state:
//   ?page=N           página actual (1-indexed)
//   ?q=texto          búsqueda en comment
//   ?status=VALUE     visible (default) | hidden | all
//   ?rating=N         1..5, undefined = todos
//
// Las mutations invalidan la key ['reviews'] para que cualquier tab
// abierto se refresque tras una acción.

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';

import { Page } from '@/shared/components/Page/Page';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { SearchInput } from '@/shared/components/SearchInput/SearchInput';
import { Pagination } from '@/shared/components/Pagination/Pagination';
import { ConfirmWithReasonDialog } from '@/shared/components/ConfirmWithReasonDialog/ConfirmWithReasonDialog';

import { ReviewCard } from '@/features/reviews/components/ReviewCard';
import { useReviews } from '@/features/reviews/hooks/useReviews';
import {
  useHideReview,
  useUnhideReview,
  useDeleteReview,
} from '@/features/reviews/hooks/useReviewMutations';
import type {
  AdminReview,
  ReviewListStatus,
} from '@/features/reviews/services/reviewsService';

import styles from './ReviewsScreen.module.css';

const PAGE_SIZE = 20;

const STATUS_TABS: ReadonlyArray<{ value: ReviewListStatus; label: string }> = [
  { value: 'visible', label: 'Visibles' },
  { value: 'hidden',  label: 'Ocultas' },
  { value: 'all',     label: 'Todas' },
];

function parseStatus(raw: string | null): ReviewListStatus {
  if (raw === 'hidden' || raw === 'all') return raw;
  return 'visible';
}

function parseRating(raw: string | null): number | undefined {
  const n = Number(raw);
  return n >= 1 && n <= 5 ? n : undefined;
}

export function ReviewsScreen() {
  const [params, setParams] = useSearchParams();
  const page   = Math.max(1, Number(params.get('page')) || 1);
  const q      = params.get('q') ?? '';
  const status = parseStatus(params.get('status'));
  const rating = parseRating(params.get('rating'));

  const { data, isLoading, isFetching, isError, refetch } = useReviews({
    page,
    pageSize: PAGE_SIZE,
    status,
    rating,
    search:   q,
  });

  // Estado local para los dialogs — solo uno abierto a la vez. Guardamos la
  // reseña target en el state para mostrar contexto en el dialog (email del
  // reviewer, preview del comment, etc.).
  const [hideTarget,   setHideTarget]   = useState<AdminReview | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [mutationError, setMutationError] = useState<string | undefined>(undefined);

  const hideMut   = useHideReview();
  const unhideMut = useUnhideReview();
  const deleteMut = useDeleteReview();

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

  function setStatus(next: ReviewListStatus) {
    const copy = new URLSearchParams(params);
    if (next === 'visible') copy.delete('status');
    else copy.set('status', next);
    copy.delete('page');
    setParams(copy, { replace: true });
  }

  function setRating(next: number | undefined) {
    const copy = new URLSearchParams(params);
    if (next) copy.set('rating', String(next));
    else copy.delete('rating');
    copy.delete('page');
    setParams(copy, { replace: true });
  }

  function handleHide(review: AdminReview) {
    setMutationError(undefined);
    setHideTarget(review);
  }

  function handleUnhide(review: AdminReview) {
    // Reactivar no requiere razón — es reversión de una decisión previa
    // cuya razón ya quedó en el audit log.
    unhideMut.mutate(review.id);
  }

  function handleDelete(review: AdminReview) {
    setMutationError(undefined);
    setDeleteTarget(review);
  }

  function confirmHide(reason: string) {
    if (!hideTarget) return;
    setMutationError(undefined);
    hideMut.mutate(
      { id: hideTarget.id, reason },
      {
        onSuccess: () => setHideTarget(null),
        onError:   (err) => setMutationError((err as Error).message),
      },
    );
  }

  function confirmDelete(reason: string) {
    if (!deleteTarget) return;
    setMutationError(undefined);
    deleteMut.mutate(
      { id: deleteTarget.id, reason },
      {
        onSuccess: () => setDeleteTarget(null),
        onError:   (err) => setMutationError((err as Error).message),
      },
    );
  }

  const rows  = data?.rows  ?? [];
  const total = data?.total ?? 0;

  const subtitle = isLoading
    ? 'Cargando reseñas…'
    : total === 0
      ? q
        ? `Sin resultados para "${q}".`
        : 'No hay reseñas en este filtro.'
      : total === 1
        ? '1 reseña.'
        : `${total} reseñas.`;

  return (
    <Page title="Reseñas" subtitle={subtitle}>
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
          placeholder="Buscar en el texto…"
        />
      </div>

      <div className={styles.ratingFilter} role="group" aria-label="Filtrar por rating">
        <button
          type="button"
          className={[
            styles.ratingChip,
            rating === undefined && styles.ratingChipActive,
          ].filter(Boolean).join(' ')}
          onClick={() => setRating(undefined)}
        >
          Todas
        </button>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={[
              styles.ratingChip,
              rating === n && styles.ratingChipActive,
            ].filter(Boolean).join(' ')}
            onClick={() => setRating(n)}
            aria-label={`${n} estrellas`}
          >
            {n} <Star size={12} aria-hidden className={styles.chipStar} />
          </button>
        ))}
      </div>

      {isLoading ? (
        <PageLoader label="Cargando reseñas…" />
      ) : isError ? (
        <div className={styles.errorBanner} role="alert">
          <p>No se pudieron cargar las reseñas.</p>
          <button type="button" className={styles.retry} onClick={() => refetch()}>
            Reintentar
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>
            {q ? 'Sin resultados' : 'No hay reseñas en este filtro'}
          </p>
          <p className={styles.emptyText}>
            {q
              ? 'Probá con otro texto o cambiá los filtros.'
              : 'Cambiá el filtro de estado o rating para ver otras.'}
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {rows.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHide={handleHide}
              onUnhide={handleUnhide}
              onDelete={handleDelete}
            />
          ))}
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
        open={hideTarget != null}
        onOpenChange={(open) => {
          if (!open) { setHideTarget(null); setMutationError(undefined); }
        }}
        title="Ocultar reseña"
        subject={
          hideTarget ? (
            <>
              <strong>{hideTarget.rating}/5</strong> por {hideTarget.reviewer_email ?? '—'}
              <br />
              <em>"{hideTarget.comment.slice(0, 140)}{hideTarget.comment.length > 140 ? '…' : ''}"</em>
            </>
          ) : undefined
        }
        confirmLabel="Ocultar"
        minLength={10}
        placeholder="Ej: contenido ofensivo, lenguaje discriminatorio…"
        hint="La razón queda en el audit log. La reseña podrá reactivarse después."
        isSubmitting={hideMut.isPending}
        errorMessage={mutationError}
        onConfirm={confirmHide}
      />

      <ConfirmWithReasonDialog
        open={deleteTarget != null}
        onOpenChange={(open) => {
          if (!open) { setDeleteTarget(null); setMutationError(undefined); }
        }}
        title="Eliminar reseña"
        subject={
          deleteTarget ? (
            <>
              <strong>Acción irreversible.</strong> Reseña {deleteTarget.rating}/5 por {deleteTarget.reviewer_email ?? '—'}.
              <br />
              <em>"{deleteTarget.comment.slice(0, 140)}{deleteTarget.comment.length > 140 ? '…' : ''}"</em>
            </>
          ) : undefined
        }
        confirmLabel="Eliminar definitivamente"
        tone="danger"
        minLength={20}
        placeholder="Ej: contenido ilegal, doxxing, spam agresivo reincidente…"
        hint="La razón y un snapshot completo de la reseña quedan en el audit log."
        isSubmitting={deleteMut.isPending}
        errorMessage={mutationError}
        onConfirm={confirmDelete}
      />
    </Page>
  );
}
