import type { ReactNode } from 'react';

import styles from './ForecastPanel.module.css';
import { Panel } from './Panel';

interface ForecastPanelProps {
  label: string;
  children: ReactNode;
}

/** Franja inferior a ancho completo para la predicción de varios días. */
export function ForecastPanel({ label, children }: ForecastPanelProps) {
  return (
    <Panel as="section" label={label} className={styles.layout}>
      {children}
    </Panel>
  );
}
