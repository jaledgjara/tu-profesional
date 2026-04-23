// Card de una solicitud pendiente en el listado. Sin acciones — solo muestra
// la info resumida y un botón "Ver más" que lleva al detalle completo, donde
// el admin decide aprobar o rechazar con toda la info a la vista.

import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, IdCard, Clock } from 'lucide-react';

import type { PendingProfessional } from '@/features/professionals/services/professionalsService';

import styles from './RequestCard.module.css';

interface RequestCardProps {
  pro: PendingProfessional;
}

export function RequestCard({ pro }: RequestCardProps) {
  const initial = (pro.full_name?.charAt(0) || pro.email?.charAt(0) || '?').toUpperCase();
  const areasShown = pro.professional_area.slice(0, 3);
  const areasRest  = pro.professional_area.length - areasShown.length;

  return (
    <article className={styles.card}>
      <header className={styles.header}>
        {pro.photo_url ? (
          <img src={pro.photo_url} alt="" className={styles.avatar} loading="lazy" />
        ) : (
          <span className={styles.avatarFallback} aria-hidden>{initial}</span>
        )}
        <div className={styles.identity}>
          <h3 className={styles.name}>{pro.full_name || 'Sin nombre'}</h3>
          <p className={styles.email}>{pro.email || '—'}</p>
        </div>
        <span className={styles.waitTime}>
          <Clock size={12} aria-hidden />
          hace {formatDistanceToNow(new Date(pro.created_at), { locale: es })}
        </span>
      </header>

      <div className={styles.body}>
        <p className={styles.specialty}>{pro.specialty || 'Sin especialidad cargada'}</p>
        {areasShown.length > 0 ? (
          <div className={styles.areas}>
            {areasShown.map((area) => (
              <span key={area} className={styles.areaPill}>{area}</span>
            ))}
            {areasRest > 0 ? (
              <span className={styles.areaMore}>+{areasRest}</span>
            ) : null}
          </div>
        ) : null}
      </div>

      <footer className={styles.footer}>
        <span className={styles.license} title="Matrícula">
          <IdCard size={14} aria-hidden />
          {pro.license || 'Sin matrícula'}
        </span>
        <Link to={`/requests/${pro.id}`} className={styles.cta}>
          Ver más
          <ArrowRight size={14} aria-hidden />
        </Link>
      </footer>
    </article>
  );
}
