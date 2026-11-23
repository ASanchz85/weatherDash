import type { ReactNode } from 'react';

import { ROTATION_FADE_STYLE } from '../features/rotation/fadeStyle';
import type { Theme } from '../types/theme';
import styles from './HeroPanel.module.css';

interface HeroPanelProps {
  label: string;
  theme: Theme;
  children: ReactNode;
}

/** Panel principal con la foto de día o de noche, oscurecida para dar contraste al contenido. */
export function HeroPanel({ label, theme, children }: HeroPanelProps) {
  return (
    <section className={styles.hero} aria-label={label} data-theme={theme} style={ROTATION_FADE_STYLE}>
      <div className={`${styles.image} ${styles.day}`} data-hero-image="day" aria-hidden="true" />
      <div className={`${styles.image} ${styles.night}`} data-hero-image="night" aria-hidden="true" />
      <div className={styles.content}>{children}</div>
    </section>
  );
}
