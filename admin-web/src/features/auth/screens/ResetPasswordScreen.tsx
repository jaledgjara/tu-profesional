// ResetPasswordScreen — form para pedir email de recuperación de contraseña.
// Respondemos siempre lo mismo (exista o no el email): así no revelamos
// si una cuenta existe (enumeración de usuarios).

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AuthLayout } from '@/shared/layouts/AuthLayout';
import { Input } from '@/shared/components/Input/Input';
import { Button } from '@/shared/components/Button/Button';
import { requestPasswordReset } from '@/features/auth/services/adminAuthService';

import styles from './ResetPasswordScreen.module.css';

const schema = z.object({
  email: z.string().trim().email({ message: 'Email inválido' }),
});

type FormData = z.infer<typeof schema>;

export function ResetPasswordScreen() {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: FormData) {
    // Ignoramos el error silenciosamente: nunca revelamos si el email existe.
    try {
      await requestPasswordReset(values.email);
    } catch {
      // noop
    } finally {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <AuthLayout
        title="Revisá tu email"
        subtitle="Si el email está registrado como admin, te enviamos un link para definir una contraseña nueva."
        footer={<Link to="/login">Volver al login</Link>}
      >
        <p className={styles.helper}>
          Puede tardar hasta un minuto en llegar. Si no lo ves, revisá la carpeta de spam.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Recuperar contraseña"
      subtitle="Te mandamos un link al email para que definas una contraseña nueva."
      footer={<Link to="/login">Volver al login</Link>}
    >
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Enviar link
        </Button>
      </form>
    </AuthLayout>
  );
}
