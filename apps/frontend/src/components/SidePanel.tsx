import type { ReactNode } from 'react';

import styles from './SidePanel.module.css';

interface SidePanelProps {
  label: string;
  children: ReactNode;
}

export function SidePanel({ label, children }: SidePanelProps) {
  return (
    <aside className={styles.panel} aria-label={label}>
      {children}
    </aside>
  );
}
