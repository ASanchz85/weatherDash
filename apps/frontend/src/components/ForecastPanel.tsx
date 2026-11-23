import type { ReactNode } from 'react';

import styles from './ForecastPanel.module.css';

interface ForecastPanelProps {
  label: string;
  children: ReactNode;
}

/** Franja inferior a ancho completo para la predicción de varios días. */
export function ForecastPanel({ label, children }: ForecastPanelProps) {
  return (
    <section className={styles.panel} aria-label={label}>
      {children}
    </section>
  );
}
