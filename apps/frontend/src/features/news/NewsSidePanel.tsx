import type { CSSProperties } from 'react';

import { SidePanel } from '../../components/SidePanel';
import { NEWS_FEED_LABELS, type NewsRotation } from '../../types/news';
import detailsStyles from '../weather/WeatherDetails.module.css';
import { formatCommemorationsTitle } from './newsFormat';
import styles from './NewsSidePanel.module.css';

/** Hasta este número de huecos, cada titular tiene altura para tres líneas; con más, para dos. */
const ROOMY_SLOTS = 5;

interface NewsSidePanelProps {
  rotation: NewsRotation;
  /** Noticia que se muestra en el hero; se resalta en la lista. */
  activeIndex: number;
}

/** Las efemérides se titulan con la fecha de la que hablan; el resto de feeds, con su nombre. */
function panelTitle({ feed, items }: NewsRotation): string {
  if (feed !== 'commemorations') return NEWS_FEED_LABELS[feed];
  const first = items[0];
  return formatCommemorationsTitle(first ? new Date(first.publishedAt) : new Date());
}

/** Titulares de la rotación bajo el nombre del feed; la noticia activa se resalta en naranja. */
export function NewsSidePanel({ rotation, activeIndex }: NewsSidePanelProps) {
  const slots = Math.max(rotation.size, rotation.items.length);
  const listStyle = { '--slots': slots, '--lines': slots <= ROOMY_SLOTS ? 3 : 2 } as CSSProperties;
  const isCommemorations = rotation.feed === 'commemorations';

  return (
    <SidePanel label="Noticias">
      <article className={`${detailsStyles.details} ${styles.panel}`}>
        <header>
          <h2 className={isCommemorations ? `${detailsStyles.location} ${styles.longTitle}` : detailsStyles.location}>
            {panelTitle(rotation)}
          </h2>
        </header>
        <ol className={styles.headlines} style={listStyle}>
          {rotation.items.map((item, index) => (
            <li
              key={item.id}
              className={index === activeIndex ? `${styles.headline} ${styles.active}` : styles.headline}
              aria-current={index === activeIndex ? 'true' : undefined}
            >
              <span className={styles.title}>{item.title}</span>
            </li>
          ))}
        </ol>
      </article>
    </SidePanel>
  );
}
