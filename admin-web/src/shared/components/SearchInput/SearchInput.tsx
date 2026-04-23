// SearchInput — input de búsqueda con debounce interno. Guarda el valor
// local mientras el usuario tipea y recién dispara `onChange` cuando pasan
// `debounceMs` sin nuevas teclas. Evita refetchear en cada letra.
//
// Es "semi-controlado": si el parent resetea la prop `value` desde afuera
// (ej: clear externo), el draft local se sincroniza.

import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import styles from './SearchInput.module.css';

interface SearchInputProps {
  value:        string;
  onChange:     (value: string) => void;
  placeholder?: string;
  debounceMs?:  number;
  /** Hint por debajo del input (opcional). */
  hint?:        string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar…',
  debounceMs = 300,
  hint,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  // Sombra del último `value` externo visto: nos permite detectar cambios
  // de prop y resincronizar el draft durante el render (ver abajo).
  const [lastExternalValue, setLastExternalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync externo → local. "Adjust state during render" es el patrón
  // recomendado por React para state derivado de prop: evita el flash
  // de un render con data vieja y el lint de set-state-in-effect.
  // Ref: https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (value !== lastExternalValue) {
    setLastExternalValue(value);
    setDraft(value);
  }

  // Debounce local → parent.
  useEffect(() => {
    if (draft === value) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(draft), debounceMs);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, debounceMs, onChange, value]);

  function clear() {
    setDraft('');
    onChange('');
  }

  return (
    <div className={styles.root}>
      <div className={styles.inputWrap}>
        <Search size={16} className={styles.icon} aria-hidden />
        <input
          type="search"
          className={styles.input}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={placeholder}
        />
        {draft ? (
          <button
            type="button"
            className={styles.clear}
            onClick={clear}
            aria-label="Limpiar búsqueda"
          >
            <X size={14} aria-hidden />
          </button>
        ) : null}
      </div>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
    </div>
  );
}
