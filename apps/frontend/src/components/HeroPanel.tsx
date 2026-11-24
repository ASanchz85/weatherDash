import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { ROTATION_FADE_MS } from '../config';
import { ROTATION_FADE_STYLE } from '../features/rotation/fadeStyle';
import type { Theme } from '../types/theme';
import styles from './HeroPanel.module.css';

interface HeroPanelProps {
  label: string;
  /** Solo se expone como atributo; la foto la decide quien usa el panel. */
  theme?: Theme;
  /** Foto de fondo; al cambiar, la nueva se funde sobre la anterior. */
  imageUrl?: string | null;
  /** `news` añade una capa extra de oscurecimiento para leer mejor el texto. */
  variant?: 'default' | 'news';
  /** Pie de foto discreto en la esquina inferior derecha. */
  caption?: string;
  children: ReactNode;
}

function photoStyle(url: string): CSSProperties {
  return { backgroundImage: `url(${JSON.stringify(url)})` };
}

/** Mantiene la foto anterior debajo mientras la nueva aparece, para fundirlas en lugar de cortarlas. */
function PhotoLayers({ url }: { url: string | null | undefined }) {
  const [layers, setLayers] = useState<string[]>(url ? [url] : []);

  useEffect(() => {
    if (!url) {
      setLayers([]);
      return;
    }
    setLayers((previous) => (previous.at(-1) === url ? previous : [...previous.slice(-1), url]));
    const id = window.setTimeout(() => setLayers([url]), ROTATION_FADE_MS * 2 + 50);
    return () => window.clearTimeout(id);
  }, [url]);

  return layers.map((layer, index) => (
    <div
      key={layer}
      className={index === 0 ? styles.image : `${styles.image} ${styles.enter}`}
      style={photoStyle(layer)}
      data-hero-image="photo"
      aria-hidden="true"
    />
  ));
}

/** Panel principal con una foto oscurecida para dar contraste al contenido. */
export function HeroPanel({ label, theme = 'day', imageUrl, variant = 'default', caption, children }: HeroPanelProps) {
  return (
    <section
      className={styles.hero}
      aria-label={label}
      data-theme={theme}
      data-variant={variant}
      style={ROTATION_FADE_STYLE}
    >
      <PhotoLayers url={imageUrl} />
      <div className={styles.content}>{children}</div>
      {caption && <p className={styles.caption}>{caption}</p>}
    </section>
  );
}
