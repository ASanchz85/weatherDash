import type { CSSProperties, ReactNode } from 'react';

import { ROTATION_FADE_STYLE } from '../features/rotation/fadeStyle';
import type { Theme } from '../types/theme';
import styles from './HeroPanel.module.css';

interface HeroPanelProps {
  label: string;
  /** Tema de la foto de Navaluenga; se ignora si se indica `imageUrl`. */
  theme?: Theme;
  /** Foto propia (una noticia) que sustituye a la de día y de noche. */
  imageUrl?: string;
  children: ReactNode;
}

/** Panel principal con una foto oscurecida para dar contraste al contenido: la de día o de noche, o la indicada. */
export function HeroPanel({ label, theme = 'day', imageUrl, children }: HeroPanelProps) {
  const photoStyle: CSSProperties | undefined = imageUrl
    ? { backgroundImage: `url(${JSON.stringify(imageUrl)})` }
    : undefined;

  return (
    <section className={styles.hero} aria-label={label} data-theme={theme} style={ROTATION_FADE_STYLE}>
      {imageUrl ? (
        <div className={styles.image} style={photoStyle} data-hero-image="custom" aria-hidden="true" />
      ) : (
        <>
          <div className={`${styles.image} ${styles.day}`} data-hero-image="day" aria-hidden="true" />
          <div className={`${styles.image} ${styles.night}`} data-hero-image="night" aria-hidden="true" />
        </>
      )}
      <div className={styles.content}>{children}</div>
    </section>
  );
}
