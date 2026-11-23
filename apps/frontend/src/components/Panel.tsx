import type { ReactNode } from 'react';

import styles from './Panel.module.css';

interface PanelProps {
  as: 'aside' | 'section';
  label: string;
  /** Solo para colocación y relleno propios del espacio; el aspecto de la tarjeta es común. */
  className?: string | undefined;
  children: ReactNode;
}

/** Tarjeta base compartida por los espacios que no son el hero (superficie, borde y radio). */
export function Panel({ as: Element, label, className, children }: PanelProps) {
  return (
    <Element className={[styles.panel, className].filter(Boolean).join(' ')} aria-label={label}>
      {children}
    </Element>
  );
}
