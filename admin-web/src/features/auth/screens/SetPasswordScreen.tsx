// SetPasswordScreen — pantalla a la que caen tanto los invites como los
// password resets. Supabase (con detectSessionInUrl: true) parsea el hash
// del link y levanta una sesión "recovery": con eso, updatePassword alcanza.
//
// Si el usuario cae acá sin sesión (link expirado o mal formado), no podemos
// hacer nada útil: mostramos un mensaje y lo mandamos al login.

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AuthLayout } from '@/shared/layouts/AuthLayout';
import { Input } from '@/shared/components/Input/Input';
import { Button } from '@/shared/components/Button/Button';
import { PageLoader } from '@/shared/components/PageLoader/PageLoader';
import { useSession } from '@/app/providers/useSession';
import { updatePassword } from '@/features/auth/services/adminAuthService';

import styles from './SetPasswordScreen.module.css';

const schema = z
  .object({
    newPassword:     z.string().min(8, { message: 'Mínimo 8 caracteres' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path:    ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function SetPasswordScreen() {
  const navigate = useNavigate();
  const { session, isLoading } = useSession();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  if (isLoading) return <PageLoader />;

  // Sin sesión activa, el link está vencido o fue manipulado.
  if (!session) {
    return (
      <AuthLayout
        title="Link inválido"
        subtitle="El link de invite o reset expiró o ya fue usado."
        footer={<Link to="/login">Volver al login</Link>}
      >
        <p className={styles.helper}>
          Pedile a un admin que te genere un nuevo invite, o usá
          "Recuperar contraseña" si ya tenés cuenta.
        </p>
      </AuthLayout>
    );
  }

  async function onSubmit(values: FormData) {
    setFormError(null);
    try {
      await updatePassword(values.newPassword);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.';
      setFormError(message);
    }
  }

  return (
    <AuthLayout
      title="Definí tu contraseña"
      subtitle="Esta será tu contraseña para acceder al panel."
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          autoFocus
          hint="Mínimo 8 caracteres."
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <Input
          label="Repetí la contraseña"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Guardar contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}
