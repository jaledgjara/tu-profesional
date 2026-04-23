// ConfirmWithReasonDialog — dialog genérico para acciones de admin que requieren
// una razón obligatoria (se guarda en admin_audit_log).
//
// Extraído del patrón de RejectDialog para reusar en: ocultar/eliminar
// reseñas, suspender/eliminar clientes, desactivar profesionales, etc.
//
// Variantes:
//   - tone 'default' → botón confirm azul (primary)
//   - tone 'danger'  → botón confirm rojo (para destructivas como delete)
//
// Controlado: el parent abre/cierra y pasa `onConfirm`. El dialog NO se
// cierra solo al confirmar — el parent decide (típico: cerrar cuando la
// mutation termina exitosa).

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/shared/components/Button/Button';

import styles from './ConfirmWithReasonDialog.module.css';

interface ConfirmWithReasonDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  title:        string;
  /** Contexto del target (ej: "Reseña de usuario@mail.com", "Profesional: Juan"). */
  subject?:     ReactNode;
  /** Label del botón de confirmación (ej: "Ocultar", "Eliminar"). */
  confirmLabel: string;
  /** 'danger' para destructivas (delete). 'default' para reversibles (hide/suspend). */
  tone?:        'default' | 'danger';
  /** Mínimo de caracteres (sin espacios) de la razón. Default 10. */
  minLength?:   number;
  /** Placeholder del textarea. */
  placeholder?: string;
  /** Hint bajo el textarea (se reemplaza por el error si hay error). */
  hint?:        string;
  isSubmitting: boolean;
  errorMessage?: string;
  onConfirm:    (reason: string) => void;
}

export function ConfirmWithReasonDialog({
  open,
  onOpenChange,
  title,
  subject,
  confirmLabel,
  tone = 'default',
  minLength = 10,
  placeholder,
  hint = 'Esta razón se guarda en el audit log.',
  isSubmitting,
  errorMessage,
  onConfirm,
}: ConfirmWithReasonDialogProps) {
  const schema = useMemo(
    () =>
      z.object({
        reason: z.string()
          .trim()
          .min(minLength, `Al menos ${minLength} caracteres.`)
          .max(500, 'Máximo 500 caracteres.'),
      }),
    [minLength],
  );
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver:      zodResolver(schema),
    defaultValues: { reason: '' },
  });

  useEffect(() => {
    if (!open) reset({ reason: '' });
  }, [open, reset]);

  function onSubmit(values: FormValues) {
    onConfirm(values.reason.trim());
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content className={styles.content} aria-describedby={undefined}>
          <header className={styles.header}>
            <Dialog.Title className={styles.title}>{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className={styles.close} aria-label="Cerrar">
                <X size={18} aria-hidden />
              </button>
            </Dialog.Close>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            {subject ? <div className={styles.subject}>{subject}</div> : null}

            <label htmlFor="confirm-reason" className={styles.label}>
              Razón
            </label>
            <textarea
              id="confirm-reason"
              className={[
                styles.textarea,
                errors.reason && styles.textareaError,
              ].filter(Boolean).join(' ')}
              rows={5}
              placeholder={placeholder}
              aria-invalid={errors.reason ? true : undefined}
              aria-describedby={errors.reason ? 'confirm-reason-error' : 'confirm-reason-hint'}
              disabled={isSubmitting}
              {...register('reason')}
            />
            {errors.reason ? (
              <p id="confirm-reason-error" className={styles.fieldError} role="alert">
                {errors.reason.message}
              </p>
            ) : (
              <p id="confirm-reason-hint" className={styles.hint}>{hint}</p>
            )}

            {errorMessage ? (
              <p className={styles.formError} role="alert">{errorMessage}</p>
            ) : null}

            <footer className={styles.footer}>
              <Dialog.Close asChild>
                <Button type="button" variant="secondary" size="sm" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </Dialog.Close>
              <Button
                type="submit"
                variant={tone === 'danger' ? 'primary' : 'primary'}
                size="sm"
                isLoading={isSubmitting}
                className={tone === 'danger' ? styles.confirmDanger : undefined}
              >
                {confirmLabel}
              </Button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
