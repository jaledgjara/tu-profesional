// Pagination — control de paginación server-side.
// Tonto: recibe page/pageSize/total y dispara onChange. La screen
// sincroniza con URL search params.
//
// Comportamiento:
//   - Oculta todo si total === 0 (la screen muestra empty state).
//   - "Mostrando X–Y de Z" a la izquierda, navegación a la derecha.
//   - Muestra página actual como input editable (salto directo).
//   - Prev/next deshabilitados en bordes.

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

import styles from './Pagination.module.css';

interface PaginationProps {
  /** Página actual (1-indexed). */
  page:       number;
  pageSize:   number;
  total:      number;
  onChange:   (page: number) => void;
  /** Si está true, prev/next quedan deshabilitados (ej: fetching). */
  disabled?:  boolean;
}

export function Pagination({ page, pageSize, total, onChange, disabled }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from       = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to         = Math.min(page * pageSize, total);

  // Input local para permitir que el usuario tipee sin disparar fetches
  // hasta que haga Enter o salga del input. En paralelo se mantiene
  // sincronizado con la prop `page` durante el render (patrón "adjust
  // state during render" — evita set-state-in-effect).
  // Ref: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [draft, setDraft] = useState(String(page));
  const [lastExternalPage, setLastExternalPage] = useState(page);
  if (page !== lastExternalPage) {
    setLastExternalPage(page);
    setDraft(String(page));
  }

  function commitDraft() {
    const parsed = Number(draft);
    if (!Number.isFinite(parsed)) { setDraft(String(page)); return; }
    const clamped = Math.min(totalPages, Math.max(1, Math.floor(parsed)));
    if (clamped !== page) onChange(clamped);
    setDraft(String(clamped));
  }

  if (total === 0) return null;

  return (
    <nav className={styles.root} aria-label="Paginación">
      <p className={styles.summary}>
        Mostrando <strong>{from}</strong>–<strong>{to}</strong> de <strong>{total}</strong>
      </p>

      <div className={styles.controls}>
        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => onChange(page - 1)}
          disabled={disabled || page <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft size={16} aria-hidden />
        </button>

        <div className={styles.pageInfo}>
          <input
            type="text"
            inputMode="numeric"
            className={styles.pageInput}
            value={draft}
            onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ''))}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commitDraft(); }
            }}
            aria-label="Página actual"
            disabled={disabled}
          />
          <span className={styles.pageTotal}>/ {totalPages}</span>
        </div>

        <button
          type="button"
          className={styles.iconBtn}
          onClick={() => onChange(page + 1)}
          disabled={disabled || page >= totalPages}
          aria-label="Página siguiente"
        >
          <ChevronRight size={16} aria-hidden />
        </button>
      </div>
    </nav>
  );
}
