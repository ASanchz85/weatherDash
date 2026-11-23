import type { ReactNode } from 'react';

import { Panel } from './Panel';
import styles from './SidePanel.module.css';

interface SidePanelProps {
  label: string;
  children: ReactNode;
}

export function SidePanel({ label, children }: SidePanelProps) {
  return (
    <Panel as="aside" label={label} className={styles.padding}>
      {children}
    </Panel>
  );
}
