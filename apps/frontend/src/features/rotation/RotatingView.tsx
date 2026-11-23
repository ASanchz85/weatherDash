import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';

import { ROTATION_FADE_MS } from '../../config';
import styles from './RotatingView.module.css';

export interface RotatingViewItem {
  id: string;
  content: ReactNode;
}

interface RotatingViewProps {
  views: readonly RotatingViewItem[];
  page: number;
}

type FadeStyle = CSSProperties & { '--rotation-fade-ms': string };

function fadeDurationMs(): number {
  const prefersReducedMotion =
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return prefersReducedMotion ? 0 : ROTATION_FADE_MS;
}

/** Muestra la vista de la página activa; al cambiar, funde la actual a transparente y después aparece la nueva. */
export function RotatingView({ views, page }: RotatingViewProps) {
  const target = views[page % views.length];
  const targetId = target?.id;
  const [shownId, setShownId] = useState(targetId);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    if (targetId === shownId) {
      setFadingOut(false);
      return;
    }

    const fadeMs = fadeDurationMs();
    if (fadeMs === 0) {
      setShownId(targetId);
      return;
    }

    setFadingOut(true);
    const timeoutId = window.setTimeout(() => {
      setShownId(targetId);
      setFadingOut(false);
    }, fadeMs);
    return () => window.clearTimeout(timeoutId);
  }, [targetId, shownId]);

  // El contenido se busca por id para que los datos nuevos de la vista visible se reflejen sin esperar al cambio.
  const shown = views.find((view) => view.id === shownId) ?? target;
  const style: FadeStyle = { '--rotation-fade-ms': `${ROTATION_FADE_MS}ms` };

  return (
    <div className={styles.view} data-fading={fadingOut} style={style}>
      {shown?.content}
    </div>
  );
}
