import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import styles from './Metric.module.css';

export type MetricTone = 'good' | 'warning' | 'accent' | 'danger';

interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  /** Texto breve junto al valor, con el color del tono si lo hay. */
  detail?: string;
  highlighted?: boolean;
  /** Tinta la ficha con un color de estado (calidad del aire). */
  tone?: MetricTone;
  /** Altura reducida para vistas con muchas fichas. */
  compact?: boolean;
  /** Ocupa todas las columnas de la cuadrícula. */
  wide?: boolean;
}

/** Ficha de una medida (etiqueta con icono y valor) para listas de definición <dl>. */
export function Metric({
  icon: Icon,
  label,
  value,
  detail,
  highlighted = false,
  tone,
  compact = false,
  wide = false,
}: MetricProps) {
  const className = [
    styles.metric,
    highlighted && styles.highlighted,
    tone && styles.toned,
    compact && styles.compact,
    wide && styles.wide,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} data-tone={tone}>
      <dt className={styles.label}>
        <Icon className={styles.icon} strokeWidth={1.75} aria-hidden="true" />
        {label}
      </dt>
      <dd className={styles.value}>
        {value}
        {detail && <span className={styles.detail}>{detail}</span>}
      </dd>
    </div>
  );
}
