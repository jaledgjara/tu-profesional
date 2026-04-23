// Dialog modal para rechazar una solicitud. Pide razón obligatoria (min 10
// chars — la misma validación vive en el RPC, acá es para feedback inmediato).
//
// El componente es controlado: el parent abre/cierra y pasa onConfirm.
// Al confirmar el dialog no se cierra solo — el parent decide cuándo cerrarlo
// (típicamente cuando la mutation termina exitosa).

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { Button } from '@/shared/components/Button/Button';

import styles from './RejectDialog.module.css';

const schema = z.object({
  reason: z.string()
    .trim()
    .min(10, 'La razón debe tener al menos 10 caracteres.')
    .max(500, 'La razón no puede superar los 500 caracteres.'),
});

type FormValues = z.infer<typeof schema>;

interface RejectDialogProps {
  open:         boolean;
  onOpenChange: (open: boolean) => void;
  professionalName: string;
  isSubmitting: boolean;
  errorMessage?: string;
  onConfirm:    (reason: string) => void;
}

export function RejectDialog({
  open,
  onOpenChange,
  professionalName,
  isSubmitting,
  errorMessage,
  onConfirm,
}: RejectDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reason: '' },
  });

  // Reset al cerrar para que la próxima vez abra limpio
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
            <Dialog.Title className={styles.title}>Rechazar solicitud</Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className={styles.close} aria-label="Cerrar">
                <X size={18} aria-hidden />
              </button>
            </Dialog.Close>
          </header>

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
            <p className={styles.subject}>
              Profesional: <strong>{professionalName || 'Sin nombre'}</strong>
            </p>

            <label htmlFor="reject-reason" className={styles.label}>
              Razón del rechazo
            </label>
            <textarea
              id="reject-reason"
              className={[
                styles.textarea,
                errors.reason && styles.textareaError,
              ].filter(Boolean).join(' ')}
              rows={5}
              placeholder="Ej: matrícula inválida o datos insuficientes para verificar la identidad."
              aria-invalid={errors.reason ? true : undefined}
              aria-describedby={errors.reason ? 'reject-reason-error' : undefined}
              disabled={isSubmitting}
              {...register('reason')}
            />
            {errors.reason ? (
              <p id="reject-reason-error" className={styles.fieldError} role="alert">
                {errors.reason.message}
              </p>
            ) : (
              <p className={styles.hint}>
                Esta razón se guardará en el audit log y podrá mostrarse al profesional.
              </p>
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
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Confirmar rechazo
              </Button>
            </footer>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
