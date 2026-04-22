// LoginScreen — email + password. Si venía de un redirect con error
// (ej: RequireAdmin kickeándolo), mostramos ese mensaje encima del form.
// Después de login OK, bounce-back a `state.from` si existe.

import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AuthLayout } from '@/shared/layouts/AuthLayout';
import { Input } from '@/shared/components/Input/Input';
import { Button } from '@/shared/components/Button/Button';
import { signInWithPassword } from '@/features/auth/services/adminAuthService';

import styles from './LoginScreen.module.css';

const loginSchema = z.object({
  email:    z.string().trim().email({ message: 'Email inválido' }),
  password: z.string().min(8, { message: 'Mínimo 8 caracteres' }),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LocationState {
  from?:  string;
  error?: string;
}

export function LoginScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as LocationState | null;

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(values: LoginFormData) {
    setFormError(null);
    try {
      await signInWithPassword(values.email, values.password);
      navigate(state?.from ?? '/', { replace: true });
    } catch {
      // Mensaje genérico — no revelamos si el email existe o no.
      setFormError('Credenciales inválidas.');
    }
  }

  const redirectError = state?.error;

  return (
    <AuthLayout
      title="Ingresá al panel"
      subtitle="Acceso restringido — sólo administradores."
      footer={
        <span>
          ¿Problemas para entrar? <Link to="/reset-password">Recuperar contraseña</Link>
        </span>
      }
    >
      {redirectError ? <div className={styles.banner} role="alert">{redirectError}</div> : null}

      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          autoFocus
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {formError ? <p className={styles.formError} role="alert">{formError}</p> : null}

        <Button type="submit" fullWidth isLoading={isSubmitting}>
          Entrar
        </Button>
      </form>
    </AuthLayout>
  );
}
