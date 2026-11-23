import type { ReactNode } from 'react';

import styles from './HeroPanel.module.css';

interface HeroPanelProps {
  label: string;
  children: ReactNode;
}

/** Panel principal con la imagen de fondo oscurecida para dar contraste al contenido. */
export function HeroPanel({ label, children }: HeroPanelProps) {
  return (
    <section className={styles.hero} aria-label={label}>
      <div className={styles.content}>{children}</div>
    </section>
  );
}
