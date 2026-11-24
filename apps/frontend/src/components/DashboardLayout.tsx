import type { ReactNode } from 'react';

import styles from './DashboardLayout.module.css';

/** Rejilla común del dashboard: hero a la izquierda, card lateral a la derecha y franja inferior. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return <div className={styles.dashboard}>{children}</div>;
}
