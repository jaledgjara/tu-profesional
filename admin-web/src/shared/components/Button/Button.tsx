// Button primitivo. Variants: primary (CTA), secondary (outline), ghost (link-like).
// Size: md (default) | sm. Siempre pill (radius-full) para mantener identidad con mobile.

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size    = 'md' | 'sm';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant;
  size?:     Size;
  isLoading?: boolean;
  fullWidth?: boolean;
  children:   ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      isLoading = false,
      fullWidth = false,
      disabled,
      className,
      children,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      styles.root,
      styles[`variant_${variant}`],
      styles[`size_${size}`],
      fullWidth && styles.fullWidth,
      isLoading && styles.loading,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...rest}
      >
        {isLoading ? <span className={styles.spinner} aria-hidden /> : null}
        <span className={styles.label}>{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
