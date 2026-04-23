// Grid responsive de cards de solicitudes. En desktop 2 columnas, en mobile 1.

import type { PendingProfessional } from '@/features/professionals/services/professionalsService';
import { RequestCard } from './RequestCard';

import styles from './RequestsList.module.css';

interface RequestsListProps {
  data: PendingProfessional[];
}

export function RequestsList({ data }: RequestsListProps) {
  return (
    <div className={styles.grid}>
      {data.map((pro) => (
        <RequestCard key={pro.id} pro={pro} />
      ))}
    </div>
  );
}
