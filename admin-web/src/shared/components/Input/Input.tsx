// Input con label + mensaje de error opcional. Usado por todos los forms de auth.
// Si se pasa `error`, se renderiza el mensaje debajo y el input muestra borde rojo.

import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label:   string;
  error?:  string;
  hint?:   string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const hintId = `${inputId}-hint`;
    const errorId = `${inputId}-error`;

    return (
      <div className={styles.field}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={[styles.input, error && styles.inputError, className].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          {...rest}
        />
        {error ? (
          <p id={errorId} className={styles.error} role="alert">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
